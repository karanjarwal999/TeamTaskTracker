import type { Request, Response } from 'express';
import { successResponse } from '@/shared/helpers/response.helper';
import { NotFoundError } from '@/shared/errors/domain-errors';
import { organizationService } from './organization.service';
import type { CreateOrganizationBody } from './organization.validation';

export const organizationController = {
  async create(req: Request, res: Response): Promise<void> {
    const { name } = req.body as CreateOrganizationBody;
    const userId = req.user!.userId;
    const result = await organizationService.create(name, userId);
    successResponse(res, 'Organization created', result, 201);
  },

  async listMine(req: Request, res: Response): Promise<void> {
    const userId = req.user!.userId;
    const data = await organizationService.listMine(userId);
    successResponse(res, 'Organizations', data);
  },

  async getById(req: Request, res: Response): Promise<void> {
    const paramId = req.params.id;
    const contextId = req.membership!.organizationId;
    if (paramId !== contextId) {
      throw new NotFoundError('ORGANIZATION_NOT_FOUND', 'Organization not found in this context');
    }
    const data = await organizationService.getById(contextId);
    successResponse(res, 'Organization', data);
  },
};
