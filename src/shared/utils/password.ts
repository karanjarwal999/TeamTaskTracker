import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';

// Local password hashing used while Firebase Auth is disabled.
// scrypt is in node:crypto so no extra dependency is needed.

const SCRYPT_KEY_LEN = 64;
const SALT_BYTES = 16;

export function hashPassword(password: string): string {
  const salt = randomBytes(SALT_BYTES).toString('hex');
  const derived = scryptSync(password, salt, SCRYPT_KEY_LEN).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, derivedHex] = stored.split(':');
  if (!salt || !derivedHex) return false;
  const derived = scryptSync(password, salt, SCRYPT_KEY_LEN);
  const expected = Buffer.from(derivedHex, 'hex');
  if (derived.length !== expected.length) return false;
  return timingSafeEqual(derived, expected);
}
