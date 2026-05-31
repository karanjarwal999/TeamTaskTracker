import type { Request, Response } from 'express';
import { successResponse } from '@/shared/helpers/response.helper';
import { analyticsService } from './analytics.service';

export const analyticsController = {
  async tasks(req: Request, res: Response): Promise<void> {
    const organizationId = req.membership!.organizationId;
    const data = await analyticsService.getTaskAnalytics(organizationId);
    successResponse(res, 'Task analytics', data);
  },
};
