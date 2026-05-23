import { Hono } from 'hono';
import { z } from 'zod';
import { ApiRequestError, errorResponse } from '../lib/api-errors';
import { getPool } from '../lib/db';
import { requireAdminActor } from '../lib/request-actor';

export const locationsRoute = new Hono();

const CreateLocationSchema = z.object({
  name: z.string().min(2).max(120),
  slug: z.string().min(2).max(80).regex(/^[a-z0-9-]+$/),
  type: z.enum(['country', 'region', 'city', 'zone']),
  parent_id: z.string().uuid().optional()
});

const PatchLocationSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  slug: z.string().min(2).max(80).regex(/^[a-z0-9-]+$/).optional(),
  type: z.enum(['country', 'region', 'city', 'zone']).optional()
});

// ── Public read ──────────────────────────────────────────────────

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

// ── Admin CRUD ────────────────────────────────────────────────────

locationsRoute.post('/', async (c) => {
  try {
    requireAdminActor(c);
    const parsed = CreateLocationSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      const failure = errorResponse(400, {
        code: 'VALIDATION_ERROR',
        message: 'Datos invalidos',
        fields: parsed.error.flatten().fieldErrors
      });
      return c.json(failure.body, failure.status);
    }

    const pool = getPool();
    const result = await pool.query(
      `INSERT INTO locations (name, slug, type, parent_id)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (slug) DO NOTHING
       RETURNING id::text, name, slug, type`,
      [parsed.data.name, parsed.data.slug, parsed.data.type, parsed.data.parent_id ?? null]
    );

    if (result.rowCount === 0) {
      const failure = errorResponse(409, {
        code: 'CONFLICT',
        message: 'Ya existe una ubicacion con ese slug.'
      });
      return c.json(failure.body, failure.status);
    }

    return c.json({ ok: true, data: result.rows[0] }, 201);
  } catch (error) {
    if (error instanceof ApiRequestError) {
      const failure = errorResponse(error.status, error.payload);
      return c.json(failure.body, failure.status);
    }
    const failure = errorResponse(500, {
      code: 'INTERNAL_ERROR',
      message: 'No fue posible crear la ubicacion.'
    });
    return c.json(failure.body, failure.status);
  }
});

locationsRoute.patch('/:id', async (c) => {
  try {
    requireAdminActor(c);
    const locationId = c.req.param('id');
    const parsed = PatchLocationSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      const failure = errorResponse(400, {
        code: 'VALIDATION_ERROR',
        message: 'Datos invalidos',
        fields: parsed.error.flatten().fieldErrors
      });
      return c.json(failure.body, failure.status);
    }

    const pool = getPool();
    const result = await pool.query(
      `UPDATE locations
       SET name = COALESCE($1, name),
           slug = COALESCE($2, slug),
           type = COALESCE($3, type)
       WHERE id::text = $4 OR slug = $4
       RETURNING id::text, name, slug, type`,
      [parsed.data.name ?? null, parsed.data.slug ?? null, parsed.data.type ?? null, locationId]
    );

    if (result.rowCount === 0) {
      const failure = errorResponse(404, {
        code: 'NOT_FOUND',
        message: 'Ubicacion no encontrada.'
      });
      return c.json(failure.body, failure.status);
    }

    return c.json({ ok: true, data: result.rows[0] });
  } catch (error) {
    if (error instanceof ApiRequestError) {
      const failure = errorResponse(error.status, error.payload);
      return c.json(failure.body, failure.status);
    }
    const failure = errorResponse(500, {
      code: 'INTERNAL_ERROR',
      message: 'No fue posible actualizar la ubicacion.'
    });
    return c.json(failure.body, failure.status);
  }
});
