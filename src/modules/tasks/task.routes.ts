import { Router } from 'express';
import { authMiddleware } from '@/middleware/auth.middleware';
import { organizationMiddleware } from '@/middleware/organization.middleware';
import { rbac } from '@/middleware/rbac.middleware';
import { validate } from '@/middleware/validate.middleware';
import { asyncHandler } from '@/middleware/async-handler';
import { Role } from '@/shared/enums/role.enum';
import { taskController } from './task.controller';
import { createTaskSchema } from './task.validation';

const router = Router();

// POST /tasks
// ADMIN/MANAGER only. Creates a Task in the caller's org context.
router.post(
  '/',
  authMiddleware,
  organizationMiddleware,
  rbac({ roles: [Role.ADMIN, Role.MANAGER] }),
  validate({ body: createTaskSchema }),
  asyncHandler(taskController.create),
);

export default router;
