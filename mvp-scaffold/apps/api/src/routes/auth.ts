import { Hono } from 'hono';
import { randomBytes } from 'node:crypto';
import { z } from 'zod';
import { createAccessToken } from '../lib/auth-token';
import { errorResponse, ApiRequestError } from '../lib/api-errors';
import { getPool } from '../lib/db';
import { createPasswordHash, verifyPassword } from '../lib/password';
import { requireActor } from '../lib/request-actor';

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(200)
});

const RegisterProviderSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(200),
  display_name: z.string().min(2).max(120)
});

type AccountLoginRow = {
  id: string;
  role: 'client' | 'provider' | 'admin';
  status: 'active' | 'suspended' | 'pending';
  password_hash: string | null;
};

function generateSlug(displayName: string): string {
  return displayName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function generatePasswordSalt(): string {
  return randomBytes(16).toString('base64url');
}

export const authRoute = new Hono();

// ── Register Provider ─────────────────────────────────────────────

authRoute.post('/register', async (c) => {
  try {
    const parsed = RegisterProviderSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      const failure = errorResponse(400, {
        code: 'VALIDATION_ERROR',
        message: 'Datos invalidos',
        fields: parsed.error.flatten().fieldErrors
      });
      return c.json(failure.body, failure.status);
    }

    const { email, password, display_name } = parsed.data;
    const normalizedEmail = email.trim().toLowerCase();
    const pool = getPool();

    const existing = await pool.query<{ id: string }>(
      `SELECT id FROM accounts WHERE email = $1 LIMIT 1`,
      [normalizedEmail]
    );

    if (existing.rowCount && existing.rowCount > 0) {
      const failure = errorResponse(409, {
        code: 'CONFLICT',
        message: 'Ya existe una cuenta con este email.'
      });
      return c.json(failure.body, failure.status);
    }

    const salt = generatePasswordSalt();
    const passwordHash = createPasswordHash(password, salt);
    const baseSlug = generateSlug(display_name);

    await pool.query('BEGIN');

    try {
      const accountResult = await pool.query<{ id: string }>(
        `INSERT INTO accounts (email, password_hash, role, status)
         VALUES ($1, $2, 'provider', 'active')
         RETURNING id::text AS id`,
        [normalizedEmail, passwordHash]
      );
      const accountId = accountResult.rows[0].id;

      let slug = baseSlug || `provider-${accountId.slice(0, 8)}`;
      const slugCheck = await pool.query<{ slug: string }>(
        `SELECT slug FROM providers WHERE slug = $1 LIMIT 1`,
        [slug]
      );
      if (slugCheck.rowCount && slugCheck.rowCount > 0) {
        slug = `${slug}-${accountId.slice(0, 6)}`;
      }

      await pool.query(
        `INSERT INTO providers (account_id, display_name, slug, status)
         VALUES ($1, $2, $3, 'draft')`,
        [accountId, display_name, slug]
      );

      await pool.query('COMMIT');

      const expiresIn = 60 * 60;
      const accessToken = createAccessToken({
        accountId,
        role: 'provider',
        expiresInSeconds: expiresIn
      });

      return c.json({
        ok: true,
        data: {
          access_token: accessToken,
          token_type: 'Bearer',
          expires_in: expiresIn,
          provider: {
            account_id: accountId,
            slug,
            display_name
          }
        }
      }, 201);
    } catch {
      await pool.query('ROLLBACK');
      throw new ApiRequestError(500, {
        code: 'INTERNAL_ERROR',
        message: 'No fue posible crear la cuenta.'
      });
    }
  } catch (error) {
    if (error instanceof ApiRequestError) {
      const failure = errorResponse(error.status, error.payload);
      return c.json(failure.body, failure.status);
    }
    const failure = errorResponse(500, {
      code: 'INTERNAL_ERROR',
      message: 'No fue posible crear la cuenta.'
    });
    return c.json(failure.body, failure.status);
  }
});

// ── Login ──────────────────────────────────────────────────────────

authRoute.post('/login', async (c) => {
  const parsed = LoginSchema.safeParse(await c.req.json());
  if (!parsed.success) {
    const failure = errorResponse(400, {
      code: 'VALIDATION_ERROR',
      message: 'Datos invalidos',
      fields: parsed.error.flatten().fieldErrors
    });
    return c.json(failure.body, failure.status);
  }

  const pool = getPool();
  const result = await pool.query<AccountLoginRow>(
    `SELECT
       id::text AS id,
       role,
       status,
       password_hash
     FROM accounts
     WHERE email = $1
     LIMIT 1`,
    [parsed.data.email.trim().toLowerCase()]
  );

  if (result.rowCount === 0) {
    const failure = errorResponse(401, {
      code: 'UNAUTHORIZED',
      message: 'Credenciales invalidas.'
    });
    return c.json(failure.body, failure.status);
  }

  const account = result.rows[0];
  const passwordOk = account.password_hash ? verifyPassword(parsed.data.password, account.password_hash) : false;
  if (!passwordOk || account.status !== 'active') {
    const failure = errorResponse(401, {
      code: 'UNAUTHORIZED',
      message: 'Credenciales invalidas.'
    });
    return c.json(failure.body, failure.status);
  }

  const expiresIn = 60 * 60;
  const accessToken = createAccessToken({
    accountId: account.id,
    role: account.role,
    expiresInSeconds: expiresIn
  });

  return c.json({
    ok: true,
    data: {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: expiresIn,
      actor: {
        account_id: account.id,
        role: account.role
      }
    }
  });
});

authRoute.get('/me', (c) => {
  const actor = requireActor(c);
  return c.json({
    ok: true,
    data: {
      account_id: actor.accountId,
      role: actor.role
    }
  });
});
