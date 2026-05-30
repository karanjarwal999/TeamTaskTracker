import jwt, { type SignOptions, type JwtPayload } from 'jsonwebtoken';
import { env } from '@/config/env';

export interface AccessPayload extends JwtPayload {
  userId: string;
  email: string;
}

export interface RefreshPayload extends JwtPayload {
  userId: string;
  refreshTokenVersion: number;
}

export function signAccess(payload: Pick<AccessPayload, 'userId' | 'email'>): string {
  const options: SignOptions = {
    expiresIn: env.ACCESS_TOKEN_EXPIRES_IN as SignOptions['expiresIn'],
  };
  return jwt.sign(payload, env.JWT_SECRET, options);
}

export function signRefresh(
  payload: Pick<RefreshPayload, 'userId' | 'refreshTokenVersion'>,
): string {
  const options: SignOptions = {
    expiresIn: env.REFRESH_TOKEN_EXPIRES_IN as SignOptions['expiresIn'],
  };
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, options);
}

export function verifyAccess(token: string): AccessPayload {
  return jwt.verify(token, env.JWT_SECRET) as AccessPayload;
}

export function verifyRefresh(token: string): RefreshPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshPayload;
}
