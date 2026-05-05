import { Hono } from 'hono';
import { z } from 'zod';
import { ApiRequestError, errorResponse } from '../lib/api-errors';
import { getPool } from '../lib/db';
import { requireAdminActor } from '../lib/request-actor';

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
  eventType: 'review_moderated' | 'service_created' | 'service_updated';
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

adminRoute.get('/events', (c) => {
  try {
    requireAdminActor(c);
    return c.json({ ok: true, data: { source: 'db_admin_events' } });
  } catch (error) {
    if (error instanceof ApiRequestError) {
      const failure = errorResponse(error.status, error.payload);
      return c.json(failure.body, failure.status);
    }
    throw error;
  }
});
