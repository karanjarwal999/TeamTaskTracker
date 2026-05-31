import type { Request, Response } from 'express';
import { successResponse } from '@/shared/helpers/response.helper';
import { taskService } from './task.service';
import type { CreateTaskBody } from './task.validation';

export const taskController = {
  async create(req: Request, res: Response): Promise<void> {
    const body = req.body as CreateTaskBody;
    const organizationId = req.membership!.organizationId;
    const createdBy = req.user!.userId;
    const task = await taskService.create(body, organizationId, createdBy);
    successResponse(res, 'Task created', task, 201);
  },
};
