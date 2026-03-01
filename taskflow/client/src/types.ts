/* ============================= */
/* Reusable Types */
/* ============================= */

export type TaskStage = "todo" | "in progress" | "completed";

export type TaskPriority = "high" | "medium" | "normal" | "low";

/* ============================= */
/* User */
/* ============================= */

export interface User {
  _id: string;
  name: string;
  email: string;
  profilePic?: string;
}

/* ============================= */
/* Activity */
/* ============================= */

export interface TaskActivity {
  _id: string;
  type: string;
  message: string;
  date: string;
  by: User;
}

/* ============================= */
/* Task */
/* ============================= */

export interface Task {
  _id: string;
  title: string;
  description: string;

  assigneeEmail: string;
  assignee?: User;

  userId: User;

  stage: TaskStage;
  priority: TaskPriority;

  date: string;
  isTrashed: boolean;

  activities: TaskActivity[];
}