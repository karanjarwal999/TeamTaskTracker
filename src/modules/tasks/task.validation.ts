import 'zod-openapi/extend';
import { z } from 'zod';
import { TASK_PRIORITY_VALUES } from '@/shared/enums/task-priority.enum';
import { TASK_STATUS_VALUES } from '@/shared/enums/task-status.enum';

const HEX24 = /^[a-f0-9]{24}$/i;

export const taskIdParamSchema = z.object({
  id: z.string().regex(HEX24, 'id must be a 24-character ObjectId hex string'),
});

export const createTaskSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, 'title must not be empty')
      .max(200, 'title must be at most 200 characters'),
    description: z
      .string()
      .trim()
      .max(2000, 'description must be at most 2000 characters')
      .optional(),
    projectId: z.string().regex(HEX24, 'projectId must be a 24-character ObjectId hex string'),
    priority: z.enum(TASK_PRIORITY_VALUES as [string, ...string[]]).optional(),
    assigneeId: z
      .string()
      .regex(HEX24, 'assigneeId must be a 24-character ObjectId hex string')
      .optional(),
    dueDate: z.coerce.date().optional(),
  })
  .openapi({ ref: 'CreateTaskBody' });

export const listTasksQuerySchema = z.object({
  status: z.enum(TASK_STATUS_VALUES as [string, ...string[]]).optional(),
  priority: z.enum(TASK_PRIORITY_VALUES as [string, ...string[]]).optional(),
  assigneeId: z.string().regex(HEX24).optional(),
  projectId: z.string().regex(HEX24).optional(),
  dueBefore: z.coerce.date().optional(),
  dueAfter: z.coerce.date().optional(),
  sortBy: z.enum(['createdAt', 'dueDate', 'priority']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
});

export const updateTaskSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    description: z.string().trim().max(2000).optional(),
    priority: z.enum(TASK_PRIORITY_VALUES as [string, ...string[]]).optional(),
    assigneeId: z.string().regex(HEX24).nullable().optional(),
    projectId: z.string().regex(HEX24).optional(),
    dueDate: z.coerce.date().nullable().optional(),
  })
  .refine((d) => Object.values(d).some((v) => v !== undefined), {
    message: 'at least one field is required',
  })
  .openapi({ ref: 'UpdateTaskBody' });

export const transitionStatusSchema = z
  .object({
    status: z.enum(TASK_STATUS_VALUES as [string, ...string[]]),
  })
  .openapi({ ref: 'TransitionStatusBody' });

export type CreateTaskBody = z.infer<typeof createTaskSchema>;
export type ListTasksQuery = z.infer<typeof listTasksQuerySchema>;
export type UpdateTaskBody = z.infer<typeof updateTaskSchema>;
export type TransitionStatusBody = z.infer<typeof transitionStatusSchema>;
export type TaskIdParam = z.infer<typeof taskIdParamSchema>;
