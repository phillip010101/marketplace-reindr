import type { Context } from 'hono';
import { ApiRequestError } from './api-errors';
import { verifyAccessToken } from './auth-token';

export type UserRole = 'client' | 'provider' | 'admin';

export type RequestActor = {
  accountId: string;
  role: UserRole;
};

function extractBearerToken(rawAuthorization: string | undefined): string | null {
  if (!rawAuthorization) return null;
  const match = /^Bearer\s+(.+)$/i.exec(rawAuthorization.trim());
  if (!match) return null;
  return match[1];
}

export function requireActor(c: Context): RequestActor {
  const token = extractBearerToken(c.req.header('authorization'));
  if (!token) {
    throw new ApiRequestError(401, {
      code: 'UNAUTHORIZED',
      message: 'Se requiere autenticacion para esta ruta privada.'
    });
  }

  const payload = verifyAccessToken(token);
  if (!payload) {
    throw new ApiRequestError(401, {
      code: 'UNAUTHORIZED',
      message: 'Token invalido o expirado.'
    });
  }

  return {
    accountId: payload.sub,
    role: payload.role
  };
}

export function requireProviderActor(c: Context): RequestActor {
  const actor = requireActor(c);
  if (actor.role !== 'provider') {
    throw new ApiRequestError(403, {
      code: 'FORBIDDEN',
      message: 'Ruta permitida solo para rol provider.'
    });
  }
  return actor;
}

export function requireAdminActor(c: Context): RequestActor {
  const actor = requireActor(c);
  if (actor.role !== 'admin') {
    throw new ApiRequestError(403, {
      code: 'FORBIDDEN',
      message: 'Ruta permitida solo para rol admin.'
    });
  }
  return actor;
}
