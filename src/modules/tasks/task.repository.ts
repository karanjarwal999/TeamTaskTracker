import { Task } from '@/db/models/task.model';
import type { CreateTaskInput, ListTasksParams, UpdateTaskInput } from './task.types';

export const taskRepository = {
  async create(input: CreateTaskInput) {
    return Task.create(input);
  },

  async findByIdInOrg(taskId: string, organizationId: string) {
    return Task.findOne({ _id: taskId, organizationId }).lean();
  },

  // Org-scoped list. When `assigneeId` is set on the params, only tasks
  // assigned to that user are returned — used by MEMBER role-scoping.
  async listInOrg(organizationId: string, params: ListTasksParams) {
    type DueDateRange = { $lt?: Date; $gt?: Date };
    const filter: {
      organizationId: string;
      assigneeId?: string;
      status?: string;
      priority?: string;
      projectId?: string;
      dueDate?: DueDateRange;
    } = { organizationId };

    if (params.assigneeId) filter.assigneeId = params.assigneeId;
    if (params.status) filter.status = params.status;
    if (params.priority) filter.priority = params.priority;
    if (params.projectId) filter.projectId = params.projectId;
    if (params.dueBefore || params.dueAfter) {
      filter.dueDate = {};
      if (params.dueBefore) filter.dueDate.$lt = params.dueBefore;
      if (params.dueAfter) filter.dueDate.$gt = params.dueAfter;
    }

    const sortField = params.sortBy ?? 'createdAt';
    const sortDir: 1 | -1 = params.sortOrder === 'asc' ? 1 : -1;

    const [rows, total] = await Promise.all([
      Task.find(filter)
        .sort({ [sortField]: sortDir })
        .skip(params.skip)
        .limit(params.limit)
        .lean(),
      Task.countDocuments(filter),
    ]);
    return { rows, total };
  },

  async updateInOrg(
    taskId: string,
    organizationId: string,
    update: UpdateTaskInput,
    updatedBy: string,
  ) {
    const $set: Record<string, unknown> = { updatedBy };
    // safe side- mongoose doesn't ignore undefined fields in findOneAndUpdate like it does in create/update
    for (const [key, value] of Object.entries(update)) {
      if (value !== undefined) $set[key] = value;
    }
    return Task.findOneAndUpdate({ _id: taskId, organizationId }, { $set }, { new: true }).lean();
  },

  async setStatusInOrg(
    taskId: string,
    organizationId: string,
    status: string,
    updatedBy: string,
    completedAt?: Date,
  ) {
    const $set: Record<string, unknown> = { status, updatedBy };
    if (completedAt !== undefined) $set.completedAt = completedAt;
    return Task.findOneAndUpdate({ _id: taskId, organizationId }, { $set }, { new: true }).lean();
  },

  async deleteByIdInOrg(taskId: string, organizationId: string) {
    return Task.findOneAndDelete({ _id: taskId, organizationId }).lean();
  },
};
