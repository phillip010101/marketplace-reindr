import { Hono } from 'hono';
import { z } from 'zod';
import { ApiRequestError, errorResponse } from '../lib/api-errors';
import { getPool } from '../lib/db';
import { requireAdminActor } from '../lib/request-actor';

export const templatesRoute = new Hono();

type TemplateRow = {
  id: string; name: string; description: string; tags: string[]; category: string;
  heading_font: string; body_font: string; font_stack: string;
  bg_start: string; bg_end: string; text_color: string; accent_color: string;
  card_background: string; border_color: string; customizable: string[]; active: boolean;
};

// ── Public ───────────────────────────────────────────────────────

templatesRoute.get('/', async (c) => {
  try {
    const pool = getPool();
    const result = await pool.query<TemplateRow>(
      `SELECT id, name, description, tags, category, heading_font, body_font, font_stack,
         bg_start, bg_end, text_color, accent_color, card_background, border_color, customizable, active
       FROM templates WHERE active = true ORDER BY category, name`
    );
    return c.json({ ok: true, data: result.rows });
  } catch {
    const f = errorResponse(500, { code: 'INTERNAL_ERROR', message: 'No fue posible listar templates.' });
    return c.json(f.body, f.status);
  }
});

// ── Admin ────────────────────────────────────────────────────────

const TemplateSchema = z.object({
  name: z.string().min(2).max(80),
  description: z.string().min(5).max(300),
  tags: z.array(z.string()).default([]),
  category: z.enum(['calido','moderno','corporativo','creativo','minimal']),
  heading_font: z.string(), body_font: z.string(), font_stack: z.string(),
  bg_start: z.string(), bg_end: z.string(), text_color: z.string(),
  accent_color: z.string(), card_background: z.string(), border_color: z.string(),
  customizable: z.array(z.string()).default([]), active: z.boolean().default(true)
});

templatesRoute.get('/admin/list', async (c) => {
  try {
    requireAdminActor(c);
    const pool = getPool();
    const result = await pool.query<TemplateRow>(
      `SELECT * FROM templates ORDER BY category, name`
    );
    return c.json({ ok: true, data: result.rows });
  } catch (e) {
    if (e instanceof ApiRequestError) { const f = errorResponse(e.status, e.payload); return c.json(f.body, f.status); }
    const f = errorResponse(500, { code: 'INTERNAL_ERROR', message: 'No fue posible listar templates.' });
    return c.json(f.body, f.status);
  }
});

templatesRoute.post('/admin/list', async (c) => {
  try {
    requireAdminActor(c);
    const parsed = TemplateSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      const f = errorResponse(400, { code: 'VALIDATION_ERROR', message: 'Datos invalidos', fields: parsed.error.flatten().fieldErrors });
      return c.json(f.body, f.status);
    }
    const d = parsed.data;
    const id = d.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,40);
    const pool = getPool();
    await pool.query(
      `INSERT INTO templates (id, name, description, tags, category, heading_font, body_font, font_stack, bg_start, bg_end, text_color, accent_color, card_background, border_color, customizable, active)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
       ON CONFLICT (id) DO NOTHING`,
      [id, d.name, d.description, d.tags, d.category, d.heading_font, d.body_font, d.font_stack, d.bg_start, d.bg_end, d.text_color, d.accent_color, d.card_background, d.border_color, d.customizable, d.active]
    );
    return c.json({ ok: true, data: { id } }, 201);
  } catch (e) {
    if (e instanceof ApiRequestError) { const f = errorResponse(e.status, e.payload); return c.json(f.body, f.status); }
    const f = errorResponse(500, { code: 'INTERNAL_ERROR', message: 'No fue posible crear template.' });
    return c.json(f.body, f.status);
  }
});

templatesRoute.put('/admin/list/:id', async (c) => {
  try {
    requireAdminActor(c);
    const id = c.req.param('id');
    const parsed = TemplateSchema.partial().safeParse(await c.req.json());
    if (!parsed.success) {
      const f = errorResponse(400, { code: 'VALIDATION_ERROR', message: 'Datos invalidos', fields: parsed.error.flatten().fieldErrors });
      return c.json(f.body, f.status);
    }
    const d = parsed.data;
    const pool = getPool();
    const result = await pool.query(
      `UPDATE templates SET
         name = COALESCE($1, name), description = COALESCE($2, description),
         tags = COALESCE($3, tags), category = COALESCE($4, category),
         heading_font = COALESCE($5, heading_font), body_font = COALESCE($6, body_font),
         font_stack = COALESCE($7, font_stack), bg_start = COALESCE($8, bg_start),
         bg_end = COALESCE($9, bg_end), text_color = COALESCE($10, text_color),
         accent_color = COALESCE($11, accent_color), card_background = COALESCE($12, card_background),
         border_color = COALESCE($13, border_color), customizable = COALESCE($14, customizable),
         active = COALESCE($15, active), updated_at = now()
       WHERE id = $16
       RETURNING id`,
      [d.name ?? null, d.description ?? null, d.tags ?? null, d.category ?? null,
       d.heading_font ?? null, d.body_font ?? null, d.font_stack ?? null,
       d.bg_start ?? null, d.bg_end ?? null, d.text_color ?? null,
       d.accent_color ?? null, d.card_background ?? null, d.border_color ?? null,
       d.customizable ?? null, d.active ?? null, id]
    );
    if (result.rowCount === 0) {
      const f = errorResponse(404, { code: 'NOT_FOUND', message: 'Template no encontrado.' });
      return c.json(f.body, f.status);
    }
    return c.json({ ok: true, data: { id } });
  } catch (e) {
    if (e instanceof ApiRequestError) { const f = errorResponse(e.status, e.payload); return c.json(f.body, f.status); }
    const f = errorResponse(500, { code: 'INTERNAL_ERROR', message: 'No fue posible actualizar template.' });
    return c.json(f.body, f.status);
  }
});

templatesRoute.delete('/admin/list/:id', async (c) => {
  try {
    requireAdminActor(c);
    const id = c.req.param('id');
    const pool = getPool();
    await pool.query(`UPDATE templates SET active = false WHERE id = $1`, [id]);
    return c.json({ ok: true, data: { id } });
  } catch (e) {
    if (e instanceof ApiRequestError) { const f = errorResponse(e.status, e.payload); return c.json(f.body, f.status); }
    const f = errorResponse(500, { code: 'INTERNAL_ERROR', message: 'No fue posible eliminar template.' });
    return c.json(f.body, f.status);
  }
});
