import { Hono } from 'hono';
import { z } from 'zod';
import {
  findInvalidSlugValues,
  resolveCanonicalRequestedServiceSlugs
} from '../../../../packages/core/src/lead-payload';
import { validateLeadInput } from '../../../../packages/core/src/lead-routing';
import { ApiRequestError, errorResponse } from '../lib/api-errors';
import { toLeadCreatedPublicResponse } from '../lib/dto';
import { consumeLeadSubmitRateLimit, extractClientAddress } from '../lib/rate-limit';
import { createLeadTransactional } from '../services/create-lead';

export const leadsRoute = new Hono();

const SlugListSchema = z.preprocess((value) => {
  if (value === undefined || value === null || value === '') return [];
  if (Array.isArray(value)) return value;
  return [value];
}, z.array(z.string().min(1)));

const LeadSchema = z.object({
  client_name: z.string().min(2),
  client_email: z.string().email(),
  client_phone: z.string().min(6),
  city_slug: z.string().min(2),
  primary_service_slug: z.string().min(2),
  requested_service_slugs: SlugListSchema.optional().default([]),
  // Backward compatibility: old frontend field; read-only alias during transition window.
  related_services: SlugListSchema.optional().default([]),
  description: z.string().min(10),
  budget_range: z.string().optional(),
  urgency: z.string().optional(),
  consent: z.coerce.boolean()
});

function formDataToObject(formData: FormData): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, rawValue] of formData.entries()) {
    const value = typeof rawValue === 'string' ? rawValue : rawValue.name;
    const previous = result[key];

    if (previous === undefined) {
      result[key] = value;
      continue;
    }

    if (Array.isArray(previous)) {
      previous.push(value);
      continue;
    }

    result[key] = [previous, value];
  }

  return result;
}

leadsRoute.post('/', async (c) => {
  const clientAddress = extractClientAddress(c.req.raw.headers);
  const rateLimit = consumeLeadSubmitRateLimit(clientAddress);
  if (!rateLimit.allowed) {
    c.header('Retry-After', String(rateLimit.retryAfterSeconds));
    const failure = errorResponse(429, {
      code: 'RATE_LIMITED',
      message: 'Demasiadas solicitudes. Intenta nuevamente en unos segundos.'
    });
    return c.json(failure.body, failure.status);
  }

  const contentType = c.req.header('content-type') ?? '';
  const body = contentType.includes('application/json')
    ? await c.req.json()
    : formDataToObject(await c.req.formData());

  const parsed = LeadSchema.safeParse(body);

  if (!parsed.success) {
    const failure = errorResponse(400, {
      code: 'VALIDATION_ERROR',
      message: 'Datos invalidos',
      fields: parsed.error.flatten().fieldErrors
    });
    return c.json(failure.body, failure.status);
  }

  // Canonical field wins when both are present.
  const requestedServiceSlugs = resolveCanonicalRequestedServiceSlugs({
    requested_service_slugs: parsed.data.requested_service_slugs,
    related_services: parsed.data.related_services
  });

  const invalidSlugs = findInvalidSlugValues(requestedServiceSlugs);
  if (invalidSlugs.length > 0) {
    const failure = errorResponse(400, {
      code: 'VALIDATION_ERROR',
      message: 'requested_service_slugs contiene valores invalidos',
      fields: { requested_service_slugs: invalidSlugs }
    });
    return c.json(failure.body, failure.status);
  }

  if (parsed.data.related_services.length > 0 && parsed.data.requested_service_slugs.length === 0) {
    console.warn('[deprecation] related_services is deprecated; use requested_service_slugs');
  }

  const validation = validateLeadInput(parsed.data);
  if (!validation.ok) {
    const failure = errorResponse(400, {
      code: 'INVALID_LEAD',
      message: validation.reason
    });
    return c.json(failure.body, failure.status);
  }

  try {
    const created = await createLeadTransactional({
      clientName: parsed.data.client_name,
      clientEmail: parsed.data.client_email,
      clientPhone: parsed.data.client_phone,
      citySlug: parsed.data.city_slug,
      primaryServiceSlug: parsed.data.primary_service_slug,
      requestedServiceSlugs,
      description: parsed.data.description,
      budgetRange: parsed.data.budget_range,
      urgency: parsed.data.urgency
    });

    return c.json({
      ok: true,
      data: toLeadCreatedPublicResponse({
        lead_public_code: created.leadPublicCode,
        requested_service_slugs: created.requestedServiceSlugs,
        opportunities_count: created.opportunitiesCount,
        message: 'Solicitud recibida. Enviaremos tu solicitud a proveedores relacionados.'
      })
    });
  } catch (error) {
    if (error instanceof ApiRequestError) {
      const failure = errorResponse(error.status, error.payload);
      return c.json(failure.body, failure.status);
    }

    console.error('createLeadTransactional failed', error);
    const failure = errorResponse(500, {
      code: 'INTERNAL_ERROR',
      message: 'No fue posible procesar la solicitud en este momento.'
    });
    return c.json(failure.body, failure.status);
  }
});

leadsRoute.get('/:id', async (c) => {
  return c.json({
    ok: true,
    data: {
      id: c.req.param('id'),
      status: 'new'
    }
  });
});
