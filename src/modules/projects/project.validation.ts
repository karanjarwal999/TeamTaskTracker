import { z } from 'zod';

const HEX24 = /^[a-f0-9]{24}$/i;

export const projectIdParamSchema = z.object({
  id: z.string().regex(HEX24, 'id must be a 24-character ObjectId hex string'),
});

export const createProjectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'name must not be empty')
    .max(200, 'name must be at most 200 characters'),
  description: z
    .string()
    .trim()
    .max(2000, 'description must be at most 2000 characters')
    .optional(),
});

export const listProjectsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
});

export type CreateProjectBody = z.infer<typeof createProjectSchema>;
export type ListProjectsQuery = z.infer<typeof listProjectsQuerySchema>;
export type ProjectIdParam = z.infer<typeof projectIdParamSchema>;
