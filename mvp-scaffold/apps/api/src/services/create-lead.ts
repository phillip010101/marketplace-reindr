import { randomUUID } from 'node:crypto';
import { calculateLeadPrice } from '../../../../packages/core/src/pricing';
import {
  findInvalidSlugValues,
  normalizeSlugList
} from '../../../../packages/core/src/lead-payload';
import type pg from 'pg';
import { getPool } from '../lib/db';
import { ApiRequestError } from '../lib/api-errors';

type CreateLeadInput = {
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  citySlug: string;
  primaryServiceSlug: string;
  requestedServiceSlugs: string[];
  description: string;
  budgetRange?: string;
  urgency?: string;
};

type CreateLeadOutput = {
  leadPublicCode: string;
  requestedServiceSlugs: string[];
  opportunitiesCount: number;
};

type IdRow = { id: string };
type ServiceRow = { id: string; slug: string; base_lead_price: number };
type MatchRow = { provider_id: string; service_id: string; base_lead_price: number };

const DUPLICATE_WINDOW_DAYS = Number(process.env.LEAD_DUPLICATE_WINDOW_DAYS ?? 30);
const LEAD_SOURCE = 'web_form';

function buildLeadPublicCode(): string {
  const timestamp = new Date().toISOString().replace(/\D/g, '').slice(0, 14);
  return `LD-${timestamp}-${randomUUID().slice(0, 6).toUpperCase()}`;
}

function assertSlugFormat(slugs: string[]): void {
  const invalid = findInvalidSlugValues(slugs);
  if (invalid.length > 0) {
    throw new ApiRequestError(400, {
      code: 'VALIDATION_ERROR',
      message: 'requested_service_slugs contiene valores invalidos',
      fields: { requested_service_slugs: invalid }
    });
  }
}

async function findCityId(client: pg.PoolClient, citySlug: string): Promise<string> {
  const result = await client.query<IdRow>(
    `SELECT id
     FROM locations
     WHERE slug = $1 AND type IN ('city', 'zone')
     LIMIT 1`,
    [citySlug]
  );
  if (result.rowCount === 0) {
    throw new ApiRequestError(400, {
      code: 'VALIDATION_ERROR',
      message: 'city_slug no existe',
      fields: { city_slug: citySlug }
    });
  }
  return result.rows[0].id;
}

async function findPrimaryService(client: pg.PoolClient, primaryServiceSlug: string): Promise<ServiceRow> {
  const result = await client.query<ServiceRow>(
    `SELECT id, slug, base_lead_price
     FROM services
     WHERE slug = $1 AND status = 'active'
     LIMIT 1`,
    [primaryServiceSlug]
  );
  if (result.rowCount === 0) {
    throw new ApiRequestError(400, {
      code: 'VALIDATION_ERROR',
      message: 'primary_service_slug no existe',
      fields: { primary_service_slug: primaryServiceSlug }
    });
  }
  return result.rows[0];
}

async function resolveRequestedServices(
  client: pg.PoolClient,
  requestedServiceSlugs: string[],
  primaryService: ServiceRow
): Promise<ServiceRow[]> {
  const normalized = normalizeSlugList([primaryService.slug, ...requestedServiceSlugs]);
  assertSlugFormat(normalized);

  const result = await client.query<ServiceRow>(
    `SELECT id, slug, base_lead_price
     FROM services
     WHERE slug = ANY($1::text[]) AND status = 'active'`,
    [normalized]
  );

  const foundBySlug = new Set(result.rows.map((row) => row.slug));
  const missing = normalized.filter((slug) => !foundBySlug.has(slug));
  if (missing.length > 0) {
    throw new ApiRequestError(400, {
      code: 'VALIDATION_ERROR',
      message: 'Hay requested_service_slugs inexistentes o inactivos',
      fields: { requested_service_slugs: missing }
    });
  }

  return result.rows;
}

async function ensureNotDuplicateLead(
  client: pg.PoolClient,
  input: CreateLeadInput,
  cityId: string,
  primaryServiceId: string
): Promise<void> {
  const duplicate = await client.query(
    `SELECT id
     FROM leads
     WHERE city_id = $1
       AND primary_service_id = $2
       AND (client_email = $3 OR client_phone = $4)
       AND created_at >= (now() - ($5::int * interval '1 day'))
     LIMIT 1`,
    [cityId, primaryServiceId, input.clientEmail, input.clientPhone, DUPLICATE_WINDOW_DAYS]
  );

  if (duplicate.rowCount && duplicate.rowCount > 0) {
    throw new ApiRequestError(400, {
      code: 'INVALID_LEAD',
      message: 'Lead duplicado en ventana activa'
    });
  }
}

async function findOpportunityMatches(
  client: pg.PoolClient,
  input: CreateLeadInput,
  cityId: string,
  requestedServiceIds: string[]
): Promise<MatchRow[]> {
  const result = await client.query<MatchRow>(
    `SELECT DISTINCT ps.provider_id, ps.service_id, s.base_lead_price
     FROM provider_services ps
     JOIN providers p ON p.id = ps.provider_id
     JOIN services s ON s.id = ps.service_id
     WHERE ps.active = true
       AND p.status = 'active'
       AND ps.location_id = $1
       AND ps.service_id = ANY($2::uuid[])
       AND NOT EXISTS (
         SELECT 1
         FROM lead_opportunities lo2
         JOIN leads l2 ON l2.id = lo2.lead_id
         WHERE lo2.provider_id = ps.provider_id
           AND lo2.service_id = ps.service_id
           AND l2.city_id = $1
           AND (l2.client_email = $3 OR l2.client_phone = $4)
           AND l2.created_at >= (now() - ($5::int * interval '1 day'))
       )`,
    [cityId, requestedServiceIds, input.clientEmail, input.clientPhone, DUPLICATE_WINDOW_DAYS]
  );
  return result.rows;
}

export async function createLeadTransactional(input: CreateLeadInput): Promise<CreateLeadOutput> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const cityId = await findCityId(client, input.citySlug);
    const primaryService = await findPrimaryService(client, input.primaryServiceSlug);
    const requestedServices = await resolveRequestedServices(client, input.requestedServiceSlugs, primaryService);
    await ensureNotDuplicateLead(client, input, cityId, primaryService.id);

    const leadPublicCode = buildLeadPublicCode();
    const leadInsert = await client.query<IdRow>(
      `INSERT INTO leads (
         public_code, client_name, client_email, client_phone,
         city_id, primary_service_id, description, budget_range, urgency, source
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING id`,
      [
        leadPublicCode,
        input.clientName,
        input.clientEmail,
        input.clientPhone,
        cityId,
        primaryService.id,
        input.description,
        input.budgetRange ?? null,
        input.urgency ?? null,
        LEAD_SOURCE
      ]
    );
    const leadId = leadInsert.rows[0].id;

    for (const service of requestedServices) {
      await client.query(
        `INSERT INTO lead_requested_services (lead_id, service_id, is_primary)
         VALUES ($1, $2, $3)`,
        [leadId, service.id, service.id === primaryService.id]
      );
    }

    const matches = await findOpportunityMatches(
      client,
      input,
      cityId,
      requestedServices.map((service) => service.id)
    );

    await client.query(
      `INSERT INTO lead_events (lead_id, actor_type, event_type, payload)
       VALUES ($1, 'client', 'lead_created', $2::jsonb)`,
      [leadId, JSON.stringify({ requested_service_slugs: requestedServices.map((service) => service.slug) })]
    );

    for (const match of matches) {
      const leadPrice = calculateLeadPrice({
        basePrice: Number(match.base_lead_price),
        requestedServicesCount: requestedServices.length,
        hasBudget: Boolean(input.budgetRange),
        urgency: input.urgency
      });

      const opportunityInsert = await client.query<IdRow>(
        `INSERT INTO lead_opportunities (
           lead_id, provider_id, service_id, status, valid_for_billing, lead_price
         ) VALUES ($1, $2, $3, 'new', false, $4)
         RETURNING id`,
        [leadId, match.provider_id, match.service_id, leadPrice]
      );

      await client.query(
        `INSERT INTO lead_events (lead_id, opportunity_id, actor_type, event_type, payload)
         VALUES ($1, $2, 'system', 'opportunity_created', $3::jsonb)`,
        [
          leadId,
          opportunityInsert.rows[0].id,
          JSON.stringify({
            provider_id: match.provider_id,
            service_id: match.service_id,
            lead_price: leadPrice
          })
        ]
      );
    }

    await client.query('COMMIT');

    return {
      leadPublicCode,
      requestedServiceSlugs: requestedServices.map((service) => service.slug),
      opportunitiesCount: matches.length
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
