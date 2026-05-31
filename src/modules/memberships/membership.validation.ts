import { z } from 'zod';
import { ROLE_VALUES } from '@/shared/enums/role.enum';

export const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(ROLE_VALUES as [string, ...string[]]),
});

export type InviteBody = z.infer<typeof inviteSchema>;

export const updateRoleSchema = z.object({
  role: z.enum(ROLE_VALUES as [string, ...string[]]),
});

export type UpdateRoleBody = z.infer<typeof updateRoleSchema>;
