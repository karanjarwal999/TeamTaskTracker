import { Router } from 'express';
import { authMiddleware } from '@/middleware/auth.middleware';
import { validate } from '@/middleware/validate.middleware';
import { asyncHandler } from '@/middleware/async-handler';
import { organizationController } from './organization.controller';
import { createOrganizationSchema } from './organization.validation';

const router = Router();

// POST /organizations
// Creates a new Organization and makes the caller its first ADMIN.
// Org + first-admin Membership commit atomically (Mongoose session).
router.post(
  '/',
  authMiddleware,
  validate({ body: createOrganizationSchema }),
  asyncHandler(organizationController.create),
);

export default router;
