import { Router } from 'express';
import { authMiddleware } from '@/middleware/auth.middleware';
import { organizationMiddleware } from '@/middleware/organization.middleware';
import { rbac } from '@/middleware/rbac.middleware';
import { asyncHandler } from '@/middleware/async-handler';
import { Role } from '@/shared/enums/role.enum';
import { analyticsController } from './analytics.controller';

const router = Router();

// GET /analytics/tasks
// ADMIN/MANAGER only. Returns { overdueByAssignee, averageCompletionTimeMs }
router.get(
  '/tasks',
  authMiddleware,
  organizationMiddleware,
  rbac({ roles: [Role.ADMIN, Role.MANAGER] }),
  asyncHandler(analyticsController.tasks),
);

export default router;
