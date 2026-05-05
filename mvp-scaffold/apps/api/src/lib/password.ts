import { scryptSync, timingSafeEqual } from 'node:crypto';

const PASSWORD_SCHEME = 'scrypt';
const PASSWORD_VERSION = 'v1';
const KEY_LENGTH = 32;

export function createPasswordHash(password: string, salt: string): string {
  const hash = scryptSync(password, salt, KEY_LENGTH).toString('base64url');
  return `${PASSWORD_SCHEME}$${PASSWORD_VERSION}$${salt}$${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split('$');
  if (parts.length !== 4) return false;
  const [scheme, version, salt, encodedHash] = parts;
  if (scheme !== PASSWORD_SCHEME || version !== PASSWORD_VERSION || !salt || !encodedHash) {
    return false;
  }

  const expected = Buffer.from(encodedHash);
  const actual = Buffer.from(scryptSync(password, salt, KEY_LENGTH).toString('base64url'));
  if (expected.length !== actual.length) return false;
  return timingSafeEqual(expected, actual);
}
