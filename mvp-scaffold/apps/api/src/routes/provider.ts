import { Hono } from 'hono';
import { z } from 'zod';
import {
  getAllowedNextStatuses,
  isOpportunityStatus,
  validateOpportunityTransition
} from '../../../../packages/core/src/opportunity-state';
import { isBillableOpportunityStatus } from '../../../../packages/core/src/billing';
import { isProviderTemplateId, resolveProviderTemplate } from '../../../../packages/core/src/public-catalog';
import { ApiRequestError, errorResponse } from '../lib/api-errors';
import { getPool } from '../lib/db';
import {
  toProviderOpportunityDetail,
  toProviderOpportunitySummary
} from '../lib/dto';
import { requireProviderActor } from '../lib/request-actor';

export const providerRoute = new Hono();

const UpdateStatusSchema = z.object({
  status: z.string().min(2),
  note: z.string().max(2000).optional()
});

const UpdateProviderProfileSchema = z.object({
  display_name: z.string().min(2).max(120).optional(),
  description: z.string().max(4000).optional(),
  phone: z.string().max(80).optional(),
  whatsapp: z.string().max(80).optional(),
  website_url: z.string().url().max(300).optional(),
  logo_url: z.string().url().max(500).optional(),
  cover_url: z.string().url().max(500).optional(),
  template_id: z
    .string()
    .trim()
    .min(1)
    .max(80)
    .refine((value) => isProviderTemplateId(value), 'template_id no permitido')
    .optional()
});

const CreateQuoteSchema = z.object({
  amount: z.number().int().positive().max(500000000),
  currency: z.string().trim().min(3).max(3).default('COP'),
  estimated_delivery_time: z.string().max(120).optional(),
  message: z.string().max(2000).optional()
});

type ProviderIdRow = { id: string };
type ProviderProfileRow = {
  id: string;
  slug: string;
  display_name: string;
  description: string | null;
  phone: string | null;
  whatsapp: string | null;
  website_url: string | null;
  logo_url: string | null;
  cover_url: string | null;
  status: string;
  verified_at: string | null;
  service_slugs: string[] | null;
  template_id: string | null;
};
type ProviderLeadListRow = {
  opportunity_id: string;
  opportunity_status: string;
  valid_for_billing: boolean;
  lead_price: number;
  assigned_at: string;
  lead_public_code: string;
  service_slug: string;
};
type ProviderMetricsRow = {
  total: string | number;
  new_count: string | number;
  contacted_count: string | number;
  quoted_count: string | number;
  closed_count: string | number;
};

type ProviderOpportunityStatusRow = {
  status: string;
  lead_id: string;
};

type QuoteCreatedRow = {
  id: string;
  opportunity_id: string;
  amount: number;
  currency: string;
  estimated_delivery_time: string | null;
  message: string | null;
  status: string;
  created_at: string;
};
type ProviderLeadDetailRow = {
  opportunity_id: string;
  opportunity_status: string;
  valid_for_billing: boolean;
  lead_price: number;
  assigned_at: string;
  lead_public_code: string;
  lead_description: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  city_slug: string;
  service_slug: string;
};

async function resolveProviderIdFromAccount(accountId: string): Promise<string> {
  const pool = getPool();
  const result = await pool.query<ProviderIdRow>(
    `SELECT id
     FROM providers
     WHERE account_id = $1
     LIMIT 1`,
    [accountId]
  );

  if (result.rowCount === 0) {
    throw new ApiRequestError(403, {
      code: 'FORBIDDEN',
      message: 'La cuenta autenticada no tiene perfil provider asociado.'
    });
  }
  return result.rows[0].id;
}

function cleanOptionalText(value: string | undefined): string | null {
  if (value === undefined) return null;
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

function resolveProviderTemplateId(profile: Pick<ProviderProfileRow, 'slug' | 'template_id'>): string {
  if (profile.template_id && isProviderTemplateId(profile.template_id)) {
    return profile.template_id;
  }
  return resolveProviderTemplate(profile.slug).id;
}

async function fetchProviderProfileByAccount(accountId: string): Promise<ProviderProfileRow> {
  const pool = getPool();
  const result = await pool.query<ProviderProfileRow>(
    `SELECT
       p.id,
       p.slug,
       p.display_name,
       p.description,
       p.phone,
       p.whatsapp,
       p.website_url,
       p.logo_url,
       p.cover_url,
       p.template_id,
       p.status,
       p.verified_at::text,
       COALESCE(
         ARRAY_AGG(DISTINCT s.slug) FILTER (WHERE ps.active = true AND s.slug IS NOT NULL),
         '{}'
       ) AS service_slugs
     FROM providers p
     LEFT JOIN provider_services ps ON ps.provider_id = p.id
     LEFT JOIN services s ON s.id = ps.service_id
     WHERE p.account_id = $1
     GROUP BY p.id
     LIMIT 1`,
    [accountId]
  );

  if (result.rowCount === 0) {
    throw new ApiRequestError(403, {
      code: 'FORBIDDEN',
      message: 'La cuenta autenticada no tiene perfil provider asociado.'
    });
  }

  return result.rows[0];
}

providerRoute.get('/me', async (c) => {
  try {
    const actor = requireProviderActor(c);
    const profile = await fetchProviderProfileByAccount(actor.accountId);
    return c.json({
      ok: true,
      data: {
        id: profile.id,
        slug: profile.slug,
        display_name: profile.display_name,
        description: profile.description,
        phone: profile.phone,
        whatsapp: profile.whatsapp,
        website_url: profile.website_url,
        logo_url: profile.logo_url,
        cover_url: profile.cover_url,
        template_id: resolveProviderTemplateId(profile),
        status: profile.status,
        verified_at: profile.verified_at,
        services: profile.service_slugs ?? []
      }
    });
  } catch (error) {
    if (error instanceof ApiRequestError) {
      const failure = errorResponse(error.status, error.payload);
      return c.json(failure.body, failure.status);
    }

    console.error('providerRoute.get(/me) failed', error);
    const failure = errorResponse(500, {
      code: 'INTERNAL_ERROR',
      message: 'No fue posible consultar el perfil del provider.'
    });
    return c.json(failure.body, failure.status);
  }
});

providerRoute.patch('/me', async (c) => {
  try {
    const actor = requireProviderActor(c);
    const parsed = UpdateProviderProfileSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      const failure = errorResponse(400, {
        code: 'VALIDATION_ERROR',
        message: 'Datos invalidos',
        fields: parsed.error.flatten().fieldErrors
      });
      return c.json(failure.body, failure.status);
    }

    const updates = parsed.data;
    if (Object.keys(updates).length === 0) {
      const failure = errorResponse(400, {
        code: 'VALIDATION_ERROR',
        message: 'No se enviaron campos para actualizar.',
        fields: {
          body: 'Debes enviar al menos un campo editable.'
        }
      });
      return c.json(failure.body, failure.status);
    }

    const pool = getPool();
    const updateResult = await pool.query(
      `UPDATE providers
       SET display_name = COALESCE($1, display_name),
           description = COALESCE($2, description),
           phone = COALESCE($3, phone),
           whatsapp = COALESCE($4, whatsapp),
           website_url = COALESCE($5, website_url),
           logo_url = COALESCE($6, logo_url),
           cover_url = COALESCE($7, cover_url),
           template_id = COALESCE($8, template_id),
           updated_at = now()
       WHERE account_id = $9`,
      [
        cleanOptionalText(updates.display_name),
        cleanOptionalText(updates.description),
        cleanOptionalText(updates.phone),
        cleanOptionalText(updates.whatsapp),
        cleanOptionalText(updates.website_url),
        cleanOptionalText(updates.logo_url),
        cleanOptionalText(updates.cover_url),
        cleanOptionalText(updates.template_id),
        actor.accountId
      ]
    );

    if (updateResult.rowCount === 0) {
      const failure = errorResponse(403, {
        code: 'FORBIDDEN',
        message: 'La cuenta autenticada no tiene perfil provider asociado.'
      });
      return c.json(failure.body, failure.status);
    }

    const profile = await fetchProviderProfileByAccount(actor.accountId);
    return c.json({
      ok: true,
      data: {
        id: profile.id,
        slug: profile.slug,
        display_name: profile.display_name,
        description: profile.description,
        phone: profile.phone,
        whatsapp: profile.whatsapp,
        website_url: profile.website_url,
        logo_url: profile.logo_url,
        cover_url: profile.cover_url,
        template_id: resolveProviderTemplateId(profile),
        status: profile.status,
        verified_at: profile.verified_at,
        services: profile.service_slugs ?? []
      }
    });
  } catch (error) {
    if (error instanceof ApiRequestError) {
      const failure = errorResponse(error.status, error.payload);
      return c.json(failure.body, failure.status);
    }

    console.error('providerRoute.patch(/me) failed', error);
    const failure = errorResponse(500, {
      code: 'INTERNAL_ERROR',
      message: 'No fue posible actualizar el perfil del provider.'
    });
    return c.json(failure.body, failure.status);
  }
});

providerRoute.get('/leads', async (c) => {
  try {
    const actor = requireProviderActor(c);
    const providerId = await resolveProviderIdFromAccount(actor.accountId);
    const pool = getPool();

    const result = await pool.query<ProviderLeadListRow>(
      `SELECT
         lo.id AS opportunity_id,
         lo.status AS opportunity_status,
         lo.valid_for_billing,
         lo.lead_price,
         lo.assigned_at::text,
         l.public_code AS lead_public_code,
         s.slug AS service_slug
       FROM lead_opportunities lo
       JOIN leads l ON l.id = lo.lead_id
       JOIN services s ON s.id = lo.service_id
       WHERE lo.provider_id = $1
       ORDER BY lo.assigned_at DESC
       LIMIT 100`,
      [providerId]
    );

    return c.json({
      ok: true,
      data: result.rows.map(toProviderOpportunitySummary)
    });
  } catch (error) {
    if (error instanceof ApiRequestError) {
      const failure = errorResponse(error.status, error.payload);
      return c.json(failure.body, failure.status);
    }

    console.error('providerRoute.get(/leads) failed', error);
    const failure = errorResponse(500, {
      code: 'INTERNAL_ERROR',
      message: 'No fue posible consultar oportunidades.'
    });
    return c.json(failure.body, failure.status);
  }
});

providerRoute.post('/leads/:opportunityId/quote', async (c) => {
  try {
    const actor = requireProviderActor(c);
    const providerId = await resolveProviderIdFromAccount(actor.accountId);
    const opportunityId = c.req.param('opportunityId');
    const parsed = CreateQuoteSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      const failure = errorResponse(400, {
        code: 'VALIDATION_ERROR',
        message: 'Datos invalidos',
        fields: parsed.error.flatten().fieldErrors
      });
      return c.json(failure.body, failure.status);
    }

    const pool = getPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');
      const currentResult = await client.query<ProviderOpportunityStatusRow>(
        `SELECT status, lead_id
         FROM lead_opportunities
         WHERE id = $1
           AND provider_id = $2
         LIMIT 1`,
        [opportunityId, providerId]
      );

      if (currentResult.rowCount === 0) {
        await client.query('ROLLBACK');
        const failure = errorResponse(404, {
          code: 'NOT_FOUND',
          message: 'Oportunidad no encontrada para este provider.'
        });
        return c.json(failure.body, failure.status);
      }

      const currentStatusRaw = currentResult.rows[0].status;
      if (!isOpportunityStatus(currentStatusRaw)) {
        await client.query('ROLLBACK');
        throw new ApiRequestError(500, {
          code: 'INTERNAL_ERROR',
          message: 'Estado actual de oportunidad invalido en base de datos.'
        });
      }

      const transition = validateOpportunityTransition(currentStatusRaw, 'quoted', 'provider');
      if (!transition.ok) {
        await client.query('ROLLBACK');
        const failure = errorResponse(400, {
          code: 'INVALID_TRANSITION',
          message: transition.reason,
          fields: {
            current_status: currentStatusRaw,
            next_status: 'quoted'
          }
        });
        return c.json(failure.body, failure.status);
      }

      const quoteCreated = await client.query<QuoteCreatedRow>(
        `INSERT INTO quotes (
           opportunity_id,
           amount,
           currency,
           estimated_delivery_time,
           message,
           status
         )
         VALUES ($1, $2, $3, $4, $5, 'sent')
         RETURNING
           id,
           opportunity_id,
           amount,
           currency,
           estimated_delivery_time,
           message,
           status,
           created_at::text`,
        [
          opportunityId,
          parsed.data.amount,
          parsed.data.currency.toUpperCase(),
          cleanOptionalText(parsed.data.estimated_delivery_time),
          cleanOptionalText(parsed.data.message)
        ]
      );

      const shouldMarkBillable = isBillableOpportunityStatus('quoted');
      await client.query(
        `UPDATE lead_opportunities
         SET status = 'quoted',
             valid_for_billing = CASE WHEN $2 THEN true ELSE valid_for_billing END
         WHERE id = $1`,
        [opportunityId, shouldMarkBillable]
      );

      await client.query(
        `INSERT INTO lead_events (lead_id, opportunity_id, actor_type, actor_id, event_type, payload)
         VALUES ($1, $2, 'provider', $3::uuid, 'quote_submitted', $4::jsonb)`,
        [
          currentResult.rows[0].lead_id,
          opportunityId,
          actor.accountId,
          JSON.stringify({
            quote_id: quoteCreated.rows[0].id,
            amount: quoteCreated.rows[0].amount,
            currency: quoteCreated.rows[0].currency,
            estimated_delivery_time: quoteCreated.rows[0].estimated_delivery_time
          })
        ]
      );

      await client.query('COMMIT');
      return c.json(
        {
          ok: true,
          data: {
            quote_id: quoteCreated.rows[0].id,
            opportunity_id: quoteCreated.rows[0].opportunity_id,
            status: 'quoted',
            amount: quoteCreated.rows[0].amount,
            currency: quoteCreated.rows[0].currency,
            estimated_delivery_time: quoteCreated.rows[0].estimated_delivery_time,
            message: quoteCreated.rows[0].message,
            quote_status: quoteCreated.rows[0].status,
            created_at: quoteCreated.rows[0].created_at
          }
        },
        201
      );
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    if (error instanceof ApiRequestError) {
      const failure = errorResponse(error.status, error.payload);
      return c.json(failure.body, failure.status);
    }

    console.error('providerRoute.post(/leads/:opportunityId/quote) failed', error);
    const failure = errorResponse(500, {
      code: 'INTERNAL_ERROR',
      message: 'No fue posible registrar la cotizacion.'
    });
    return c.json(failure.body, failure.status);
  }
});

providerRoute.get('/metrics', async (c) => {
  try {
    const actor = requireProviderActor(c);
    const providerId = await resolveProviderIdFromAccount(actor.accountId);
    const pool = getPool();

    const result = await pool.query<ProviderMetricsRow>(
      `SELECT
         COUNT(*)::int AS total,
         SUM(CASE WHEN lo.status IN ('new', 'viewed') THEN 1 ELSE 0 END)::int AS new_count,
         SUM(CASE WHEN lo.status = 'contacted' THEN 1 ELSE 0 END)::int AS contacted_count,
         SUM(CASE WHEN lo.status = 'quoted' THEN 1 ELSE 0 END)::int AS quoted_count,
         SUM(CASE WHEN lo.status IN ('won', 'lost', 'rejected', 'invalid') THEN 1 ELSE 0 END)::int AS closed_count
       FROM lead_opportunities lo
       WHERE lo.provider_id = $1`,
      [providerId]
    );

    const row = result.rows[0] ?? {
      total: 0,
      new_count: 0,
      contacted_count: 0,
      quoted_count: 0,
      closed_count: 0
    };

    return c.json({
      ok: true,
      data: {
        total: Number(row.total ?? 0),
        new: Number(row.new_count ?? 0),
        contacted: Number(row.contacted_count ?? 0),
        quoted: Number(row.quoted_count ?? 0),
        closed: Number(row.closed_count ?? 0)
      }
    });
  } catch (error) {
    if (error instanceof ApiRequestError) {
      const failure = errorResponse(error.status, error.payload);
      return c.json(failure.body, failure.status);
    }

    console.error('providerRoute.get(/metrics) failed', error);
    const failure = errorResponse(500, {
      code: 'INTERNAL_ERROR',
      message: 'No fue posible calcular metricas del provider.'
    });
    return c.json(failure.body, failure.status);
  }
});

providerRoute.get('/leads/:opportunityId', async (c) => {
  try {
    const actor = requireProviderActor(c);
    const providerId = await resolveProviderIdFromAccount(actor.accountId);
    const opportunityId = c.req.param('opportunityId');
    const pool = getPool();

    const result = await pool.query<ProviderLeadDetailRow>(
      `SELECT
         lo.id AS opportunity_id,
         lo.status AS opportunity_status,
         lo.valid_for_billing,
         lo.lead_price,
         lo.assigned_at::text,
         l.public_code AS lead_public_code,
         l.description AS lead_description,
         l.client_name,
         l.client_email,
         l.client_phone,
         city.slug AS city_slug,
         s.slug AS service_slug
       FROM lead_opportunities lo
       JOIN leads l ON l.id = lo.lead_id
       JOIN locations city ON city.id = l.city_id
       JOIN services s ON s.id = lo.service_id
       WHERE lo.id = $1
         AND lo.provider_id = $2
       LIMIT 1`,
      [opportunityId, providerId]
    );

    if (result.rowCount === 0) {
      const failure = errorResponse(404, {
        code: 'NOT_FOUND',
        message: 'Oportunidad no encontrada para este provider.'
      });
      return c.json(failure.body, failure.status);
    }

    const row = result.rows[0];
    if (!isOpportunityStatus(row.opportunity_status)) {
      throw new ApiRequestError(500, {
        code: 'INTERNAL_ERROR',
        message: 'Estado actual de oportunidad invalido en base de datos.'
      });
    }

    return c.json({
      ok: true,
      data: {
        ...toProviderOpportunityDetail(row),
        allowed_next_statuses: getAllowedNextStatuses(row.opportunity_status, 'provider')
      }
    });
  } catch (error) {
    if (error instanceof ApiRequestError) {
      const failure = errorResponse(error.status, error.payload);
      return c.json(failure.body, failure.status);
    }

    console.error('providerRoute.get(/leads/:opportunityId) failed', error);
    const failure = errorResponse(500, {
      code: 'INTERNAL_ERROR',
      message: 'No fue posible consultar el detalle de oportunidad.'
    });
    return c.json(failure.body, failure.status);
  }
});

providerRoute.post('/leads/:opportunityId/status', async (c) => {
  try {
    const actor = requireProviderActor(c);
    const providerId = await resolveProviderIdFromAccount(actor.accountId);
    const opportunityId = c.req.param('opportunityId');
    const parsed = UpdateStatusSchema.safeParse(await c.req.json());

    if (!parsed.success) {
      const failure = errorResponse(400, {
        code: 'VALIDATION_ERROR',
        message: 'Datos invalidos',
        fields: parsed.error.flatten().fieldErrors
      });
      return c.json(failure.body, failure.status);
    }

    const nextStatusRaw = parsed.data.status.trim().toLowerCase();
    if (!isOpportunityStatus(nextStatusRaw)) {
      const failure = errorResponse(400, {
        code: 'VALIDATION_ERROR',
        message: 'status no permitido',
        fields: { status: parsed.data.status }
      });
      return c.json(failure.body, failure.status);
    }

    const pool = getPool();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const currentResult = await client.query<{ status: string; lead_id: string }>(
        `SELECT status, lead_id
         FROM lead_opportunities
         WHERE id = $1
           AND provider_id = $2
         LIMIT 1`,
        [opportunityId, providerId]
      );

      if (currentResult.rowCount === 0) {
        await client.query('ROLLBACK');
        const failure = errorResponse(404, {
          code: 'NOT_FOUND',
          message: 'Oportunidad no encontrada para este provider.'
        });
        return c.json(failure.body, failure.status);
      }

      const currentStatusRaw = currentResult.rows[0].status;
      if (!isOpportunityStatus(currentStatusRaw)) {
        await client.query('ROLLBACK');
        throw new ApiRequestError(500, {
          code: 'INTERNAL_ERROR',
          message: 'Estado actual de oportunidad invalido en base de datos.'
        });
      }

      const transition = validateOpportunityTransition(currentStatusRaw, nextStatusRaw, 'provider');
      if (!transition.ok) {
        await client.query('ROLLBACK');
        const failure = errorResponse(400, {
          code: 'INVALID_TRANSITION',
          message: transition.reason,
          fields: {
            current_status: currentStatusRaw,
            next_status: nextStatusRaw
          }
        });
        return c.json(failure.body, failure.status);
      }

      const shouldMarkBillable = isBillableOpportunityStatus(nextStatusRaw);

      await client.query(
        `UPDATE lead_opportunities
         SET status = $1,
             valid_for_billing = CASE WHEN $3 THEN true ELSE valid_for_billing END,
             viewed_at = CASE WHEN $1 = 'viewed' AND viewed_at IS NULL THEN now() ELSE viewed_at END,
             closed_at = CASE WHEN $1 IN ('won', 'lost', 'rejected', 'invalid') THEN now() ELSE closed_at END
         WHERE id = $2`,
        [nextStatusRaw, opportunityId, shouldMarkBillable]
      );

      await client.query(
        `INSERT INTO lead_events (lead_id, opportunity_id, actor_type, actor_id, event_type, payload)
         VALUES ($1, $2, 'provider', $3::uuid, 'opportunity_status_changed', $4::jsonb)`,
        [
          currentResult.rows[0].lead_id,
          opportunityId,
          actor.accountId,
          JSON.stringify({
            previous_status: currentStatusRaw,
            next_status: nextStatusRaw,
            note: parsed.data.note ?? null
          })
        ]
      );

      await client.query('COMMIT');
      return c.json({
        ok: true,
        data: {
          opportunity_id: opportunityId,
          status: nextStatusRaw
        }
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    if (error instanceof ApiRequestError) {
      const failure = errorResponse(error.status, error.payload);
      return c.json(failure.body, failure.status);
    }

    console.error('providerRoute.post(/leads/:opportunityId/status) failed', error);
    const failure = errorResponse(500, {
      code: 'INTERNAL_ERROR',
      message: 'No fue posible actualizar el estado de oportunidad.'
    });
    return c.json(failure.body, failure.status);
  }
});
