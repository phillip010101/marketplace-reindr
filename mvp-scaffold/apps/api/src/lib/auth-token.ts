import { createHmac, timingSafeEqual } from 'node:crypto';
import type { UserRole } from './request-actor';

export type AccessTokenPayload = {
  sub: string;
  role: UserRole;
  iat: number;
  exp: number;
  iss: 'reindr-api';
};

type SignInput = {
  accountId: string;
  role: UserRole;
  expiresInSeconds?: number;
};

const ALLOWED_ROLES: UserRole[] = ['client', 'provider', 'admin'];
const DEFAULT_TTL_SECONDS = 60 * 60;

function base64UrlEncode(input: string): string {
  return Buffer.from(input, 'utf8')
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(input: string): string {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const padLength = (4 - (normalized.length % 4)) % 4;
  const padded = normalized + '='.repeat(padLength);
  return Buffer.from(padded, 'base64').toString('utf8');
}

function safeJsonParse<T>(input: string): T | null {
  try {
    return JSON.parse(input) as T;
  } catch {
    return null;
  }
}

function resolveSecret(): string {
  return process.env.SESSION_SECRET ?? 'change-me';
}

function signRaw(data: string, secret: string): string {
  return createHmac('sha256', secret).update(data).digest('base64url');
}

function isRole(value: unknown): value is UserRole {
  return typeof value === 'string' && ALLOWED_ROLES.includes(value as UserRole);
}

export function createAccessToken(input: SignInput): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: AccessTokenPayload = {
    sub: input.accountId,
    role: input.role,
    iat: now,
    exp: now + (input.expiresInSeconds ?? DEFAULT_TTL_SECONDS),
    iss: 'reindr-api'
  };

  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };

  const headerPart = base64UrlEncode(JSON.stringify(header));
  const payloadPart = base64UrlEncode(JSON.stringify(payload));
  const signingInput = `${headerPart}.${payloadPart}`;
  const signature = signRaw(signingInput, resolveSecret());
  return `${signingInput}.${signature}`;
}

export function verifyAccessToken(token: string): AccessTokenPayload | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [headerPart, payloadPart, signaturePart] = parts;
  const headerJson = safeJsonParse<{ alg?: string; typ?: string }>(base64UrlDecode(headerPart));
  if (!headerJson || headerJson.alg !== 'HS256' || headerJson.typ !== 'JWT') return null;

  const signingInput = `${headerPart}.${payloadPart}`;
  const expectedSignature = signRaw(signingInput, resolveSecret());
  const expected = Buffer.from(expectedSignature);
  const actual = Buffer.from(signaturePart);
  if (expected.length !== actual.length) return null;
  if (!timingSafeEqual(expected, actual)) return null;

  const payload = safeJsonParse<AccessTokenPayload>(base64UrlDecode(payloadPart));
  if (!payload) return null;
  if (!payload.sub || !isRole(payload.role)) return null;
  if (payload.iss !== 'reindr-api') return null;

  const now = Math.floor(Date.now() / 1000);
  if (typeof payload.exp !== 'number' || payload.exp <= now) return null;
  if (typeof payload.iat !== 'number') return null;

  return payload;
}
