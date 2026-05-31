import { z } from 'zod';
import { TASK_PRIORITY_VALUES } from '@/shared/enums/task-priority.enum';

const HEX24 = /^[a-f0-9]{24}$/i;

export const taskIdParamSchema = z.object({
  id: z.string().regex(HEX24, 'id must be a 24-character ObjectId hex string'),
});

export const createTaskSchema = z.object({
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
});

export type CreateTaskBody = z.infer<typeof createTaskSchema>;
export type TaskIdParam = z.infer<typeof taskIdParamSchema>;
