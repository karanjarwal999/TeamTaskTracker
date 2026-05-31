import type { Request, Response } from 'express';
import { successResponse } from '@/shared/helpers/response.helper';
import { projectService } from './project.service';
import type { CreateProjectBody, ListProjectsQuery } from './project.validation';

export const projectController = {
  async create(req: Request, res: Response): Promise<void> {
    const body = req.body as CreateProjectBody;
    const organizationId = req.membership!.organizationId;
    const createdBy = req.user!.userId;
    const project = await projectService.create(
      body.name,
      body.description,
      organizationId,
      createdBy,
    );
    successResponse(res, 'Project created', project, 201);
  },

  async list(req: Request, res: Response): Promise<void> {
    const organizationId = req.membership!.organizationId;
    const query = req.query as ListProjectsQuery;
    const result = await projectService.list(organizationId, query);
    successResponse(res, 'Projects', result.data, 200, result.pagination);
  },

  async getById(req: Request, res: Response): Promise<void> {
    const projectId = req.params.id as string;
    const organizationId = req.membership!.organizationId;
    const project = await projectService.getById(projectId, organizationId);
    successResponse(res, 'Project', project);
  },
};
