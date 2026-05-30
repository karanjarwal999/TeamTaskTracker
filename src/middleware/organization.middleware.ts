import type { Request, Response, NextFunction } from 'express';
import { Membership } from '@/db/models/membership.model';
import { ValidationError, ForbiddenError } from '@/shared/errors/domain-errors';
import type { Role } from '@/shared/enums/role.enum';

const HEX24 = /^[a-f0-9]{24}$/i;

export async function organizationMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const orgId = req.header('x-organization-id');
    if (!orgId || !HEX24.test(orgId)) {
      throw new ValidationError(
        'ORGANIZATION_CONTEXT_MISSING',
        'x-organization-id header is missing or not a valid ObjectId',
      );
    }

    if (!req.user) {
      throw new ForbiddenError('NOT_A_MEMBER', 'No authenticated user');
    }

    const membership = await Membership.findOne({
      userId: req.user.userId,
      organizationId: orgId,
    }).lean();

    if (!membership) {
      throw new ForbiddenError('NOT_A_MEMBER', 'No membership in this organization');
    }

    req.membership = {
      organizationId: orgId,
      userId: req.user.userId,
      role: membership.role as Role,
    };

    next();
  } catch (err) {
    next(err);
  }
}
