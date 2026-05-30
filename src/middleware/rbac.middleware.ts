import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { ForbiddenError } from '@/shared/errors/domain-errors';
import type { Role } from '@/shared/enums/role.enum';

interface RbacOptions {
  roles: Role[];
}

export function rbac(opts: RbacOptions): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const role = req.membership?.role;
    if (!role || !opts.roles.includes(role)) {
      next(new ForbiddenError('FORBIDDEN_ROLE', 'Insufficient role for this action'));
      return;
    }
    next();
  };
}
