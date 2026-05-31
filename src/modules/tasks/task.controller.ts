import type { Request, Response } from 'express';
import { successResponse } from '@/shared/helpers/response.helper';
import { taskService } from './task.service';
import type {
  CreateTaskBody,
  ListTasksQuery,
  TransitionStatusBody,
  UpdateTaskBody,
} from './task.validation';
import type { TaskStatus } from '@/shared/enums/task-status.enum';

export const taskController = {
  async create(req: Request, res: Response): Promise<void> {
    const body = req.body as CreateTaskBody;
    const organizationId = req.membership!.organizationId;
    const createdBy = req.user!.userId;
    const task = await taskService.create(body, organizationId, createdBy);
    successResponse(res, 'Task created', task, 201);
  },

  async list(req: Request, res: Response): Promise<void> {
    const organizationId = req.membership!.organizationId;
    const userId = req.user!.userId;
    const role = req.membership!.role;
    const query = req.query as ListTasksQuery;
    const result = await taskService.list(organizationId, userId, role, query);
    successResponse(res, 'Tasks', result.data, 200, result.pagination);
  },

  async getById(req: Request, res: Response): Promise<void> {
    const taskId = req.params.id as string;
    const organizationId = req.membership!.organizationId;
    const userId = req.user!.userId;
    const role = req.membership!.role;
    const task = await taskService.getById(taskId, organizationId, userId, role);
    successResponse(res, 'Task', task);
  },

  async update(req: Request, res: Response): Promise<void> {
    const taskId = req.params.id as string;
    const organizationId = req.membership!.organizationId;
    const updatedBy = req.user!.userId;
    const body = req.body as UpdateTaskBody;
    const task = await taskService.update(taskId, organizationId, updatedBy, body);
    successResponse(res, 'Task updated', task);
  },

  async transitionStatus(req: Request, res: Response): Promise<void> {
    const taskId = req.params.id as string;
    const organizationId = req.membership!.organizationId;
    const userId = req.user!.userId;
    const role = req.membership!.role;
    const { status } = req.body as TransitionStatusBody;
    const task = await taskService.transitionStatus(
      taskId,
      organizationId,
      userId,
      role,
      status as TaskStatus,
    );
    successResponse(res, 'Task status updated', task);
  },
};
