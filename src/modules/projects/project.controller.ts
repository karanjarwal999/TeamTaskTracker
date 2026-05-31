import type { Request, Response } from 'express';
import { noContentResponse, successResponse } from '@/shared/helpers/response.helper';
import { projectService } from './project.service';
import type { CreateProjectBody, ListProjectsQuery, UpdateProjectBody } from './project.validation';

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

  async update(req: Request, res: Response): Promise<void> {
    const projectId = req.params.id as string;
    const organizationId = req.membership!.organizationId;
    const body = req.body as UpdateProjectBody;
    const project = await projectService.update(projectId, organizationId, body);
    successResponse(res, 'Project updated', project);
  },

  async remove(req: Request, res: Response): Promise<void> {
    const projectId = req.params.id as string;
    const organizationId = req.membership!.organizationId;
    await projectService.delete(projectId, organizationId);
    noContentResponse(res);
  },
};
