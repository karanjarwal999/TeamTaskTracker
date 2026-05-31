import { Router } from 'express';
import { authMiddleware } from '@/middleware/auth.middleware';
import { organizationMiddleware } from '@/middleware/organization.middleware';
import { rbac } from '@/middleware/rbac.middleware';
import { validate } from '@/middleware/validate.middleware';
import { asyncHandler } from '@/middleware/async-handler';
import { Role } from '@/shared/enums/role.enum';
import { organizationController } from './organization.controller';
import { createOrganizationSchema } from './organization.validation';
import { membershipController } from '@/modules/memberships/membership.controller';
import { inviteSchema } from '@/modules/memberships/membership.validation';

const router = Router();

// POST /organizations
// Creates a new Organization and makes the caller its first ADMIN.
router.post(
  '/',
  authMiddleware,
  validate({ body: createOrganizationSchema }),
  asyncHandler(organizationController.create),
);

// GET /organizations
// Lists every Organization the caller is a member of, with the caller's role per org.
router.get('/', authMiddleware, asyncHandler(organizationController.listMine));

// GET /organizations/:id
// Returns the single Organization identified by :id
// organizationMiddleware confirms membership in x-organization-id; the controller
router.get(
  '/:id',
  authMiddleware,
  organizationMiddleware,
  asyncHandler(organizationController.getById),
);

// POST /organizations/:id/invite
// ADMIN-only. Provisions a Firebase user (with random initial password) if needed,
// creates the local User + Membership atomically, and logs the dispatch.
router.post(
  '/:id/invite',
  authMiddleware,
  organizationMiddleware,
  rbac({ roles: [Role.ADMIN] }),
  validate({ body: inviteSchema }),
  asyncHandler(membershipController.invite),
);

// GET /organizations/:id/memberships
// Lists every membership in the org with name+email of each user.
// Any role (ADMIN/MANAGER/MEMBER) can read; no rbac gate.
router.get(
  '/:id/memberships',
  authMiddleware,
  organizationMiddleware,
  asyncHandler(membershipController.listForOrganization),
);

export default router;
