import { z } from 'zod';
import { Priority, Stage, ActivityType } from '@prisma/client';

export const createTaskSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required').max(200, 'Title is too long'),
    description: z.string().max(2000, 'Description is too long').optional(),
    priority: z.nativeEnum(Priority).default(Priority.NORMAL),
    stage: z.nativeEnum(Stage).default(Stage.TODO),
    dueDate: z.string().datetime().optional().nullable(),
    assigneeEmail: z.string().email('Invalid assignee email').optional().nullable(),
  }),
});

export const updateTaskSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required').max(200, 'Title is too long').optional(),
    description: z.string().max(2000, 'Description is too long').optional().nullable(),
    priority: z.nativeEnum(Priority).optional(),
    stage: z.nativeEnum(Stage).optional(),
    dueDate: z.string().datetime().optional().nullable(),
    assigneeEmail: z.string().email('Invalid assignee email').optional().nullable(),
  }),
  params: z.object({
    id: z.string().uuid('Invalid task ID'),
  }),
});

export const changeStageSchema = z.object({
  body: z.object({
    stage: z.nativeEnum(Stage),
  }),
  params: z.object({
    id: z.string().uuid('Invalid task ID'),
  }),
});

export const addActivitySchema = z.object({
  body: z.object({
    type: z.nativeEnum(ActivityType),
    description: z.string().max(500, 'Description is too long').optional(),
  }),
  params: z.object({
    id: z.string().uuid('Invalid task ID'),
  }),
});

export const addSubTaskSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required').max(200, 'Title is too long'),
  }),
  params: z.object({
    id: z.string().uuid('Invalid task ID'),
  }),
});

export const taskIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid task ID'),
  }),
});

export const subTaskStatusSchema = z.object({
  params: z.object({
    taskId: z.string().uuid('Invalid task ID'),
    subTaskId: z.string().uuid('Invalid subtask ID'),
  }),
  body: z.object({
    isCompleted: z.boolean(),
  }),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>['body'];
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>['body'];
export type ChangeStageInput = z.infer<typeof changeStageSchema>['body'];
export type AddActivityInput = z.infer<typeof addActivitySchema>['body'];
export type AddSubTaskInput = z.infer<typeof addSubTaskSchema>['body'];
