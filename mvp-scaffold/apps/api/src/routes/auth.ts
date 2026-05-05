import { Hono } from 'hono';
import { z } from 'zod';
import { createAccessToken } from '../lib/auth-token';
import { errorResponse } from '../lib/api-errors';
import { getPool } from '../lib/db';
import { verifyPassword } from '../lib/password';
import { requireActor } from '../lib/request-actor';

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(200)
});

type AccountLoginRow = {
  id: string;
  role: 'client' | 'provider' | 'admin';
  status: 'active' | 'suspended' | 'pending';
  password_hash: string | null;
};

export const authRoute = new Hono();

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
