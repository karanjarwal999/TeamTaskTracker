import { Types } from 'mongoose';
import { User } from '@/db/models/user.model';
import { Organization } from '@/db/models/organization.model';
import { Membership } from '@/db/models/membership.model';
import { Project } from '@/db/models/project.model';
import { Task } from '@/db/models/task.model';
import { Role } from '@/shared/enums/role.enum';
import { TaskStatus } from '@/shared/enums/task-status.enum';
import { TaskPriority } from '@/shared/enums/task-priority.enum';
import { hashPassword } from '@/shared/utils/password';

let counter = 0;
const nextEmail = (): string => `user${++counter}-${Date.now()}@test.local`;

// Default password used when a spec needs to log in via POST /auth/login.
export const DEFAULT_TEST_PASSWORD = 'TestPass#1234';

export async function buildUser(
  overrides: { email?: string; name?: string; password?: string } = {},
) {
  const password = overrides.password ?? DEFAULT_TEST_PASSWORD;
  return User.create({
    email: overrides.email ?? nextEmail(),
    name: overrides.name ?? 'Test User',
    isRegistered: true,
    passwordHash: hashPassword(password),
  });
}

export async function buildOrg(createdBy: Types.ObjectId, name = 'Test Org') {
  return Organization.create({ name, createdBy });
}

export async function buildMembership(
  userId: Types.ObjectId,
  organizationId: Types.ObjectId,
  role: Role,
) {
  return Membership.create({
    userId,
    organizationId,
    role,
    invitedBy: userId,
    joinedAt: new Date(),
  });
}

export async function buildProject(
  organizationId: Types.ObjectId,
  createdBy: Types.ObjectId,
  name = 'Test Project',
) {
  return Project.create({ name, organizationId, createdBy });
}

export async function buildTask(
  organizationId: Types.ObjectId,
  projectId: Types.ObjectId,
  createdBy: Types.ObjectId,
  overrides: { status?: TaskStatus; assigneeId?: Types.ObjectId; title?: string } = {},
) {
  return Task.create({
    title: overrides.title ?? 'Test Task',
    projectId,
    organizationId,
    createdBy,
    priority: TaskPriority.MEDIUM,
    status: overrides.status ?? TaskStatus.TODO,
    assigneeId: overrides.assigneeId,
  });
}
