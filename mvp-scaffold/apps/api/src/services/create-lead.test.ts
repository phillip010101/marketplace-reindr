import test from 'node:test';
import assert from 'node:assert/strict';
import type { Pool } from 'pg';
import { setPoolForTests } from '../lib/db';
import { createLeadTransactional } from './create-lead';

type QueryResult<Row> = {
  rowCount: number;
  rows: Row[];
};

type QueryCall = {
  sql: string;
  params: unknown[];
};

type QueryHandler = (sql: string, params: unknown[], calls: QueryCall[]) => Promise<QueryResult<Record<string, unknown>>>;

function createMockPoolWithClient(queryHandler: QueryHandler): Pool {
  const calls: QueryCall[] = [];
  const client = {
    async query(sql: string, params: unknown[] = []) {
      calls.push({ sql, params });
      return queryHandler(sql, params, calls);
    },
    release() {}
  };

  const pool = {
    async connect() {
      return client;
    }
  };

  return pool as unknown as Pool;
}

test.afterEach(() => {
  setPoolForTests(null);
});

test('IT-leads-create: createLeadTransactional creates lead and opportunities with canonical services', async () => {
  const mockPool = createMockPoolWithClient(async (sql) => {
    if (sql === 'BEGIN' || sql === 'COMMIT' || sql === 'ROLLBACK') {
      return { rowCount: 0, rows: [] };
    }
    if (sql.includes('FROM locations')) {
      return { rowCount: 1, rows: [{ id: 'city-1' }] };
    }
    if (sql.includes('FROM services') && sql.includes('slug = $1')) {
      return {
        rowCount: 1,
        rows: [{ id: 'svc-primary', slug: 'cajas-personalizadas', base_lead_price: 50000 }]
      };
    }
    if (sql.includes('FROM services') && sql.includes('slug = ANY')) {
      return {
        rowCount: 2,
        rows: [
          { id: 'svc-primary', slug: 'cajas-personalizadas', base_lead_price: 50000 },
          { id: 'svc-related', slug: 'impresion', base_lead_price: 30000 }
        ]
      };
    }
    if (sql.includes('FROM leads') && sql.includes('created_at >=')) {
      return { rowCount: 0, rows: [] };
    }
    if (sql.includes('INSERT INTO leads')) {
      return { rowCount: 1, rows: [{ id: 'lead-1' }] };
    }
    if (sql.includes('SELECT DISTINCT ps.provider_id')) {
      return {
        rowCount: 1,
        rows: [{ provider_id: 'provider-1', service_id: 'svc-related', base_lead_price: 30000 }]
      };
    }
    if (sql.includes('INSERT INTO lead_opportunities')) {
      return { rowCount: 1, rows: [{ id: 'opp-1' }] };
    }
    if (
      sql.includes('INSERT INTO lead_requested_services')
      || sql.includes('INSERT INTO lead_events')
    ) {
      return { rowCount: 1, rows: [] };
    }

    throw new Error(`Unhandled SQL in test: ${sql}`);
  });

  setPoolForTests(mockPool);

  const output = await createLeadTransactional({
    clientName: 'Cliente',
    clientEmail: 'cliente@test.com',
    clientPhone: '+57 300',
    citySlug: 'bogota',
    primaryServiceSlug: 'cajas-personalizadas',
    requestedServiceSlugs: ['impresion'],
    description: 'Necesito cotizacion para cajas y material de impresion',
    budgetRange: '2m-5m',
    urgency: 'this_week'
  });

  assert.equal(output.opportunitiesCount, 1);
  assert.deepEqual(output.requestedServiceSlugs, ['cajas-personalizadas', 'impresion']);
  assert.match(output.leadPublicCode, /^LD-\d{14}-[A-Z0-9]{6}$/);
});

test('IT-lead-events-emitted: createLeadTransactional emits lead_created and opportunity_created events', async () => {
  const observedEventTypes: string[] = [];
  const mockPool = createMockPoolWithClient(async (sql, params) => {
    if (sql === 'BEGIN' || sql === 'COMMIT' || sql === 'ROLLBACK') {
      return { rowCount: 0, rows: [] };
    }
    if (sql.includes('FROM locations')) return { rowCount: 1, rows: [{ id: 'city-1' }] };
    if (sql.includes('FROM services') && sql.includes('slug = $1')) {
      return { rowCount: 1, rows: [{ id: 'svc-primary', slug: 'cajas-personalizadas', base_lead_price: 50000 }] };
    }
    if (sql.includes('FROM services') && sql.includes('slug = ANY')) {
      return { rowCount: 1, rows: [{ id: 'svc-primary', slug: 'cajas-personalizadas', base_lead_price: 50000 }] };
    }
    if (sql.includes('FROM leads') && sql.includes('created_at >=')) return { rowCount: 0, rows: [] };
    if (sql.includes('INSERT INTO leads')) return { rowCount: 1, rows: [{ id: 'lead-1' }] };
    if (sql.includes('SELECT DISTINCT ps.provider_id')) {
      return {
        rowCount: 1,
        rows: [{ provider_id: 'provider-1', service_id: 'svc-primary', base_lead_price: 50000 }]
      };
    }
    if (sql.includes('INSERT INTO lead_opportunities')) return { rowCount: 1, rows: [{ id: 'opp-1' }] };
    if (sql.includes('INSERT INTO lead_events')) {
      const eventPayload = String(params[2] ?? params[1] ?? '');
      if (sql.includes("'lead_created'") && eventPayload.includes('requested_service_slugs')) {
        observedEventTypes.push('lead_created');
      }
      if (sql.includes("'opportunity_created'") && eventPayload.includes('lead_price')) {
        observedEventTypes.push('opportunity_created');
      }
      return { rowCount: 1, rows: [] };
    }
    if (sql.includes('INSERT INTO lead_requested_services')) return { rowCount: 1, rows: [] };

    throw new Error(`Unhandled SQL in test: ${sql}`);
  });

  setPoolForTests(mockPool);

  await createLeadTransactional({
    clientName: 'Cliente',
    clientEmail: 'cliente@test.com',
    clientPhone: '+57 300',
    citySlug: 'bogota',
    primaryServiceSlug: 'cajas-personalizadas',
    requestedServiceSlugs: [],
    description: 'Necesito cotizacion para cajas personalizadas',
    urgency: 'normal'
  });

  assert.equal(observedEventTypes.includes('lead_created'), true);
  assert.equal(observedEventTypes.includes('opportunity_created'), true);
});

test('IT-no-assign-suspended-provider: opportunity matching query enforces active provider status', async () => {
  let matchQuerySql = '';
  const mockPool = createMockPoolWithClient(async (sql) => {
    if (sql === 'BEGIN' || sql === 'COMMIT' || sql === 'ROLLBACK') return { rowCount: 0, rows: [] };
    if (sql.includes('FROM locations')) return { rowCount: 1, rows: [{ id: 'city-1' }] };
    if (sql.includes('FROM services') && sql.includes('slug = $1')) {
      return { rowCount: 1, rows: [{ id: 'svc-primary', slug: 'cajas-personalizadas', base_lead_price: 50000 }] };
    }
    if (sql.includes('FROM services') && sql.includes('slug = ANY')) {
      return { rowCount: 1, rows: [{ id: 'svc-primary', slug: 'cajas-personalizadas', base_lead_price: 50000 }] };
    }
    if (sql.includes('FROM leads') && sql.includes('created_at >=')) return { rowCount: 0, rows: [] };
    if (sql.includes('INSERT INTO leads')) return { rowCount: 1, rows: [{ id: 'lead-1' }] };
    if (sql.includes('SELECT DISTINCT ps.provider_id')) {
      matchQuerySql = sql;
      return { rowCount: 0, rows: [] };
    }
    if (sql.includes('INSERT INTO lead_requested_services') || sql.includes('INSERT INTO lead_events')) {
      return { rowCount: 1, rows: [] };
    }

    throw new Error(`Unhandled SQL in test: ${sql}`);
  });

  setPoolForTests(mockPool);

  await createLeadTransactional({
    clientName: 'Cliente',
    clientEmail: 'cliente@test.com',
    clientPhone: '+57 300',
    citySlug: 'bogota',
    primaryServiceSlug: 'cajas-personalizadas',
    requestedServiceSlugs: [],
    description: 'Necesito cotizacion para cajas personalizadas'
  });

  assert.equal(matchQuerySql.includes("p.status = 'active'"), true);
});
