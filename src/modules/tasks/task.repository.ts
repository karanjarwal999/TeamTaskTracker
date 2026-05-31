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
    const filter: { organizationId: string; assigneeId?: string } = { organizationId };
    if (params.assigneeId) filter.assigneeId = params.assigneeId;
    const [rows, total] = await Promise.all([
      Task.find(filter).sort({ createdAt: -1 }).skip(params.skip).limit(params.limit).lean(),
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
