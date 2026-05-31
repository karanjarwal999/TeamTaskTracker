import { Router } from 'express';
import { authMiddleware } from '@/middleware/auth.middleware';
import { organizationMiddleware } from '@/middleware/organization.middleware';
import { rbac } from '@/middleware/rbac.middleware';
import { validate } from '@/middleware/validate.middleware';
import { asyncHandler } from '@/middleware/async-handler';
import { Role } from '@/shared/enums/role.enum';
import { taskController } from './task.controller';
import { createTaskSchema, listTasksQuerySchema, taskIdParamSchema } from './task.validation';

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

// GET /tasks
// Any role can read. ADMIN/MANAGER see all tasks in the org; MEMBER sees only
// tasks assigned to them. Paginated by ?page / ?limit.
router.get(
  '/',
  authMiddleware,
  organizationMiddleware,
  validate({ query: listTasksQuerySchema }),
  asyncHandler(taskController.list),
);

// GET /tasks/:id
// Any role can read a single task in their org, subject to the same MEMBER
// assignee-only visibility rule. Cross-org id → 404.
router.get(
  '/:id',
  authMiddleware,
  organizationMiddleware,
  validate({ params: taskIdParamSchema }),
  asyncHandler(taskController.getById),
);

export default router;
