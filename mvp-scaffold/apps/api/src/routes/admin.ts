import { Hono } from 'hono';
import { z } from 'zod';
import { ApiRequestError, errorResponse } from '../lib/api-errors';
import { getPool } from '../lib/db';
import { requireAdminActor } from '../lib/request-actor';
import { validateOpportunityTransition } from '../../../../packages/core/src/opportunity-state';

const ModerateReviewSchema = z.object({
  status: z.enum(['approved', 'rejected', 'flagged']),
  note: z.string().max(2000).optional()
});

const CreateServiceSchema = z.object({
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
  name: z.string().min(2),
  description: z.string().min(4),
  base_lead_price: z.coerce.number().int().min(0).optional().default(0)
});

const PatchServiceSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().min(4).optional(),
  status: z.enum(['active', 'inactive']).optional(),
  base_lead_price: z.coerce.number().int().min(0).optional()
});

const EventsQuerySchema = z.object({
  event_type: z.string().max(80).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0)
});

const ProvidersQuerySchema = z.object({
  status: z.enum(['draft', 'pending_review', 'active', 'suspended']).optional(),
  search: z.string().max(120).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0)
});

const LeadsQuerySchema = z.object({
  status: z.string().max(40).optional(),
  city_id: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(200).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0)
});

const ReassignOpportunitySchema = z.object({
  provider_id: z.string().uuid()
});

const CreateServiceRelationSchema = z.object({
  source_service_id: z.string().uuid(),
  target_service_id: z.string().uuid(),
  relation_type: z.enum(['complement', 'prerequisite', 'upsell', 'alternative']),
  weight: z.coerce.number().int().min(0).optional().default(0),
  prompt_label: z.string().max(200).optional(),
  active: z.coerce.boolean().optional().default(true)
});

const PatchServiceRelationSchema = z.object({
  relation_type: z.enum(['complement', 'prerequisite', 'upsell', 'alternative']).optional(),
  weight: z.coerce.number().int().min(0).optional(),
  prompt_label: z.string().max(200).optional(),
  active: z.coerce.boolean().optional()
});

export const adminRoute = new Hono();

type AdminServiceRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  status: 'active' | 'inactive';
  base_lead_price: number;
};

type AdminReviewModerationRow = {
  id: string;
  status: 'approved' | 'rejected' | 'flagged';
  provider_id: string;
};

async function appendAdminEvent(input: {
  eventType: string;
  actorAccountId: string;
  payload: Record<string, unknown>;
}): Promise<void> {
  const pool = getPool();
  await pool.query(
    `INSERT INTO admin_events (event_type, actor_account_id, payload)
     VALUES ($1, $2, $3::jsonb)`,
    [input.eventType, input.actorAccountId, JSON.stringify(input.payload)]
  );
}

// ── Services CRUD (existing) ──────────────────────────────────────

adminRoute.get('/services', async (c) => {
  try {
    requireAdminActor(c);
    const pool = getPool();
    const result = await pool.query<AdminServiceRow>(
      `SELECT
         id::text AS id,
         slug,
         name,
         description,
         status,
         base_lead_price
       FROM services
       ORDER BY name ASC`
    );
    return c.json({ ok: true, data: result.rows });
  } catch (error) {
    if (error instanceof ApiRequestError) {
      const failure = errorResponse(error.status, error.payload);
      return c.json(failure.body, failure.status);
    }
    const failure = errorResponse(500, {
      code: 'INTERNAL_ERROR',
      message: 'No fue posible listar servicios.'
    });
    return c.json(failure.body, failure.status);
  }
});

adminRoute.post('/services', async (c) => {
  try {
    const actor = requireAdminActor(c);
    const parsed = CreateServiceSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      const failure = errorResponse(400, {
        code: 'VALIDATION_ERROR',
        message: 'Datos invalidos',
        fields: parsed.error.flatten().fieldErrors
      });
      return c.json(failure.body, failure.status);
    }

    const pool = getPool();
    const insertResult = await pool.query<AdminServiceRow>(
      `INSERT INTO services (slug, name, description, status, base_lead_price)
       VALUES ($1, $2, $3, 'active', $4)
       ON CONFLICT (slug) DO NOTHING
       RETURNING
         id::text AS id,
         slug,
         name,
         description,
         status,
         base_lead_price`,
      [
        parsed.data.slug,
        parsed.data.name,
        parsed.data.description,
        parsed.data.base_lead_price
      ]
    );

    if (insertResult.rowCount === 0) {
      const failure = errorResponse(409, {
        code: 'CONFLICT',
        message: 'El servicio ya existe.'
      });
      return c.json(failure.body, failure.status);
    }

    await appendAdminEvent({
      eventType: 'service_created',
      actorAccountId: actor.accountId,
      payload: {
        service_slug: insertResult.rows[0].slug
      }
    });

    return c.json({ ok: true, data: insertResult.rows[0] }, 201);
  } catch (error) {
    if (error instanceof ApiRequestError) {
      const failure = errorResponse(error.status, error.payload);
      return c.json(failure.body, failure.status);
    }
    const failure = errorResponse(500, {
      code: 'INTERNAL_ERROR',
      message: 'No fue posible crear el servicio.'
    });
    return c.json(failure.body, failure.status);
  }
});

adminRoute.patch('/services/:id', async (c) => {
  try {
    const actor = requireAdminActor(c);
    const serviceId = c.req.param('id');
    const parsed = PatchServiceSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      const failure = errorResponse(400, {
        code: 'VALIDATION_ERROR',
        message: 'Datos invalidos',
        fields: parsed.error.flatten().fieldErrors
      });
      return c.json(failure.body, failure.status);
    }

    if (Object.keys(parsed.data).length === 0) {
      const failure = errorResponse(400, {
        code: 'VALIDATION_ERROR',
        message: 'No hay campos para actualizar.'
      });
      return c.json(failure.body, failure.status);
    }

    const pool = getPool();
    const updateResult = await pool.query<AdminServiceRow>(
      `UPDATE services
       SET
         name = COALESCE($1, name),
         description = COALESCE($2, description),
         status = COALESCE($3, status),
         base_lead_price = COALESCE($4, base_lead_price),
         updated_at = now()
       WHERE (id::text = $5 OR slug = $5)
       RETURNING
         id::text AS id,
         slug,
         name,
         description,
         status,
         base_lead_price`,
      [
        parsed.data.name ?? null,
        parsed.data.description ?? null,
        parsed.data.status ?? null,
        parsed.data.base_lead_price ?? null,
        serviceId
      ]
    );

    if (updateResult.rowCount === 0) {
      const failure = errorResponse(404, {
        code: 'NOT_FOUND',
        message: 'Servicio no encontrado.'
      });
      return c.json(failure.body, failure.status);
    }

    await appendAdminEvent({
      eventType: 'service_updated',
      actorAccountId: actor.accountId,
      payload: {
        service_slug: updateResult.rows[0].slug
      }
    });

    return c.json({ ok: true, data: updateResult.rows[0] });
  } catch (error) {
    if (error instanceof ApiRequestError) {
      const failure = errorResponse(error.status, error.payload);
      return c.json(failure.body, failure.status);
    }
    const failure = errorResponse(500, {
      code: 'INTERNAL_ERROR',
      message: 'No fue posible actualizar el servicio.'
    });
    return c.json(failure.body, failure.status);
  }
});

// ── Reviews moderation (existing) ─────────────────────────────────

adminRoute.post('/reviews/:id/moderate', async (c) => {
  try {
    const actor = requireAdminActor(c);
    const reviewId = c.req.param('id');
    const parsed = ModerateReviewSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      const failure = errorResponse(400, {
        code: 'VALIDATION_ERROR',
        message: 'Datos invalidos',
        fields: parsed.error.flatten().fieldErrors
      });
      return c.json(failure.body, failure.status);
    }

    const pool = getPool();
    const reviewResult = await pool.query<AdminReviewModerationRow>(
      `UPDATE reviews
       SET status = $1
       WHERE id::text = $2
       RETURNING id::text AS id, status, provider_id::text AS provider_id`,
      [parsed.data.status, reviewId]
    );

    if (reviewResult.rowCount === 0) {
      const failure = errorResponse(404, {
        code: 'NOT_FOUND',
        message: 'Review no encontrada.'
      });
      return c.json(failure.body, failure.status);
    }

    await appendAdminEvent({
      eventType: 'review_moderated',
      actorAccountId: actor.accountId,
      payload: {
        review_id: reviewResult.rows[0].id,
        provider_id: reviewResult.rows[0].provider_id,
        status: reviewResult.rows[0].status,
        note: parsed.data.note ?? null
      }
    });

    return c.json({
      ok: true,
      data: {
        review_id: reviewResult.rows[0].id,
        status: reviewResult.rows[0].status
      }
    });
  } catch (error) {
    if (error instanceof ApiRequestError) {
      const failure = errorResponse(error.status, error.payload);
      return c.json(failure.body, failure.status);
    }
    const failure = errorResponse(500, {
      code: 'INTERNAL_ERROR',
      message: 'No fue posible moderar la review.'
    });
    return c.json(failure.body, failure.status);
  }
});

// ── Events (NEW - real DB query) ──────────────────────────────────

adminRoute.get('/events', async (c) => {
  try {
    requireAdminActor(c);
    const query = EventsQuerySchema.safeParse({
      event_type: c.req.query('event_type'),
      limit: c.req.query('limit'),
      offset: c.req.query('offset')
    });
    const params = query.success ? query.data : { limit: 50, offset: 0 };

    const pool = getPool();
    const conditions: string[] = [];
    const values: (string | number)[] = [];
    let paramIdx = 1;

    if (params.event_type) {
      conditions.push(`event_type = $${paramIdx++}`);
      values.push(params.event_type);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await pool.query<{ total: string }>(
      `SELECT COUNT(*)::text AS total FROM admin_events ${where}`,
      values
    );
    const total = Number(countResult.rows[0].total);

    values.push(params.limit);
    const limitIdx = paramIdx++;
    values.push(params.offset);
    const offsetIdx = paramIdx++;

    const result = await pool.query(
      `SELECT
         id::text AS id,
         event_type,
         actor_account_id,
         payload,
         created_at
       FROM admin_events
       ${where}
       ORDER BY created_at DESC
       LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
      values
    );

    return c.json({
      ok: true,
      data: {
        events: result.rows,
        total,
        limit: params.limit,
        offset: params.offset
      }
    });
  } catch (error) {
    if (error instanceof ApiRequestError) {
      const failure = errorResponse(error.status, error.payload);
      return c.json(failure.body, failure.status);
    }
    const failure = errorResponse(500, {
      code: 'INTERNAL_ERROR',
      message: 'No fue posible consultar eventos.'
    });
    return c.json(failure.body, failure.status);
  }
});

// ── Providers management (NEW) ────────────────────────────────────

const CreateProviderSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(200),
  display_name: z.string().min(2).max(120),
  template_id: z.string().max(80).optional(),
  services: z.array(z.string().min(2).max(80)).max(50).optional()
});

adminRoute.post('/providers', async (c) => {
  try {
    const actor = requireAdminActor(c);
    const parsed = CreateProviderSchema.safeParse(await c.req.json());
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

    const { randomBytes } = await import('node:crypto');
    const { createPasswordHash } = await import('../lib/password');
    const salt = randomBytes(16).toString('base64url');
    const passwordHash = createPasswordHash(password, salt);
    const baseSlug = display_name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || `provider-${Date.now()}`;

    await pool.query('BEGIN');

    try {
      const accountResult = await pool.query<{ id: string }>(
        `INSERT INTO accounts (email, password_hash, role, status)
         VALUES ($1, $2, 'provider', 'active')
         RETURNING id::text AS id`,
        [normalizedEmail, passwordHash]
      );
      const accountId = accountResult.rows[0].id;

      let slug = baseSlug;
      const slugCheck = await pool.query<{ slug: string }>(
        `SELECT slug FROM providers WHERE slug = $1 LIMIT 1`,
        [slug]
      );
      if (slugCheck.rowCount && slugCheck.rowCount > 0) {
        slug = `${slug}-${accountId.slice(0, 6)}`;
      }

      const templateId = parsed.data.template_id ?? null;

      const providerResult = await pool.query<{ id: string }>(
        `INSERT INTO providers (account_id, display_name, slug, status, template_id)
         VALUES ($1, $2, $3, 'draft', $4)
         RETURNING id::text AS id`,
        [accountId, display_name, slug, templateId]
      );
      const providerId = providerResult.rows[0].id;

      if (parsed.data.services && parsed.data.services.length > 0) {
        const slugList = parsed.data.services.map((_, i) => `$${i + 1}`).join(', ');
        const svcRows = await pool.query<{ id: string }>(
          `SELECT id FROM services WHERE slug IN (${slugList}) AND status = 'active'`,
          parsed.data.services
        );
        const locResult = await pool.query<{ id: string }>(
          `SELECT id FROM locations WHERE slug = 'bogota' AND type = 'city' LIMIT 1`
        );
        const bogotaId = locResult.rows[0]?.id;
        if (bogotaId) {
          for (const svc of svcRows.rows) {
            await pool.query(
              `INSERT INTO provider_services (provider_id, service_id, location_id, active)
               VALUES ($1, $2, $3, true)
               ON CONFLICT DO NOTHING`,
              [providerId, svc.id, bogotaId]
            );
          }
        }
      }

      await pool.query('COMMIT');

      await appendAdminEvent({
        eventType: 'provider_created',
        actorAccountId: actor.accountId,
        payload: { provider_slug: slug, display_name, email: normalizedEmail }
      });

      return c.json({
        ok: true,
        data: { account_id: accountId, slug, display_name, email: normalizedEmail, status: 'draft' }
      }, 201);
    } catch {
      await pool.query('ROLLBACK');
      throw new ApiRequestError(500, {
        code: 'INTERNAL_ERROR',
        message: 'No fue posible crear el proveedor.'
      });
    }
  } catch (error) {
    if (error instanceof ApiRequestError) {
      const failure = errorResponse(error.status, error.payload);
      return c.json(failure.body, failure.status);
    }
    const failure = errorResponse(500, {
      code: 'INTERNAL_ERROR',
      message: 'No fue posible crear el proveedor.'
    });
    return c.json(failure.body, failure.status);
  }
});

adminRoute.get('/providers', async (c) => {
  try {
    requireAdminActor(c);
    const query = ProvidersQuerySchema.safeParse({
      status: c.req.query('status'),
      search: c.req.query('search'),
      limit: c.req.query('limit'),
      offset: c.req.query('offset')
    });
    const params = query.success ? query.data : { limit: 50, offset: 0 };

    const pool = getPool();
    const conditions: string[] = [];
    const values: (string | number)[] = [];
    let paramIdx = 1;

    if (params.status) {
      conditions.push(`p.status = $${paramIdx++}`);
      values.push(params.status);
    }

    if (params.search) {
      conditions.push(
        `(p.display_name ILIKE $${paramIdx} OR p.slug ILIKE $${paramIdx})`
      );
      values.push(`%${params.search}%`);
      paramIdx++;
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await pool.query<{ total: string }>(
      `SELECT COUNT(*)::text AS total FROM providers p ${where}`,
      values
    );
    const total = Number(countResult.rows[0].total);

    values.push(params.limit);
    const limitIdx = paramIdx++;
    values.push(params.offset);
    const offsetIdx = paramIdx++;

    const result = await pool.query(
      `SELECT
         p.id::text AS id,
         p.display_name,
         p.slug,
         p.description,
         p.phone,
         p.whatsapp,
         p.website_url,
         p.status,
         p.template_id,
         p.verified_at,
         p.created_at,
         p.updated_at,
         a.email AS account_email,
         a.status AS account_status,
         COALESCE(
           (SELECT json_agg(json_build_object(
             'service_id', ps.service_id::text,
             'service_slug', s.slug,
             'service_name', s.name,
             'location_id', ps.location_id::text,
             'location_slug', loc.slug,
             'location_name', loc.name,
             'active', ps.active
           ))
           FROM provider_services ps
           JOIN services s ON s.id = ps.service_id
           JOIN locations loc ON loc.id = ps.location_id
           WHERE ps.provider_id = p.id),
           '[]'::json
         ) AS services
       FROM providers p
       LEFT JOIN accounts a ON a.id = p.account_id
       ${where}
       ORDER BY p.created_at DESC
       LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
      values
    );

    return c.json({
      ok: true,
      data: {
        providers: result.rows,
        total,
        limit: params.limit,
        offset: params.offset
      }
    });
  } catch (error) {
    if (error instanceof ApiRequestError) {
      const failure = errorResponse(error.status, error.payload);
      return c.json(failure.body, failure.status);
    }
    const failure = errorResponse(500, {
      code: 'INTERNAL_ERROR',
      message: 'No fue posible listar proveedores.'
    });
    return c.json(failure.body, failure.status);
  }
});

adminRoute.post('/providers/:id/approve', async (c) => {
  try {
    const actor = requireAdminActor(c);
    const providerId = c.req.param('id');
    const pool = getPool();

    const result = await pool.query<{ id: string; slug: string; status: string }>(
      `UPDATE providers
       SET status = 'active', verified_at = COALESCE(verified_at, now()), updated_at = now()
       WHERE (id::text = $1 OR slug = $1) AND status IN ('draft', 'pending_review', 'suspended')
       RETURNING id::text AS id, slug, status`,
      [providerId]
    );

    if (result.rowCount === 0) {
      const failure = errorResponse(404, {
        code: 'NOT_FOUND',
        message: 'Proveedor no encontrado o no esta en estado aprobable.'
      });
      return c.json(failure.body, failure.status);
    }

    await appendAdminEvent({
      eventType: 'provider_approved',
      actorAccountId: actor.accountId,
      payload: { provider_id: result.rows[0].id, provider_slug: result.rows[0].slug }
    });

    return c.json({ ok: true, data: result.rows[0] });
  } catch (error) {
    if (error instanceof ApiRequestError) {
      const failure = errorResponse(error.status, error.payload);
      return c.json(failure.body, failure.status);
    }
    const failure = errorResponse(500, {
      code: 'INTERNAL_ERROR',
      message: 'No fue posible aprobar el proveedor.'
    });
    return c.json(failure.body, failure.status);
  }
});

adminRoute.post('/providers/:id/suspend', async (c) => {
  try {
    const actor = requireAdminActor(c);
    const providerId = c.req.param('id');
    const pool = getPool();

    const result = await pool.query<{ id: string; slug: string; status: string }>(
      `UPDATE providers
       SET status = 'suspended', updated_at = now()
       WHERE (id::text = $1 OR slug = $1) AND status = 'active'
       RETURNING id::text AS id, slug, status`,
      [providerId]
    );

    if (result.rowCount === 0) {
      const failure = errorResponse(404, {
        code: 'NOT_FOUND',
        message: 'Proveedor no encontrado o no esta activo.'
      });
      return c.json(failure.body, failure.status);
    }

    await appendAdminEvent({
      eventType: 'provider_suspended',
      actorAccountId: actor.accountId,
      payload: { provider_id: result.rows[0].id, provider_slug: result.rows[0].slug }
    });

    return c.json({ ok: true, data: result.rows[0] });
  } catch (error) {
    if (error instanceof ApiRequestError) {
      const failure = errorResponse(error.status, error.payload);
      return c.json(failure.body, failure.status);
    }
    const failure = errorResponse(500, {
      code: 'INTERNAL_ERROR',
      message: 'No fue posible suspender el proveedor.'
    });
    return c.json(failure.body, failure.status);
  }
});

// ── Leads management (NEW) ────────────────────────────────────────

adminRoute.get('/leads', async (c) => {
  try {
    requireAdminActor(c);
    const query = LeadsQuerySchema.safeParse({
      status: c.req.query('status'),
      city_id: c.req.query('city_id'),
      limit: c.req.query('limit'),
      offset: c.req.query('offset')
    });
    const params = query.success ? query.data : { limit: 50, offset: 0 };

    const pool = getPool();
    const conditions: string[] = [];
    const values: (string | number)[] = [];
    let paramIdx = 1;

    if (params.status) {
      conditions.push(`l.status = $${paramIdx++}`);
      values.push(params.status);
    }

    if (params.city_id) {
      conditions.push(`l.city_id::text = $${paramIdx++}`);
      values.push(params.city_id);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await pool.query<{ total: string }>(
      `SELECT COUNT(*)::text AS total FROM leads l ${where}`,
      values
    );
    const total = Number(countResult.rows[0].total);

    values.push(params.limit);
    const limitIdx = paramIdx++;
    values.push(params.offset);
    const offsetIdx = paramIdx++;

    const result = await pool.query(
      `SELECT
         l.id::text AS id,
         l.public_code,
         l.client_name,
         l.client_email,
         l.client_phone,
         l.description,
         l.budget_range,
         l.urgency,
         l.source,
         l.status,
         l.consent_at,
         l.created_at,
         loc.name AS city_name,
         loc.slug AS city_slug,
         s.name AS primary_service_name,
         s.slug AS primary_service_slug,
         COALESCE(
           (SELECT json_agg(json_build_object(
             'id', lo.id::text,
             'provider_id', lo.provider_id::text,
             'provider_slug', p.slug,
             'provider_name', p.display_name,
             'service_slug', sv.slug,
             'service_name', sv.name,
             'status', lo.status,
             'valid_for_billing', lo.valid_for_billing,
             'lead_price', lo.lead_price
           ))
           FROM lead_opportunities lo
           JOIN providers p ON p.id = lo.provider_id
           JOIN services sv ON sv.id = lo.service_id
           WHERE lo.lead_id = l.id),
           '[]'::json
         ) AS opportunities
       FROM leads l
       JOIN locations loc ON loc.id = l.city_id
       JOIN services s ON s.id = l.primary_service_id
       ${where}
       ORDER BY l.created_at DESC
       LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
      values
    );

    return c.json({
      ok: true,
      data: {
        leads: result.rows,
        total,
        limit: params.limit,
        offset: params.offset
      }
    });
  } catch (error) {
    if (error instanceof ApiRequestError) {
      const failure = errorResponse(error.status, error.payload);
      return c.json(failure.body, failure.status);
    }
    const failure = errorResponse(500, {
      code: 'INTERNAL_ERROR',
      message: 'No fue posible listar leads.'
    });
    return c.json(failure.body, failure.status);
  }
});

adminRoute.post('/leads/:opportunityId/reassign', async (c) => {
  try {
    const actor = requireAdminActor(c);
    const opportunityId = c.req.param('opportunityId');
    const parsed = ReassignOpportunitySchema.safeParse(await c.req.json());
    if (!parsed.success) {
      const failure = errorResponse(400, {
        code: 'VALIDATION_ERROR',
        message: 'Datos invalidos',
        fields: parsed.error.flatten().fieldErrors
      });
      return c.json(failure.body, failure.status);
    }

    const pool = getPool();

    const current = await pool.query<{ lead_id: string; provider_id: string; service_id: string }>(
      `SELECT lead_id::text, provider_id::text, service_id::text
       FROM lead_opportunities
       WHERE id::text = $1`,
      [opportunityId]
    );

    if (current.rowCount === 0) {
      const failure = errorResponse(404, {
        code: 'NOT_FOUND',
        message: 'Oportunidad no encontrada.'
      });
      return c.json(failure.body, failure.status);
    }

    const { lead_id, service_id } = current.rows[0];
    const previousProviderId = current.rows[0].provider_id;

    const targetProvider = await pool.query<{ id: string; status: string }>(
      `SELECT id::text, status FROM providers WHERE id::text = $1`,
      [parsed.data.provider_id]
    );

    if (targetProvider.rowCount === 0) {
      const failure = errorResponse(404, {
        code: 'NOT_FOUND',
        message: 'Proveedor destino no encontrado.'
      });
      return c.json(failure.body, failure.status);
    }

    if (targetProvider.rows[0].status !== 'active') {
      const failure = errorResponse(400, {
        code: 'INVALID_STATE',
        message: 'El proveedor destino no esta activo.'
      });
      return c.json(failure.body, failure.status);
    }

    await pool.query('BEGIN');

    try {
      await pool.query(
        `UPDATE lead_opportunities
         SET provider_id = $1
         WHERE id::text = $2`,
        [parsed.data.provider_id, opportunityId]
      );

      await pool.query(
        `INSERT INTO lead_events (lead_id, opportunity_id, actor_type, actor_id, event_type, payload)
         VALUES ($1, $2, 'admin', $3, 'opportunity_reassigned', $4::jsonb)`,
        [
          lead_id,
          opportunityId,
          actor.accountId,
          JSON.stringify({
            previous_provider_id: previousProviderId,
            new_provider_id: parsed.data.provider_id
          })
        ]
      );

      await pool.query('COMMIT');
    } catch {
      await pool.query('ROLLBACK');
      throw new Error('Transaction failed');
    }

    await appendAdminEvent({
      eventType: 'lead_reassigned',
      actorAccountId: actor.accountId,
      payload: {
        opportunity_id: opportunityId,
        lead_id,
        service_id,
        previous_provider_id: previousProviderId,
        new_provider_id: parsed.data.provider_id
      }
    });

    return c.json({
      ok: true,
      data: {
        opportunity_id: opportunityId,
        previous_provider_id: previousProviderId,
        new_provider_id: parsed.data.provider_id
      }
    });
  } catch (error) {
    if (error instanceof ApiRequestError) {
      const failure = errorResponse(error.status, error.payload);
      return c.json(failure.body, failure.status);
    }
    const failure = errorResponse(500, {
      code: 'INTERNAL_ERROR',
      message: 'No fue posible reasignar la oportunidad.'
    });
    return c.json(failure.body, failure.status);
  }
});

adminRoute.post('/leads/:opportunityId/mark-invalid', async (c) => {
  try {
    const actor = requireAdminActor(c);
    const opportunityId = c.req.param('opportunityId');
    const pool = getPool();

    const current = await pool.query<{ lead_id: string; status: string }>(
      `SELECT lead_id::text, status
       FROM lead_opportunities
       WHERE id::text = $1`,
      [opportunityId]
    );

    if (current.rowCount === 0) {
      const failure = errorResponse(404, {
        code: 'NOT_FOUND',
        message: 'Oportunidad no encontrada.'
      });
      return c.json(failure.body, failure.status);
    }

    const transition = validateOpportunityTransition(
      current.rows[0].status as 'new' | 'viewed' | 'contacted' | 'quoted' | 'won' | 'lost' | 'rejected' | 'invalid',
      'invalid',
      'admin'
    );

    if (!transition.ok) {
      const failure = errorResponse(400, {
        code: 'INVALID_TRANSITION',
        message: transition.reason
      });
      return c.json(failure.body, failure.status);
    }

    const { lead_id } = current.rows[0];

    await pool.query('BEGIN');

    try {
      await pool.query(
        `UPDATE lead_opportunities
         SET status = 'invalid', closed_at = now()
         WHERE id::text = $1`,
        [opportunityId]
      );

      await pool.query(
        `INSERT INTO lead_events (lead_id, opportunity_id, actor_type, actor_id, event_type, payload)
         VALUES ($1, $2, 'admin', $3, 'opportunity_marked_invalid', $4::jsonb)`,
        [lead_id, opportunityId, actor.accountId, JSON.stringify({ reason: 'admin_action' })]
      );

      await pool.query('COMMIT');
    } catch {
      await pool.query('ROLLBACK');
      throw new Error('Transaction failed');
    }

    await appendAdminEvent({
      eventType: 'lead_marked_invalid',
      actorAccountId: actor.accountId,
      payload: { opportunity_id: opportunityId, lead_id }
    });

    return c.json({
      ok: true,
      data: { opportunity_id: opportunityId, status: 'invalid' }
    });
  } catch (error) {
    if (error instanceof ApiRequestError) {
      const failure = errorResponse(error.status, error.payload);
      return c.json(failure.body, failure.status);
    }
    const failure = errorResponse(500, {
      code: 'INTERNAL_ERROR',
      message: 'No fue posible marcar la oportunidad como invalida.'
    });
    return c.json(failure.body, failure.status);
  }
});

// ── Service Relations CRUD (NEW) ──────────────────────────────────

adminRoute.post('/service-relations', async (c) => {
  try {
    const actor = requireAdminActor(c);
    const parsed = CreateServiceRelationSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      const failure = errorResponse(400, {
        code: 'VALIDATION_ERROR',
        message: 'Datos invalidos',
        fields: parsed.error.flatten().fieldErrors
      });
      return c.json(failure.body, failure.status);
    }

    const pool = getPool();

    const insertResult = await pool.query(
      `INSERT INTO service_relations
         (source_service_id, target_service_id, relation_type, weight, prompt_label, active)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (source_service_id, target_service_id) DO UPDATE
       SET relation_type = EXCLUDED.relation_type,
           weight = EXCLUDED.weight,
           prompt_label = EXCLUDED.prompt_label,
           active = EXCLUDED.active
       RETURNING
         id::text AS id,
         source_service_id::text,
         target_service_id::text,
         relation_type,
         weight,
         prompt_label,
         active`,
      [
        parsed.data.source_service_id,
        parsed.data.target_service_id,
        parsed.data.relation_type,
        parsed.data.weight,
        parsed.data.prompt_label ?? null,
        parsed.data.active
      ]
    );

    await appendAdminEvent({
      eventType: 'service_relation_created',
      actorAccountId: actor.accountId,
      payload: {
        id: insertResult.rows[0].id,
        source_service_id: insertResult.rows[0].source_service_id,
        target_service_id: insertResult.rows[0].target_service_id,
        relation_type: insertResult.rows[0].relation_type
      }
    });

    return c.json({ ok: true, data: insertResult.rows[0] }, 201);
  } catch (error) {
    if (error instanceof ApiRequestError) {
      const failure = errorResponse(error.status, error.payload);
      return c.json(failure.body, failure.status);
    }
    const failure = errorResponse(500, {
      code: 'INTERNAL_ERROR',
      message: 'No fue posible crear la relacion.'
    });
    return c.json(failure.body, failure.status);
  }
});

adminRoute.patch('/service-relations/:id', async (c) => {
  try {
    const actor = requireAdminActor(c);
    const relationId = c.req.param('id');
    const parsed = PatchServiceRelationSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      const failure = errorResponse(400, {
        code: 'VALIDATION_ERROR',
        message: 'Datos invalidos',
        fields: parsed.error.flatten().fieldErrors
      });
      return c.json(failure.body, failure.status);
    }

    if (Object.keys(parsed.data).length === 0) {
      const failure = errorResponse(400, {
        code: 'VALIDATION_ERROR',
        message: 'No hay campos para actualizar.'
      });
      return c.json(failure.body, failure.status);
    }

    const pool = getPool();
    const updateResult = await pool.query(
      `UPDATE service_relations
       SET
         relation_type = COALESCE($1, relation_type),
         weight = COALESCE($2, weight),
         prompt_label = COALESCE($3, prompt_label),
         active = COALESCE($4, active)
       WHERE id::text = $5
       RETURNING
         id::text AS id,
         source_service_id::text,
         target_service_id::text,
         relation_type,
         weight,
         prompt_label,
         active`,
      [
        parsed.data.relation_type ?? null,
        parsed.data.weight ?? null,
        parsed.data.prompt_label ?? null,
        parsed.data.active ?? null,
        relationId
      ]
    );

    if (updateResult.rowCount === 0) {
      const failure = errorResponse(404, {
        code: 'NOT_FOUND',
        message: 'Relacion no encontrada.'
      });
      return c.json(failure.body, failure.status);
    }

    await appendAdminEvent({
      eventType: 'service_relation_updated',
      actorAccountId: actor.accountId,
      payload: { id: updateResult.rows[0].id }
    });

    return c.json({ ok: true, data: updateResult.rows[0] });
  } catch (error) {
    if (error instanceof ApiRequestError) {
      const failure = errorResponse(error.status, error.payload);
      return c.json(failure.body, failure.status);
    }
    const failure = errorResponse(500, {
      code: 'INTERNAL_ERROR',
      message: 'No fue posible actualizar la relacion.'
    });
    return c.json(failure.body, failure.status);
  }
});

adminRoute.delete('/service-relations/:id', async (c) => {
  try {
    const actor = requireAdminActor(c);
    const relationId = c.req.param('id');
    const pool = getPool();

    const result = await pool.query<{ id: string }>(
      `DELETE FROM service_relations
       WHERE id::text = $1
       RETURNING id::text AS id`,
      [relationId]
    );

    if (result.rowCount === 0) {
      const failure = errorResponse(404, {
        code: 'NOT_FOUND',
        message: 'Relacion no encontrada.'
      });
      return c.json(failure.body, failure.status);
    }

    await appendAdminEvent({
      eventType: 'service_relation_deleted',
      actorAccountId: actor.accountId,
      payload: { id: result.rows[0].id }
    });

    return c.json({ ok: true, data: { id: result.rows[0].id } });
  } catch (error) {
    if (error instanceof ApiRequestError) {
      const failure = errorResponse(error.status, error.payload);
      return c.json(failure.body, failure.status);
    }
    const failure = errorResponse(500, {
      code: 'INTERNAL_ERROR',
      message: 'No fue posible eliminar la relacion.'
    });
    return c.json(failure.body, failure.status);
  }
});

// ── Metrics (NEW) ─────────────────────────────────────────────────

adminRoute.get('/metrics', async (c) => {
  try {
    requireAdminActor(c);
    const pool = getPool();

    const [leadsByStatus, leadsByCity, providersActive, avgResponse] = await Promise.all([
      pool.query(
        `SELECT status, COUNT(*)::int AS count
         FROM leads
         GROUP BY status
         ORDER BY count DESC`
      ),
      pool.query(
        `SELECT loc.name AS city, loc.slug AS city_slug, COUNT(*)::int AS count
         FROM leads l
         JOIN locations loc ON loc.id = l.city_id
         GROUP BY loc.name, loc.slug
         ORDER BY count DESC`
      ),
      pool.query(
        `SELECT COUNT(*)::int AS active_providers FROM providers WHERE status = 'active'`
      ),
      pool.query(
        `SELECT
           COALESCE(
             AVG(EXTRACT(EPOCH FROM (lo.viewed_at - lo.assigned_at))),
             0
           )::numeric(10,1) AS avg_response_seconds
         FROM lead_opportunities lo
         WHERE lo.viewed_at IS NOT NULL`
      )
    ]);

    return c.json({
      ok: true,
      data: {
        leads_by_status: leadsByStatus.rows,
        leads_by_city: leadsByCity.rows,
        active_providers: providersActive.rows[0]?.active_providers ?? 0,
        avg_response_seconds: Number(avgResponse.rows[0]?.avg_response_seconds ?? 0)
      }
    });
  } catch (error) {
    if (error instanceof ApiRequestError) {
      const failure = errorResponse(error.status, error.payload);
      return c.json(failure.body, failure.status);
    }
    const failure = errorResponse(500, {
      code: 'INTERNAL_ERROR',
      message: 'No fue posible consultar metricas.'
    });
    return c.json(failure.body, failure.status);
  }
});
