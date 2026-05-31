import { Router } from 'express';
import { authMiddleware } from '@/middleware/auth.middleware';
import { organizationMiddleware } from '@/middleware/organization.middleware';
import { validate } from '@/middleware/validate.middleware';
import { asyncHandler } from '@/middleware/async-handler';
import { organizationController } from './organization.controller';
import { createOrganizationSchema } from './organization.validation';

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

export default router;
