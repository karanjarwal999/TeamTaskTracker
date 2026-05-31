import { NotFoundError } from '@/shared/errors/domain-errors';
import { buildPagination, parsePageLimit } from '@/shared/helpers/pagination.helper';
import { projectRepository } from './project.repository';
import type { ListProjectsResult, ProjectDto } from './project.types';
import type { ListProjectsQuery } from './project.validation';

interface ProjectLikeShape {
  _id: unknown;
  name: string;
  description?: string;
  organizationId: unknown;
  createdBy: unknown;
  createdAt: Date;
  updatedAt: Date;
}

function projectToDto(doc: ProjectLikeShape): ProjectDto {
  return {
    id: String(doc._id),
    name: doc.name,
    description: doc.description,
    organizationId: String(doc.organizationId),
    createdBy: String(doc.createdBy),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export const projectService = {
  async create(
    name: string,
    description: string | undefined,
    organizationId: string,
    createdBy: string,
  ): Promise<ProjectDto> {
    const doc = await projectRepository.create({ name, description, organizationId, createdBy });
    return projectToDto(doc as ProjectLikeShape);
  },

  async getById(projectId: string, organizationId: string): Promise<ProjectDto> {
    const doc = await projectRepository.findByIdInOrg(projectId, organizationId);
    if (!doc) {
      // Project doesn't exist OR is in a different org — both surface as 404 per FR-5.
      throw new NotFoundError('PROJECT_NOT_FOUND', 'Project not found in this organization');
    }
    return projectToDto(doc as ProjectLikeShape);
  },

  async list(organizationId: string, query: ListProjectsQuery): Promise<ListProjectsResult> {
    const params = parsePageLimit({ page: query.page, limit: query.limit });
    const { rows, total } = await projectRepository.listInOrg(organizationId, params);
    return {
      data: rows.map((r) => projectToDto(r as ProjectLikeShape)),
      pagination: buildPagination(params.page, params.limit, total),
    };
  },
};
