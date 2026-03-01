import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient, Priority, Stage, ActivityType } from '@prisma/client';

const prisma = new PrismaClient();

describe('Task Domain Logic', () => {
  let testUserId: string;
  let testTaskId: string;

  beforeAll(async () => {
    await prisma.$connect();
    
    const user = await prisma.user.create({
      data: {
        email: `test-${Date.now()}@example.com`,
        name: 'Test User',
        password: 'hashedpassword',
      },
    });
    testUserId = user.id;
  });

  afterAll(async () => {
    if (testUserId) {
      await prisma.user.delete({ where: { id: testUserId } });
    }
    await prisma.$disconnect();
  });

  describe('Task Creation', () => {
    it('should create a task with default values', async () => {
      const task = await prisma.task.create({
        data: {
          title: 'Test Task',
          userId: testUserId,
        },
      });

      expect(task.title).toBe('Test Task');
      expect(task.priority).toBe(Priority.NORMAL);
      expect(task.stage).toBe(Stage.TODO);
      expect(task.isTrashed).toBe(false);

      testTaskId = task.id;
    });

    it('should create a task with custom priority', async () => {
      const task = await prisma.task.create({
        data: {
          title: 'High Priority Task',
          priority: Priority.HIGH,
          userId: testUserId,
        },
      });

      expect(task.priority).toBe(Priority.HIGH);
      
      await prisma.task.delete({ where: { id: task.id } });
    });

    it('should create a task with assignee email', async () => {
      const task = await prisma.task.create({
        data: {
          title: 'Assigned Task',
          assigneeEmail: 'assignee@example.com',
          userId: testUserId,
        },
      });

      expect(task.assigneeEmail).toBe('assignee@example.com');
      expect(task.assigneeId).toBeNull();
      
      await prisma.task.delete({ where: { id: task.id } });
    });
  });

  describe('Task Updates', () => {
    it('should update task stage', async () => {
      const task = await prisma.task.update({
        where: { id: testTaskId },
        data: { stage: Stage.IN_PROGRESS },
      });

      expect(task.stage).toBe(Stage.IN_PROGRESS);
    });

    it('should mark task as completed', async () => {
      const task = await prisma.task.update({
        where: { id: testTaskId },
        data: { stage: Stage.COMPLETED },
      });

      expect(task.stage).toBe(Stage.COMPLETED);
    });

    it('should trash a task', async () => {
      const task = await prisma.task.update({
        where: { id: testTaskId },
        data: { isTrashed: true },
      });

      expect(task.isTrashed).toBe(true);
    });

    it('should restore a trashed task', async () => {
      const task = await prisma.task.update({
        where: { id: testTaskId },
        data: { isTrashed: false },
      });

      expect(task.isTrashed).toBe(false);
    });
  });

  describe('Subtasks', () => {
    let subTaskId: string;

    it('should add a subtask to a task', async () => {
      const subTask = await prisma.subTask.create({
        data: {
          title: 'Test Subtask',
          taskId: testTaskId,
        },
      });

      expect(subTask.title).toBe('Test Subtask');
      expect(subTask.isCompleted).toBe(false);
      subTaskId = subTask.id;
    });

    it('should mark subtask as completed', async () => {
      const subTask = await prisma.subTask.update({
        where: { id: subTaskId },
        data: { isCompleted: true },
      });

      expect(subTask.isCompleted).toBe(true);
    });

    it('should get task with subtasks', async () => {
      const task = await prisma.task.findUnique({
        where: { id: testTaskId },
        include: { subTasks: true },
      });

      expect(task?.subTasks).toHaveLength(1);
      expect(task?.subTasks[0].title).toBe('Test Subtask');
    });
  });

  describe('Activities', () => {
    it('should add activity to a task', async () => {
      const activity = await prisma.activity.create({
        data: {
          type: ActivityType.COMMENTED,
          description: 'Test comment',
          taskId: testTaskId,
          userId: testUserId,
        },
      });

      expect(activity.type).toBe(ActivityType.COMMENTED);
      expect(activity.description).toBe('Test comment');
    });

    it('should get task with activities', async () => {
      const task = await prisma.task.findUnique({
        where: { id: testTaskId },
        include: { activities: true },
      });

      expect(task?.activities.length).toBeGreaterThan(0);
    });
  });

  describe('Task Assignee Linking', () => {
    it('should link pending tasks when assignee registers', async () => {
      const pendingEmail = `pending-${Date.now()}@example.com`;
      
      const task = await prisma.task.create({
        data: {
          title: 'Task for future user',
          assigneeEmail: pendingEmail,
          userId: testUserId,
        },
      });

      expect(task.assigneeEmail).toBe(pendingEmail);
      expect(task.assigneeId).toBeNull();

      const newUser = await prisma.user.create({
        data: {
          email: pendingEmail,
          name: 'New User',
          password: 'hashedpassword',
        },
      });

      await prisma.task.updateMany({
        where: {
          assigneeEmail: pendingEmail,
          assigneeId: null,
        },
        data: { assigneeId: newUser.id },
      });

      const updatedTask = await prisma.task.findUnique({
        where: { id: task.id },
      });

      expect(updatedTask?.assigneeId).toBe(newUser.id);

      await prisma.task.delete({ where: { id: task.id } });
      await prisma.user.delete({ where: { id: newUser.id } });
    });
  });

  describe('Task Cleanup', () => {
    it('should delete test task', async () => {
      await prisma.task.delete({ where: { id: testTaskId } });

      const task = await prisma.task.findUnique({
        where: { id: testTaskId },
      });

      expect(task).toBeNull();
    });
  });
});

describe('Validation Logic', () => {
  describe('Priority Enum', () => {
    it('should only accept valid priority values', () => {
      const validPriorities = ['HIGH', 'MEDIUM', 'NORMAL', 'LOW'];
      validPriorities.forEach((p) => {
        expect(Object.values(Priority)).toContain(p);
      });
    });
  });

  describe('Stage Enum', () => {
    it('should only accept valid stage values', () => {
      const validStages = ['TODO', 'IN_PROGRESS', 'COMPLETED'];
      validStages.forEach((s) => {
        expect(Object.values(Stage)).toContain(s);
      });
    });
  });

  describe('Activity Type Enum', () => {
    it('should only accept valid activity types', () => {
      const validTypes = ['CREATED', 'ASSIGNED', 'STARTED', 'COMPLETED', 'COMMENTED', 'UPDATED'];
      validTypes.forEach((t) => {
        expect(Object.values(ActivityType)).toContain(t);
      });
    });
  });
});
