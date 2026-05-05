import { Hono } from 'hono';
import { z } from 'zod';
import { getRelatedServices } from '../../../../packages/core/src/lead-routing';
import { errorResponse } from '../lib/api-errors';
import { resolveServiceRelations } from '../lib/service-relations';

export const servicesRoute = new Hono();

const LimitSchema = z.coerce.number().int().min(1).max(20).optional().default(8);

servicesRoute.get('/:slug/related', async (c) => {
  const slug = c.req.param('slug').trim().toLowerCase();

  if (!slug) {
    const failure = errorResponse(400, {
      code: 'VALIDATION_ERROR',
      message: 'slug es requerido',
      fields: { slug: ['slug es requerido'] }
    });
    return c.json(failure.body, failure.status);
  }

  const parsedLimit = LimitSchema.safeParse(c.req.query('limit'));
  if (!parsedLimit.success) {
    const failure = errorResponse(400, {
      code: 'VALIDATION_ERROR',
      message: 'limit invalido',
      fields: { limit: parsedLimit.error.issues.map((issue) => issue.message) }
    });
    return c.json(failure.body, failure.status);
  }

  const relations = await resolveServiceRelations(slug);
  const relatedServiceSlugs = getRelatedServices(slug, relations).slice(0, parsedLimit.data);

  return c.json({
    ok: true,
    data: {
      source_service_slug: slug,
      related_service_slugs: relatedServiceSlugs
    }
  });
});
