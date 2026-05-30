import { Hono } from 'hono';
import { z } from 'zod';
import { ApiRequestError, errorResponse } from '../lib/api-errors';
import { getPool } from '../lib/db';
import { requireAdminActor } from '../lib/request-actor';

export const postsRoute = new Hono();

const CreatePostSchema = z.object({
  title: z.string().min(3).max(200),
  slug: z.string().min(3).max(200).regex(/^[a-z0-9-]+$/),
  description: z.string().max(300).optional(),
  body: z.string().min(1),
  status: z.enum(['draft', 'published', 'archived']).optional().default('draft'),
  tags: z.array(z.string()).optional().default([]),
  city: z.string().optional(),
  service: z.string().optional()
});

const UpdatePostSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  slug: z.string().min(3).max(200).regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().max(300).optional(),
  body: z.string().min(1).optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  tags: z.array(z.string()).optional(),
  city: z.string().optional(),
  service: z.string().optional()
});

type PostRow = {
  id: string; title: string; slug: string; description: string | null;
  body: string; status: string; tags: string[] | null;
  city: string | null; service: string | null;
  published_at: string | null; created_at: string; updated_at: string;
};

// ── Public ───────────────────────────────────────────────────────

postsRoute.get('/', async (c) => {
  try {
    const pool = getPool();
    const result = await pool.query<PostRow>(
      `SELECT id::text, title, slug, description, status, tags, city, service, published_at, created_at, updated_at
       FROM posts WHERE status = 'published' ORDER BY published_at DESC NULLS LAST LIMIT 50`
    );
    return c.json({ ok: true, data: result.rows });
  } catch {
    const f = errorResponse(500, { code: 'INTERNAL_ERROR', message: 'No fue posible listar posts.' });
    return c.json(f.body, f.status);
  }
});

postsRoute.get('/:slug', async (c) => {
  try {
    const slug = c.req.param('slug');
    const pool = getPool();
    const result = await pool.query<PostRow>(
      `SELECT id::text, title, slug, description, body, status, tags, city, service, published_at, created_at, updated_at
       FROM posts WHERE slug = $1 AND status = 'published' LIMIT 1`, [slug]
    );
    if (result.rowCount === 0) {
      const f = errorResponse(404, { code: 'NOT_FOUND', message: 'Post no encontrado.' });
      return c.json(f.body, f.status);
    }
    return c.json({ ok: true, data: result.rows[0] });
  } catch (error) {
    if (error instanceof ApiRequestError) { const f = errorResponse(error.status, error.payload); return c.json(f.body, f.status); }
    const f = errorResponse(500, { code: 'INTERNAL_ERROR', message: 'No fue posible leer el post.' });
    return c.json(f.body, f.status);
  }
});

// ── Admin ────────────────────────────────────────────────────────

postsRoute.get('/admin/list', async (c) => {
  try {
    requireAdminActor(c);
    const pool = getPool();
    const result = await pool.query<PostRow>(
      `SELECT id::text, title, slug, description, status, tags, city, service, published_at, created_at, updated_at
       FROM posts ORDER BY created_at DESC LIMIT 100`
    );
    return c.json({ ok: true, data: result.rows });
  } catch (error) {
    if (error instanceof ApiRequestError) { const f = errorResponse(error.status, error.payload); return c.json(f.body, f.status); }
    const f = errorResponse(500, { code: 'INTERNAL_ERROR', message: 'No fue posible listar posts.' });
    return c.json(f.body, f.status);
  }
});

postsRoute.post('/admin/list', async (c) => {
  try {
    requireAdminActor(c);
    const parsed = CreatePostSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      const f = errorResponse(400, { code: 'VALIDATION_ERROR', message: 'Datos invalidos', fields: parsed.error.flatten().fieldErrors });
      return c.json(f.body, f.status);
    }

    const pool = getPool();
    const data = parsed.data;
    const result = await pool.query<PostRow>(
      `INSERT INTO posts (title, slug, description, body, status, tags, city, service, published_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8, CASE WHEN $5 = 'published' THEN now() ELSE NULL END)
       ON CONFLICT (slug) DO NOTHING
       RETURNING id::text, title, slug, description, status, tags`,
      [data.title, data.slug, data.description ?? null, data.body, data.status, data.tags, data.city ?? null, data.service ?? null]
    );

    if (result.rowCount === 0) {
      const f = errorResponse(409, { code: 'CONFLICT', message: 'Ya existe un post con ese slug.' });
      return c.json(f.body, f.status);
    }
    return c.json({ ok: true, data: result.rows[0] }, 201);
  } catch (error) {
    if (error instanceof ApiRequestError) { const f = errorResponse(error.status, error.payload); return c.json(f.body, f.status); }
    const f = errorResponse(500, { code: 'INTERNAL_ERROR', message: 'No fue posible crear el post.' });
    return c.json(f.body, f.status);
  }
});

postsRoute.put('/admin/list/:id', async (c) => {
  try {
    requireAdminActor(c);
    const id = c.req.param('id');
    const parsed = UpdatePostSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      const f = errorResponse(400, { code: 'VALIDATION_ERROR', message: 'Datos invalidos', fields: parsed.error.flatten().fieldErrors });
      return c.json(f.body, f.status);
    }

    const pool = getPool();
    const d = parsed.data;
    const result = await pool.query<PostRow>(
      `UPDATE posts SET
         title = COALESCE($1, title), slug = COALESCE($2, slug),
         description = COALESCE($3, description), body = COALESCE($4, body),
         status = COALESCE($5, status), tags = COALESCE($6, tags),
         city = COALESCE($7, city), service = COALESCE($8, service),
         published_at = CASE WHEN $5 = 'published' AND published_at IS NULL THEN now() ELSE published_at END,
         updated_at = now()
       WHERE id::text = $9
       RETURNING id::text, title, slug, description, status, tags, updated_at`,
      [d.title ?? null, d.slug ?? null, d.description ?? null, d.body ?? null,
       d.status ?? null, d.tags ?? null, d.city ?? null, d.service ?? null, id]
    );
    if (result.rowCount === 0) {
      const f = errorResponse(404, { code: 'NOT_FOUND', message: 'Post no encontrado.' });
      return c.json(f.body, f.status);
    }
    return c.json({ ok: true, data: result.rows[0] });
  } catch (error) {
    if (error instanceof ApiRequestError) { const f = errorResponse(error.status, error.payload); return c.json(f.body, f.status); }
    const f = errorResponse(500, { code: 'INTERNAL_ERROR', message: 'No fue posible actualizar el post.' });
    return c.json(f.body, f.status);
  }
});

postsRoute.delete('/admin/list/:id', async (c) => {
  try {
    requireAdminActor(c);
    const id = c.req.param('id');
    const pool = getPool();
    const result = await pool.query(`DELETE FROM posts WHERE id::text = $1 RETURNING id::text`, [id]);
    if (result.rowCount === 0) {
      const f = errorResponse(404, { code: 'NOT_FOUND', message: 'Post no encontrado.' });
      return c.json(f.body, f.status);
    }
    return c.json({ ok: true, data: { id } });
  } catch (error) {
    if (error instanceof ApiRequestError) { const f = errorResponse(error.status, error.payload); return c.json(f.body, f.status); }
    const f = errorResponse(500, { code: 'INTERNAL_ERROR', message: 'No fue posible eliminar el post.' });
    return c.json(f.body, f.status);
  }
});
