import { signAccess } from '@/shared/jwt/jwt.helper';

export function mintAccessToken(userId: string, email: string): string {
  return signAccess({ userId, email });
}
