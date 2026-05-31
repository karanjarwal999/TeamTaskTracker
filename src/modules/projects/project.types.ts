import type { Types } from 'mongoose';
import type { Pagination } from '@/shared/helpers/response.helper';

export interface CreateProjectInput {
  name: string;
  description?: string;
  organizationId: Types.ObjectId | string;
  createdBy: Types.ObjectId | string;
}

export interface ListProjectsParams {
  page: number;
  limit: number;
  skip: number;
}

export interface ProjectDto {
  id: string;
  name: string;
  description?: string;
  organizationId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListProjectsResult {
  data: ProjectDto[];
  pagination: Pagination;
}
