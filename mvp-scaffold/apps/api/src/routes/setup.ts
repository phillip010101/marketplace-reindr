import { Hono } from 'hono';
import { randomBytes } from 'node:crypto';
import { z } from 'zod';
import { errorResponse } from '../lib/api-errors';
import { getPool } from '../lib/db';
import { createPasswordHash } from '../lib/password';

const SetupAdminSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(200)
});

export const setupRoute = new Hono();

setupRoute.post('/first-admin', async (c) => {
  try {
    const pool = getPool();

    const existing = await pool.query<{ id: string }>(
      `SELECT id FROM accounts WHERE role = 'admin' LIMIT 1`
    );

    if (existing.rowCount && existing.rowCount > 0) {
      const failure = errorResponse(409, {
        code: 'CONFLICT',
        message: 'Ya existe una cuenta admin. Usa el login normal.'
      });
      return c.json(failure.body, failure.status);
    }

    const parsed = SetupAdminSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      const failure = errorResponse(400, {
        code: 'VALIDATION_ERROR',
        message: 'Datos invalidos',
        fields: parsed.error.flatten().fieldErrors
      });
      return c.json(failure.body, failure.status);
    }

    const { email, password } = parsed.data;
    const salt = randomBytes(16).toString('base64url');
    const passwordHash = createPasswordHash(password, salt);

    await pool.query(
      `INSERT INTO accounts (email, password_hash, role, status)
       VALUES ($1, $2, 'admin', 'active')`,
      [email.trim().toLowerCase(), passwordHash]
    );

    return c.json({
      ok: true,
      data: { message: 'Cuenta admin creada. Ya podes iniciar sesion en /admin/login.' }
    }, 201);
  } catch (error) {
    const failure = errorResponse(500, {
      code: 'INTERNAL_ERROR',
      message: 'No fue posible crear la cuenta admin.'
    });
    return c.json(failure.body, failure.status);
  }
});

setupRoute.get('/status', async (c) => {
  try {
    const pool = getPool();
    const existing = await pool.query<{ id: string }>(
      `SELECT id FROM accounts WHERE role = 'admin' LIMIT 1`
    );
    return c.json({
      ok: true,
      data: { has_admin: (existing.rowCount ?? 0) > 0 }
    });
  } catch {
    return c.json({ ok: true, data: { has_admin: true } });
  }
});
