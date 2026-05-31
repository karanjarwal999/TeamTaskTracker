import type { Types } from 'mongoose';
import type { TaskStatus } from '@/shared/enums/task-status.enum';
import type { TaskPriority } from '@/shared/enums/task-priority.enum';

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
