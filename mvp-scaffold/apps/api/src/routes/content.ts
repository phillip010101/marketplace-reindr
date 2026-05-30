import { Hono } from 'hono';
import { getPool } from '../lib/db';

export const contentRoute = new Hono();

contentRoute.get('/:key', async (c) => {
  const key = c.req.param('key');
  const pool = getPool();
  const result = await pool.query<{ key: string; value: string; type: string }>(
    `SELECT key, value, type FROM site_content WHERE key = $1`, [key]
  );
  if (result.rowCount === 0) {
    return c.json({ ok: true, data: null });
  }
  return c.json({ ok: true, data: result.rows[0] });
});
