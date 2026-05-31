import type { Request, Response } from 'express';
import { successResponse } from '@/shared/helpers/response.helper';
import { organizationService } from './organization.service';
import type { CreateOrganizationBody } from './organization.validation';

export const organizationController = {
  async create(req: Request, res: Response): Promise<void> {
    const { name } = req.body as CreateOrganizationBody;
    // authMiddleware is the load-bearing guarantee that req.user is set by the time we get here.
    const userId = req.user!.userId;
    const result = await organizationService.create(name, userId);
    successResponse(res, 'Organization created', result, 201);
  },
};
