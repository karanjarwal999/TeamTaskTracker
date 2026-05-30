import type { Request, Response } from 'express';
import { successResponse } from '@/shared/helpers/response.helper';
import { authService } from './auth.service';
import type { LoginBody, ChangePasswordBody } from './auth.validation';

export const authController = {
  async login(req: Request, res: Response): Promise<void> {
    const body = req.body as LoginBody;
    const result = await authService.login(body.email, body.password);
    successResponse(res, 'Logged in', result);
  },

  async changePassword(req: Request, res: Response): Promise<void> {
    const body = req.body as ChangePasswordBody;
    const result = await authService.changePassword(
      body.email,
      body.currentPassword,
      body.newPassword,
    );
    successResponse(res, 'Password updated', result);
  },
};
