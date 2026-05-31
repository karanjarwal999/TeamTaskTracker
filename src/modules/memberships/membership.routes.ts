import { Router } from 'express';
import { authMiddleware } from '@/middleware/auth.middleware';
import { organizationMiddleware } from '@/middleware/organization.middleware';
import { rbac } from '@/middleware/rbac.middleware';
import { validate } from '@/middleware/validate.middleware';
import { asyncHandler } from '@/middleware/async-handler';
import { Role } from '@/shared/enums/role.enum';
import { membershipController } from './membership.controller';
import { updateRoleSchema } from './membership.validation';

const router = Router();

// PATCH /memberships/:id
// ADMIN-only. Updates the role of a membership
router.patch(
  '/:id',
  authMiddleware,
  organizationMiddleware,
  rbac({ roles: [Role.ADMIN] }),
  validate({ body: updateRoleSchema }),
  asyncHandler(membershipController.updateRole),
);

// DELETE /memberships/:id
// ADMIN-only. Revokes a membership
router.delete(
  '/:id',
  authMiddleware,
  organizationMiddleware,
  rbac({ roles: [Role.ADMIN] }),
  asyncHandler(membershipController.revoke),
);

export default router;
