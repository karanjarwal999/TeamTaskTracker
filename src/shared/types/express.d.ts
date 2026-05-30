import type { Role } from '@/shared/enums/role.enum';

declare global {
  namespace Express {
    interface Request {
      reqId: string;
      user?: { userId: string; email: string };
      membership?: { organizationId: string; userId: string; role: Role };
    }
  }
}

export {};
