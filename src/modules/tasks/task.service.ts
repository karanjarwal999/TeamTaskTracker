import { NotFoundError, ValidationError } from '@/shared/errors/domain-errors';
import { TaskStatus } from '@/shared/enums/task-status.enum';
import { TaskPriority } from '@/shared/enums/task-priority.enum';
import { projectRepository } from '@/modules/projects/project.repository';
import { membershipRepository } from '@/modules/memberships/membership.repository';
import { taskRepository } from './task.repository';
import type { CreateTaskBody } from './task.validation';
import type { TaskDto } from './task.types';

interface TaskLikeShape {
  _id: unknown;
  title: string;
  description?: string;
  priority: string;
  status: string;
  assigneeId?: unknown;
  projectId: unknown;
  organizationId: unknown;
  dueDate?: Date;
  createdBy: unknown;
  updatedBy?: unknown;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

function taskToDto(doc: TaskLikeShape): TaskDto {
  return {
    id: String(doc._id),
    title: doc.title,
    description: doc.description,
    priority: doc.priority as TaskPriority,
    status: doc.status as TaskStatus,
    assigneeId: doc.assigneeId ? String(doc.assigneeId) : undefined,
    projectId: String(doc.projectId),
    organizationId: String(doc.organizationId),
    dueDate: doc.dueDate,
    createdBy: String(doc.createdBy),
    updatedBy: doc.updatedBy ? String(doc.updatedBy) : undefined,
    completedAt: doc.completedAt,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export const taskService = {
  async create(body: CreateTaskBody, organizationId: string, createdBy: string): Promise<TaskDto> {
    const project = await projectRepository.findByIdInOrg(body.projectId, organizationId);
    if (!project) {
      throw new NotFoundError('PROJECT_NOT_FOUND', 'Project not found in this organization');
    }

    // If an assignee is provided, they must be a member of this org.
    if (body.assigneeId) {
      const assigneeMembership = await membershipRepository.findByUserAndOrg(
        body.assigneeId,
        organizationId,
      );
      if (!assigneeMembership) {
        throw new ValidationError(
          'INVALID_ASSIGNEE',
          'Assignee is not a member of this organization',
        );
      }
    }

    // If dueDate is provided, it must be in the future.
    if (body.dueDate && body.dueDate.getTime() <= Date.now()) {
      throw new ValidationError('VALIDATION_ERROR', 'dueDate must be in the future');
    }

    const doc = await taskRepository.create({
      title: body.title,
      description: body.description,
      projectId: body.projectId,
      priority: (body.priority as TaskPriority | undefined) ?? TaskPriority.MEDIUM,
      status: TaskStatus.TODO,
      assigneeId: body.assigneeId,
      dueDate: body.dueDate,
      organizationId,
      createdBy,
    });
    return taskToDto(doc as TaskLikeShape);
  },
};
