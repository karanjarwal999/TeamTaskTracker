import type { Types } from 'mongoose';
import type { TaskStatus } from '@/shared/enums/task-status.enum';
import type { TaskPriority } from '@/shared/enums/task-priority.enum';
import type { Pagination } from '@/shared/helpers/response.helper';

export interface CreateTaskInput {
  title: string;
  description?: string;
  projectId: Types.ObjectId | string;
  priority: TaskPriority;
  status: TaskStatus;
  assigneeId?: Types.ObjectId | string;
  dueDate?: Date;
  organizationId: Types.ObjectId | string;
  createdBy: Types.ObjectId | string;
}

export interface ListTasksParams {
  page: number;
  limit: number;
  skip: number;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
  projectId?: string;
  dueBefore?: Date;
  dueAfter?: Date;
  sortBy?: 'createdAt' | 'dueDate' | 'priority';
  sortOrder?: 'asc' | 'desc';
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  assigneeId?: string | null;
  projectId?: string;
  dueDate?: Date | null;
}

export interface TaskDto {
  id: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  assigneeId?: string;
  projectId: string;
  organizationId: string;
  dueDate?: Date;
  createdBy: string;
  updatedBy?: string;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListTasksResult {
  data: TaskDto[];
  pagination: Pagination;
}
