import 'zod-openapi/extend';
import { z } from 'zod';

export const loginSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(1),
  })
  .openapi({ ref: 'LoginBody' });

export const changePasswordSchema = z
  .object({
    email: z.string().email(),
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8, 'newPassword must be at least 8 characters'),
  })
  .openapi({ ref: 'ChangePasswordBody' });

export const refreshSchema = z
  .object({
    refreshToken: z.string().min(1),
  })
  .openapi({ ref: 'RefreshBody' });

export type LoginBody = z.infer<typeof loginSchema>;
export type ChangePasswordBody = z.infer<typeof changePasswordSchema>;
export type RefreshBody = z.infer<typeof refreshSchema>;
