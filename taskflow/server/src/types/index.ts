import { Request } from 'express';
import { User, Priority, Stage, ActivityType, NotificationType } from '@prisma/client';

export interface AuthRequest extends Request {
  user?: User;
}

export interface JWTPayload {
  userId: string;
  email: string;
}

export interface GoogleTokenPayload {
  email: string;
  name: string;
  picture?: string;
  sub: string;
}

export interface TaskFilters {
  stage?: Stage;
  priority?: Priority;
  isTrashed?: boolean;
  search?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface DashboardStats {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  todoTasks: number;
  tasksByPriority: {
    high: number;
    medium: number;
    normal: number;
    low: number;
  };
  recentTasks: Array<{
    id: string;
    title: string;
    stage: Stage;
    priority: Priority;
    createdAt: Date;
  }>;
}

export { Priority, Stage, ActivityType, NotificationType };
