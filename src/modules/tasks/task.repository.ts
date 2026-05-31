import { Task } from '@/db/models/task.model';
import type { CreateTaskInput, ListTasksParams } from './task.types';

export const taskRepository = {
  async create(input: CreateTaskInput) {
    return Task.create(input);
  },

  // Org-scoped lookup (NFR-7 defense-in-depth). Returns null when the task
  // doesn't exist OR belongs to a different organization.
  async findByIdInOrg(taskId: string, organizationId: string) {
    return Task.findOne({ _id: taskId, organizationId }).lean();
  },

  // Org-scoped list. When `assigneeId` is set on the params, only tasks
  // assigned to that user are returned — used by MEMBER role-scoping.
  async listInOrg(organizationId: string, params: ListTasksParams) {
    const filter: { organizationId: string; assigneeId?: string } = { organizationId };
    if (params.assigneeId) filter.assigneeId = params.assigneeId;
    const [rows, total] = await Promise.all([
      Task.find(filter).sort({ createdAt: -1 }).skip(params.skip).limit(params.limit).lean(),
      Task.countDocuments(filter),
    ]);
    return { rows, total };
  },
};
