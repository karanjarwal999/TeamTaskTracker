import type { Request, Response, NextFunction } from 'express';
import { verifyAccess } from '@/shared/jwt/jwt.helper';
import { UnauthorizedError } from '@/shared/errors/domain-errors';

export function authMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const header = req.header('authorization');
  if (!header || !header.toLowerCase().startsWith('bearer ')) {
    next(
      new UnauthorizedError('INVALID_ACCESS_TOKEN', 'Missing or malformed Authorization header'),
    );
    return;
  }

  const token = header.slice('bearer '.length).trim();
  try {
    const payload = verifyAccess(token);
    req.user = { userId: payload.userId, email: payload.email };
    next();
  } catch {
    next(new UnauthorizedError('INVALID_ACCESS_TOKEN', 'Access token is invalid or expired'));
  }
}
