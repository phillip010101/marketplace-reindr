import { Hono } from 'hono';
import { errorResponse } from '../lib/api-errors';
import { getPool } from '../lib/db';

export const locationsRoute = new Hono();

locationsRoute.get('/', async (c) => {
  try {
    const type = c.req.query('type') ?? null;
    const pool = getPool();
    const conditions = type ? 'WHERE type = $1' : '';
    const values = type ? [type] : [];

    const result = await pool.query<{ id: string; name: string; slug: string; type: string }>(
      `SELECT id::text, name, slug, type FROM locations ${conditions} ORDER BY name ASC`,
      values
    );

    return c.json({ ok: true, data: result.rows });
  } catch {
    const failure = errorResponse(500, {
      code: 'INTERNAL_ERROR',
      message: 'No fue posible listar ubicaciones.'
    });
    return c.json(failure.body, failure.status);
  }
});
