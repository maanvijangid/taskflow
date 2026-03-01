import { Response } from 'express';
import { prisma } from '../config/db.js';
import { AuthRequest, DashboardStats } from '../types/index.js';
import {
  CreateTaskInput,
  UpdateTaskInput,
  ChangeStageInput,
  AddActivityInput,
  AddSubTaskInput,
} from '../schemas/task.schema.js';
import { Stage, Priority, ActivityType, NotificationType } from '@prisma/client';
import { getIO } from '../socket.js';

export const createTask = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const { title, description, priority, stage, dueDate, assigneeEmail } = req.body as CreateTaskInput;

  let assigneeId: string | null = null;

  // Check if assignee exists
  if (assigneeEmail) {
    const assignee = await prisma.user.findUnique({
      where: { email: assigneeEmail.toLowerCase() },
    });
    assigneeId = assignee?.id ?? null;
  }

  const task = await prisma.task.create({
    data: {
      title,
      description,
      priority,
      stage,
      dueDate: dueDate ? new Date(dueDate) : null,
      userId,
      assigneeEmail: assigneeEmail?.toLowerCase(),
      assigneeId,
      activities: {
        create: {
          type: ActivityType.CREATED,
          description: `Task created by ${req.user!.name}`,
          userId,
        },
      },
    },
    include: {
      user: { select: { id: true, name: true, email: true, profilePic: true } },
      assignee: { select: { id: true, name: true, email: true, profilePic: true } },
      subTasks: true,
      activities: {
        include: { user: { select: { id: true, name: true, profilePic: true } } },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  // Create notification if assignee exists and is different from creator
  if (assigneeId && assigneeId !== userId) {
    await prisma.notification.create({
      data: {
        type: NotificationType.ASSIGNMENT,
        text: `${req.user!.name} assigned you to: ${title}`,
        receiverId: assigneeId,
        senderId: userId,
        taskId: task.id,
      },
    });

    // Emit real-time notification
    const io = getIO();
    io.to(`user:${assigneeId}`).emit('notification', {
      type: 'ASSIGNMENT',
      message: `${req.user!.name} assigned you to: ${title}`,
      taskId: task.id,
    });

    io.to(`user:${assigneeId}`).emit('task:assigned', task);
  }

  res.status(201).json({
    success: true,
    message: 'Task created successfully',
    data: { task },
  });
};

export const getTasks = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const {
    stage,
    priority,
    isTrashed,
    search,
    page = '1',
    limit = '20',
    view = 'all',
  } = req.query as Record<string, string | undefined>;

  const pageNum = Math.max(1, parseInt(page || '1', 10));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit || '20', 10)));
  const skip = (pageNum - 1) * limitNum;

  // Base filter: tasks created by user OR assigned to user
  const baseFilter = view === 'assigned'
    ? { assigneeId: userId }
    : view === 'created'
      ? { userId }
      : {
          OR: [
            { userId },
            { assigneeId: userId },
          ],
        };

  const where = {
    ...baseFilter,
    isTrashed: isTrashed === 'true',
    ...(stage && { stage: stage as Stage }),
    ...(priority && { priority: priority as Priority }),
    ...(search && {
      OR: [
        { title: { contains: search, mode: 'insensitive' as const } },
        { description: { contains: search, mode: 'insensitive' as const } },
      ],
    }),
  };

  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, profilePic: true } },
        assignee: { select: { id: true, name: true, email: true, profilePic: true } },
        subTasks: true,
        _count: { select: { activities: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limitNum,
    }),
    prisma.task.count({ where }),
  ]);

  res.json({
    success: true,
    data: {
      tasks,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    },
  });
};

export const getTask = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user!.id;

  const task = await prisma.task.findFirst({
    where: {
      id,
      OR: [{ userId }, { assigneeId: userId }],
    },
    include: {
      user: { select: { id: true, name: true, email: true, profilePic: true } },
      assignee: { select: { id: true, name: true, email: true, profilePic: true } },
      subTasks: { orderBy: { createdAt: 'asc' } },
      activities: {
        include: { user: { select: { id: true, name: true, profilePic: true } } },
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
    },
  });

  if (!task) {
    res.status(404).json({
      success: false,
      error: 'Task not found',
    });
    return;
  }

  res.json({
    success: true,
    data: { task },
  });
};

export const updateTask = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user!.id;
  const { title, description, priority, stage, dueDate, assigneeEmail } = req.body as UpdateTaskInput;

  const existingTask = await prisma.task.findFirst({
    where: { id, userId },
  });

  if (!existingTask) {
    res.status(404).json({
      success: false,
      error: 'Task not found or you do not have permission to edit',
    });
    return;
  }

  let assigneeId: string | null | undefined;
  const newAssigneeEmail = assigneeEmail?.toLowerCase();

  // Handle assignee update
  if (newAssigneeEmail !== undefined) {
    if (newAssigneeEmail === null || newAssigneeEmail === '') {
      assigneeId = null;
    } else {
      const assignee = await prisma.user.findUnique({
        where: { email: newAssigneeEmail },
      });
      assigneeId = assignee?.id ?? null;
    }
  }

  const task = await prisma.task.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(priority !== undefined && { priority }),
      ...(stage !== undefined && { stage }),
      ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
      ...(newAssigneeEmail !== undefined && { assigneeEmail: newAssigneeEmail || null }),
      ...(assigneeId !== undefined && { assigneeId }),
      activities: {
        create: {
          type: ActivityType.UPDATED,
          description: `Task updated by ${req.user!.name}`,
          userId,
        },
      },
    },
    include: {
      user: { select: { id: true, name: true, email: true, profilePic: true } },
      assignee: { select: { id: true, name: true, email: true, profilePic: true } },
      subTasks: true,
      activities: {
        include: { user: { select: { id: true, name: true, profilePic: true } } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  });

  // Notify new assignee if changed
  if (
    assigneeId &&
    assigneeId !== userId &&
    assigneeId !== existingTask.assigneeId
  ) {
    await prisma.notification.create({
      data: {
        type: NotificationType.ASSIGNMENT,
        text: `${req.user!.name} assigned you to: ${task.title}`,
        receiverId: assigneeId,
        senderId: userId,
        taskId: task.id,
      },
    });

    const io = getIO();
    io.to(`user:${assigneeId}`).emit('notification', {
      type: 'ASSIGNMENT',
      message: `${req.user!.name} assigned you to: ${task.title}`,
      taskId: task.id,
    });
    io.to(`user:${assigneeId}`).emit('task:assigned', task);
  }

  // Emit task update
  const io = getIO();
  io.to(`task:${id}`).emit('task:updated', task);

  res.json({
    success: true,
    message: 'Task updated successfully',
    data: { task },
  });
};

export const changeStage = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user!.id;
  const { stage } = req.body as ChangeStageInput;

  const existingTask = await prisma.task.findFirst({
    where: {
      id,
      OR: [{ userId }, { assigneeId: userId }],
    },
  });

  if (!existingTask) {
    res.status(404).json({
      success: false,
      error: 'Task not found or you do not have permission',
    });
    return;
  }

  const activityType =
    stage === Stage.COMPLETED
      ? ActivityType.COMPLETED
      : stage === Stage.IN_PROGRESS
        ? ActivityType.STARTED
        : ActivityType.UPDATED;

  const task = await prisma.task.update({
    where: { id },
    data: {
      stage,
      activities: {
        create: {
          type: activityType,
          description: `Stage changed to ${stage.replace('_', ' ')} by ${req.user!.name}`,
          userId,
        },
      },
    },
    include: {
      user: { select: { id: true, name: true, email: true, profilePic: true } },
      assignee: { select: { id: true, name: true, email: true, profilePic: true } },
      subTasks: true,
    },
  });

  // Notify task creator if stage changed by assignee
  if (existingTask.userId !== userId) {
    await prisma.notification.create({
      data: {
        type: stage === Stage.COMPLETED ? NotificationType.COMPLETED : NotificationType.ALERT,
        text: `${req.user!.name} ${stage === Stage.COMPLETED ? 'completed' : 'updated'}: ${task.title}`,
        receiverId: existingTask.userId,
        senderId: userId,
        taskId: task.id,
      },
    });

    const io = getIO();
    io.to(`user:${existingTask.userId}`).emit('notification', {
      type: stage === Stage.COMPLETED ? 'COMPLETED' : 'ALERT',
      message: `${req.user!.name} ${stage === Stage.COMPLETED ? 'completed' : 'updated'}: ${task.title}`,
      taskId: task.id,
    });
  }

  const io = getIO();
  io.to(`task:${id}`).emit('task:updated', task);

  res.json({
    success: true,
    message: 'Task stage updated',
    data: { task },
  });
};

export const addActivity = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user!.id;
  const { type, description } = req.body as AddActivityInput;

  const task = await prisma.task.findFirst({
    where: {
      id,
      OR: [{ userId }, { assigneeId: userId }],
    },
  });

  if (!task) {
    res.status(404).json({
      success: false,
      error: 'Task not found',
    });
    return;
  }

  const activity = await prisma.activity.create({
    data: {
      type,
      description,
      taskId: id,
      userId,
    },
    include: {
      user: { select: { id: true, name: true, profilePic: true } },
    },
  });

  const io = getIO();
  io.to(`task:${id}`).emit('activity:added', activity);

  res.status(201).json({
    success: true,
    message: 'Activity added',
    data: { activity },
  });
};

export const addSubTask = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user!.id;
  const { title } = req.body as AddSubTaskInput;

  const task = await prisma.task.findFirst({
    where: {
      id,
      OR: [{ userId }, { assigneeId: userId }],
    },
  });

  if (!task) {
    res.status(404).json({
      success: false,
      error: 'Task not found',
    });
    return;
  }

  const subTask = await prisma.subTask.create({
    data: {
      title,
      taskId: id,
    },
  });

  const io = getIO();
  io.to(`task:${id}`).emit('subtask:added', subTask);

  res.status(201).json({
    success: true,
    message: 'Subtask added',
    data: { subTask },
  });
};

export const updateSubTaskStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  const { taskId, subTaskId } = req.params;
  const userId = req.user!.id;
  const { isCompleted } = req.body;

  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      OR: [{ userId }, { assigneeId: userId }],
    },
  });

  if (!task) {
    res.status(404).json({
      success: false,
      error: 'Task not found',
    });
    return;
  }

  const subTask = await prisma.subTask.update({
    where: { id: subTaskId, taskId },
    data: { isCompleted },
  });

  const io = getIO();
  io.to(`task:${taskId}`).emit('subtask:updated', subTask);

  res.json({
    success: true,
    message: 'Subtask updated',
    data: { subTask },
  });
};

export const trashTask = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user!.id;

  const task = await prisma.task.findFirst({
    where: { id, userId },
  });

  if (!task) {
    res.status(404).json({
      success: false,
      error: 'Task not found or you do not have permission',
    });
    return;
  }

  await prisma.task.update({
    where: { id },
    data: { isTrashed: true },
  });

  res.json({
    success: true,
    message: 'Task moved to trash',
  });
};

export const restoreTask = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user!.id;

  const task = await prisma.task.findFirst({
    where: { id, userId, isTrashed: true },
  });

  if (!task) {
    res.status(404).json({
      success: false,
      error: 'Task not found',
    });
    return;
  }

  await prisma.task.update({
    where: { id },
    data: { isTrashed: false },
  });

  res.json({
    success: true,
    message: 'Task restored',
  });
};

export const deleteTask = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user!.id;

  const task = await prisma.task.findFirst({
    where: { id, userId },
  });

  if (!task) {
    res.status(404).json({
      success: false,
      error: 'Task not found or you do not have permission',
    });
    return;
  }

  await prisma.task.delete({ where: { id } });

  res.json({
    success: true,
    message: 'Task deleted permanently',
  });
};

export const duplicateTask = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user!.id;

  const existingTask = await prisma.task.findFirst({
    where: {
      id,
      OR: [{ userId }, { assigneeId: userId }],
    },
    include: { subTasks: true },
  });

  if (!existingTask) {
    res.status(404).json({
      success: false,
      error: 'Task not found',
    });
    return;
  }

  const newTask = await prisma.task.create({
    data: {
      title: `${existingTask.title} (Copy)`,
      description: existingTask.description,
      priority: existingTask.priority,
      stage: Stage.TODO,
      dueDate: existingTask.dueDate,
      userId,
      activities: {
        create: {
          type: ActivityType.CREATED,
          description: `Task duplicated by ${req.user!.name}`,
          userId,
        },
      },
      subTasks: {
        create: existingTask.subTasks.map((st) => ({
          title: st.title,
          isCompleted: false,
        })),
      },
    },
    include: {
      user: { select: { id: true, name: true, email: true, profilePic: true } },
      subTasks: true,
    },
  });

  res.status(201).json({
    success: true,
    message: 'Task duplicated',
    data: { task: newTask },
  });
};

export const getDashboard = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.id;

  const [stats, recentTasks] = await Promise.all([
    prisma.task.groupBy({
      by: ['stage', 'priority'],
      where: {
        OR: [{ userId }, { assigneeId: userId }],
        isTrashed: false,
      },
      _count: true,
    }),
    prisma.task.findMany({
      where: {
        OR: [{ userId }, { assigneeId: userId }],
        isTrashed: false,
      },
      select: {
        id: true,
        title: true,
        stage: true,
        priority: true,
        createdAt: true,
        assignee: { select: { name: true, profilePic: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ]);

  const stageCount = { TODO: 0, IN_PROGRESS: 0, COMPLETED: 0 };
  const priorityCount = { HIGH: 0, MEDIUM: 0, NORMAL: 0, LOW: 0 };

  stats.forEach((stat) => {
    stageCount[stat.stage] += stat._count;
    priorityCount[stat.priority] += stat._count;
  });

  const totalTasks = Object.values(stageCount).reduce((a, b) => a + b, 0);

  const dashboard: DashboardStats = {
    totalTasks,
    completedTasks: stageCount.COMPLETED,
    inProgressTasks: stageCount.IN_PROGRESS,
    todoTasks: stageCount.TODO,
    tasksByPriority: {
      high: priorityCount.HIGH,
      medium: priorityCount.MEDIUM,
      normal: priorityCount.NORMAL,
      low: priorityCount.LOW,
    },
    recentTasks,
  };

  res.json({
    success: true,
    data: dashboard,
  });
};
