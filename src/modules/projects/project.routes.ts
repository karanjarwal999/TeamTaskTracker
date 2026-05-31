import { Router } from 'express';
import { authMiddleware } from '@/middleware/auth.middleware';
import { organizationMiddleware } from '@/middleware/organization.middleware';
import { rbac } from '@/middleware/rbac.middleware';
import { validate } from '@/middleware/validate.middleware';
import { asyncHandler } from '@/middleware/async-handler';
import { Role } from '@/shared/enums/role.enum';
import { projectController } from './project.controller';
import {
  createProjectSchema,
  listProjectsQuerySchema,
  projectIdParamSchema,
  updateProjectSchema,
} from './project.validation';

const router = Router();

// POST /projects
// ADMIN/MANAGER only. Creates a Project scoped to the caller's organization context.
router.post(
  '/',
  authMiddleware,
  organizationMiddleware,
  rbac({ roles: [Role.ADMIN, Role.MANAGER] }),
  validate({ body: createProjectSchema }),
  asyncHandler(projectController.create),
);

// GET /projects
// Any role can read. Returns projects in the caller's org, paginated by ?page / ?limit.
router.get(
  '/',
  authMiddleware,
  organizationMiddleware,
  validate({ query: listProjectsQuerySchema }),
  asyncHandler(projectController.list),
);

// GET /projects/:id
// Any role can read a single project, scoped to the caller's org (404 if outside).
router.get(
  '/:id',
  authMiddleware,
  organizationMiddleware,
  validate({ params: projectIdParamSchema }),
  asyncHandler(projectController.getById),
);

// PATCH /projects/:id
// ADMIN/MANAGER only. Updates name and/or description on a project in the org.
router.patch(
  '/:id',
  authMiddleware,
  organizationMiddleware,
  rbac({ roles: [Role.ADMIN, Role.MANAGER] }),
  validate({ params: projectIdParamSchema, body: updateProjectSchema }),
  asyncHandler(projectController.update),
);

// DELETE /projects/:id
// ADMIN/MANAGER only. Hard-delete a project in the org. Returns 204.
router.delete(
  '/:id',
  authMiddleware,
  organizationMiddleware,
  rbac({ roles: [Role.ADMIN, Role.MANAGER] }),
  validate({ params: projectIdParamSchema }),
  asyncHandler(projectController.remove),
);

export default router;
