export interface User {
  id: string;
  email: string;
  name: string;
  profilePic?: string | null;
  isActive: boolean;
  createdAt?: string;
}

export type Priority = 'HIGH' | 'MEDIUM' | 'NORMAL' | 'LOW';
export type Stage = 'TODO' | 'IN_PROGRESS' | 'COMPLETED';
export type ActivityType = 'CREATED' | 'ASSIGNED' | 'STARTED' | 'COMPLETED' | 'COMMENTED' | 'UPDATED';
export type NotificationType = 'ASSIGNMENT' | 'ALERT' | 'MESSAGE' | 'COMPLETED';

export interface SubTask {
  id: string;
  title: string;
  isCompleted: boolean;
  createdAt: string;
}

export interface Activity {
  id: string;
  type: ActivityType;
  description?: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    profilePic?: string;
  };
}

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  priority: Priority;
  stage: Stage;
  dueDate?: string | null;
  userId: string;
  assigneeId?: string | null;
  assigneeEmail?: string | null;
  isTrashed: boolean;
  createdAt: string;
  updatedAt: string;
  user: Pick<User, 'id' | 'name' | 'email' | 'profilePic'>;
  assignee?: Pick<User, 'id' | 'name' | 'email' | 'profilePic'> | null;
  subTasks: SubTask[];
  activities?: Activity[];
  _count?: {
    activities: number;
  };
}

export interface Notification {
  id: string;
  type: NotificationType;
  text: string;
  isRead: boolean;
  createdAt: string;
  sender?: {
    id: string;
    name: string;
    profilePic?: string;
  } | null;
  task?: {
    id: string;
    title: string;
  } | null;
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
    createdAt: string;
    assignee?: {
      name: string;
      profilePic?: string;
    } | null;
  }>;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  details?: Array<{ field: string; message: string }>;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  priority?: Priority;
  stage?: Stage;
  dueDate?: string | null;
  assigneeEmail?: string | null;
}

export interface UpdateTaskInput extends Partial<CreateTaskInput> {}

export interface TaskFilters {
  stage?: Stage;
  priority?: Priority;
  isTrashed?: boolean;
  search?: string;
  view?: 'all' | 'created' | 'assigned';
  page?: number;
  limit?: number;
}
