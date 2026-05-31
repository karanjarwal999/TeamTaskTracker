import { z } from 'zod';

export const createOrganizationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'name must not be empty')
    .max(100, 'name must be at most 100 characters'),
});

export type CreateOrganizationBody = z.infer<typeof createOrganizationSchema>;
