import { Router } from 'express';
import { validate } from '@/middleware/validate.middleware';
import { asyncHandler } from '@/middleware/async-handler';
import { authController } from './auth.controller';
import { loginSchema, changePasswordSchema } from './auth.validation';

const router = Router();

// POST /auth/login
// Backend verifies email + password against Firebase (signInWithPassword REST),
// then issues backend access + refresh JWTs.
router.post('/login', validate({ body: loginSchema }), asyncHandler(authController.login));

// POST /auth/change-password
// Verifies the current password against Firebase, then updates the password in Firebase via Admin SDK
router.post(
  '/change-password',
  validate({ body: changePasswordSchema }),
  asyncHandler(authController.changePassword),
);

export default router;
