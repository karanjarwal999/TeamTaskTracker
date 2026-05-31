import { Project } from '@/db/models/project.model';
import type { CreateProjectInput, ListProjectsParams, UpdateProjectInput } from './project.types';

export const projectRepository = {
  async create(input: CreateProjectInput) {
    return Project.create(input);
  },

  async findByIdInOrg(projectId: string, organizationId: string) {
    return Project.findOne({ _id: projectId, organizationId }).lean();
  },

  async listInOrg(organizationId: string, params: ListProjectsParams) {
    // Parallelize the page query and the total-count for efficiency.
    const [rows, total] = await Promise.all([
      Project.find({ organizationId })
        .sort({ createdAt: -1 })
        .skip(params.skip)
        .limit(params.limit)
        .lean(),
      Project.countDocuments({ organizationId }),
    ]);
    return { rows, total };
  },

  async updateInOrg(projectId: string, organizationId: string, update: UpdateProjectInput) {
    return Project.findOneAndUpdate(
      { _id: projectId, organizationId },
      { $set: update },
      { new: true },
    ).lean();
  },

  async deleteInOrg(projectId: string, organizationId: string) {
    return Project.findOneAndDelete({ _id: projectId, organizationId }).lean();
  },
};
