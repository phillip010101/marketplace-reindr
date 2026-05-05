import test from 'node:test';
import assert from 'node:assert/strict';
import type { Pool } from 'pg';
import { createApp } from '../app';
import { createAccessToken } from '../lib/auth-token';
import { setPoolForTests } from '../lib/db';
import { createPasswordHash } from '../lib/password';
import { resetRateLimitStateForTests } from '../lib/rate-limit';

type QueryResult<Row> = {
  rowCount: number;
  rows: Row[];
};

type QueryHandler = (sql: string, params: unknown[]) => Promise<QueryResult<Record<string, unknown>>>;

function createMockPool(queryHandler: QueryHandler): Pool {
  const mock = {
    query: queryHandler
  };
  return mock as unknown as Pool;
}

type ClientQueryHandler = (sql: string, params: unknown[]) => Promise<QueryResult<Record<string, unknown>>>;

function createMockPoolWithConnect(
  poolQueryHandler: QueryHandler,
  clientQueryHandler: ClientQueryHandler
): Pool {
  const mock = {
    query: poolQueryHandler,
    connect: async () => ({
      query: clientQueryHandler,
      release() {}
    })
  };
  return mock as unknown as Pool;
}

function authHeaders(input: { accountId: string; role: 'client' | 'provider' | 'admin' }): Record<string, string> {
  const token = createAccessToken({
    accountId: input.accountId,
    role: input.role
  });
  return {
    authorization: `Bearer ${token}`
  };
}

test.afterEach(() => {
  setPoolForTests(null);
  resetRateLimitStateForTests();
  delete process.env.LEADS_RATE_LIMIT_MAX;
  delete process.env.LEADS_RATE_LIMIT_WINDOW_MS;
  delete process.env.SESSION_SECRET;
});

test('IT-api-error-shape: POST /api/leads returns canonical validation error payload', async () => {
  const app = createApp();
  const response = await app.request('/api/leads', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      client_name: 'A',
      client_email: 'invalid-email',
      consent: false
    })
  });

  assert.equal(response.status, 400);
  const payload = await response.json();
  assert.equal(payload.ok, false);
  assert.equal(payload.error.code, 'VALIDATION_ERROR');
  assert.equal(typeof payload.error.message, 'string');
  assert.equal(typeof payload.error.fields, 'object');
});

test('IT-auth-login-success: valid credentials issue bearer token', async () => {
  process.env.SESSION_SECRET = 'test-secret';
  setPoolForTests(
    createMockPool(async (sql) => {
      if (sql.includes('FROM accounts')) {
        return {
          rowCount: 1,
          rows: [
            {
              id: 'admin-1',
              role: 'admin',
              status: 'active',
              password_hash: createPasswordHash('Admin123!', 'reindr-admin-salt-v1')
            }
          ]
        };
      }
      return {
        rowCount: 0,
        rows: []
      };
    })
  );

  const app = createApp();
  const response = await app.request('/api/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@reindr.test',
      password: 'Admin123!'
    })
  });

  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.equal(payload.ok, true);
  assert.equal(typeof payload.data.access_token, 'string');
  assert.equal(payload.data.token_type, 'Bearer');
  assert.equal(payload.data.actor.role, 'admin');
});

test('IT-auth-login-invalid-credentials: wrong password returns unauthorized', async () => {
  process.env.SESSION_SECRET = 'test-secret';
  setPoolForTests(
    createMockPool(async (sql) => {
      if (sql.includes('FROM accounts')) {
        return {
          rowCount: 1,
          rows: [
            {
              id: 'admin-1',
              role: 'admin',
              status: 'active',
              password_hash: createPasswordHash('Admin123!', 'reindr-admin-salt-v1')
            }
          ]
        };
      }
      return {
        rowCount: 0,
        rows: []
      };
    })
  );

  const app = createApp();
  const response = await app.request('/api/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@reindr.test',
      password: 'wrong-password'
    })
  });

  assert.equal(response.status, 401);
  const payload = await response.json();
  assert.equal(payload.ok, false);
  assert.equal(payload.error.code, 'UNAUTHORIZED');
});

test('IT-auth-me: bearer token resolves actor', async () => {
  process.env.SESSION_SECRET = 'test-secret';
  const app = createApp();
  const response = await app.request('/api/auth/me', {
    headers: authHeaders({ accountId: 'provider-account-1', role: 'provider' })
  });

  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.equal(payload.ok, true);
  assert.equal(payload.data.account_id, 'provider-account-1');
  assert.equal(payload.data.role, 'provider');
});

test('IT-provider-leads-authz: GET /api/provider/leads requires bearer auth', async () => {
  const app = createApp();
  const response = await app.request('/api/provider/leads');

  assert.equal(response.status, 401);
  const payload = await response.json();
  assert.equal(payload.ok, false);
  assert.equal(payload.error.code, 'UNAUTHORIZED');
});

test('IT-provider-leads-authz: GET /api/provider/leads forbids non-provider roles', async () => {
  process.env.SESSION_SECRET = 'test-secret';
  const app = createApp();
  const response = await app.request('/api/provider/leads', {
    headers: authHeaders({ accountId: 'account-1', role: 'client' })
  });

  assert.equal(response.status, 403);
  const payload = await response.json();
  assert.equal(payload.ok, false);
  assert.equal(payload.error.code, 'FORBIDDEN');
});

test('IT-provider-leads-authz: invalid bearer token returns unauthorized', async () => {
  process.env.SESSION_SECRET = 'test-secret';
  const app = createApp();
  const response = await app.request('/api/provider/leads', {
    headers: {
      authorization: 'Bearer invalid.token.value'
    }
  });

  assert.equal(response.status, 401);
  const payload = await response.json();
  assert.equal(payload.ok, false);
  assert.equal(payload.error.code, 'UNAUTHORIZED');
});

test('IT-provider-leads-authz: expired bearer token returns unauthorized', async () => {
  process.env.SESSION_SECRET = 'test-secret';
  const app = createApp();
  const expired = createAccessToken({
    accountId: 'account-1',
    role: 'provider',
    expiresInSeconds: -10
  });
  const response = await app.request('/api/provider/leads', {
    headers: {
      authorization: `Bearer ${expired}`
    }
  });

  assert.equal(response.status, 401);
  const payload = await response.json();
  assert.equal(payload.ok, false);
  assert.equal(payload.error.code, 'UNAUTHORIZED');
});

test('IT-provider-metrics-authz: GET /api/provider/metrics requires bearer auth', async () => {
  const app = createApp();
  const response = await app.request('/api/provider/metrics');

  assert.equal(response.status, 401);
  const payload = await response.json();
  assert.equal(payload.ok, false);
  assert.equal(payload.error.code, 'UNAUTHORIZED');
});

test('IT-provider-metrics: returns aggregated counters for provider opportunities', async () => {
  process.env.SESSION_SECRET = 'test-secret';
  setPoolForTests(
    createMockPool(async (sql) => {
      if (sql.includes('FROM providers')) {
        return {
          rowCount: 1,
          rows: [{ id: 'provider-1' }]
        };
      }
      if (sql.includes('FROM lead_opportunities')) {
        return {
          rowCount: 1,
          rows: [
            {
              total: 7,
              new_count: 2,
              contacted_count: 1,
              quoted_count: 3,
              closed_count: 1
            }
          ]
        };
      }
      return {
        rowCount: 0,
        rows: []
      };
    })
  );

  const app = createApp();
  const response = await app.request('/api/provider/metrics', {
    headers: authHeaders({ accountId: 'account-1', role: 'provider' })
  });

  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.equal(payload.ok, true);
  assert.equal(payload.data.total, 7);
  assert.equal(payload.data.new, 2);
  assert.equal(payload.data.contacted, 1);
  assert.equal(payload.data.quoted, 3);
  assert.equal(payload.data.closed, 1);
});

test('IT-provider-me: provider can read own profile', async () => {
  process.env.SESSION_SECRET = 'test-secret';
  setPoolForTests(
    createMockPool(async (sql) => {
      if (sql.includes('FROM providers p')) {
        return {
          rowCount: 1,
          rows: [
            {
              id: 'provider-1',
              slug: 'cajas-acme',
              display_name: 'Cajas Acme',
              description: 'Empaques para ecommerce',
              phone: '+571111111',
              whatsapp: '+573001112233',
              website_url: 'https://cajas-acme.test',
              logo_url: 'https://img.test/logo.png',
              cover_url: 'https://img.test/cover.png',
              template_id: 'craft-paper',
              status: 'active',
              verified_at: '2026-05-01T00:00:00.000Z',
              service_slugs: ['cajas-personalizadas', 'diseno-empaque']
            }
          ]
        };
      }
      return {
        rowCount: 0,
        rows: []
      };
    })
  );

  const app = createApp();
  const response = await app.request('/api/provider/me', {
    headers: authHeaders({ accountId: 'account-1', role: 'provider' })
  });

  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.equal(payload.ok, true);
  assert.equal(payload.data.slug, 'cajas-acme');
  assert.equal(payload.data.template_id, 'craft-paper');
  assert.equal(Array.isArray(payload.data.services), true);
  assert.equal(payload.data.services.length, 2);
});

test('IT-provider-me: PATCH /api/provider/me updates editable profile fields', async () => {
  process.env.SESSION_SECRET = 'test-secret';
  const updateCalls: Array<{ sql: string; params: unknown[] }> = [];
  setPoolForTests(
    createMockPool(async (sql, params) => {
      if (sql.includes('UPDATE providers')) {
        updateCalls.push({ sql, params });
        return {
          rowCount: 1,
          rows: []
        };
      }
      if (sql.includes('FROM providers p')) {
        return {
          rowCount: 1,
          rows: [
            {
              id: 'provider-1',
              slug: 'cajas-acme',
              display_name: 'Cajas Acme Pro',
              description: 'Descripcion actualizada',
              phone: '+571111111',
              whatsapp: '+573001112233',
              website_url: 'https://cajas-acme.test',
              logo_url: null,
              cover_url: null,
              template_id: 'urban-ink',
              status: 'active',
              verified_at: null,
              service_slugs: ['cajas-personalizadas']
            }
          ]
        };
      }
      return {
        rowCount: 0,
        rows: []
      };
    })
  );

  const app = createApp();
  const response = await app.request('/api/provider/me', {
    method: 'PATCH',
    headers: {
      'content-type': 'application/json',
      ...authHeaders({ accountId: 'account-1', role: 'provider' })
    },
    body: JSON.stringify({
      display_name: 'Cajas Acme Pro',
      description: 'Descripcion actualizada'
    })
  });

  assert.equal(response.status, 200);
  assert.equal(updateCalls.length, 1);
  assert.equal(updateCalls[0].params[0], 'Cajas Acme Pro');
  const payload = await response.json();
  assert.equal(payload.ok, true);
  assert.equal(payload.data.display_name, 'Cajas Acme Pro');
  assert.equal(payload.data.template_id, 'urban-ink');
});

test('IT-provider-me: PATCH /api/provider/me rejects empty body', async () => {
  process.env.SESSION_SECRET = 'test-secret';
  const app = createApp();
  const response = await app.request('/api/provider/me', {
    method: 'PATCH',
    headers: {
      'content-type': 'application/json',
      ...authHeaders({ accountId: 'account-1', role: 'provider' })
    },
    body: JSON.stringify({})
  });

  assert.equal(response.status, 400);
  const payload = await response.json();
  assert.equal(payload.ok, false);
  assert.equal(payload.error.code, 'VALIDATION_ERROR');
});

test('IT-provider-ownership: provider without linked profile gets forbidden', async () => {
  process.env.SESSION_SECRET = 'test-secret';
  setPoolForTests(
    createMockPool(async () => ({
      rowCount: 0,
      rows: []
    }))
  );

  const app = createApp();
  const response = await app.request('/api/provider/leads', {
    headers: authHeaders({ accountId: 'account-1', role: 'provider' })
  });

  assert.equal(response.status, 403);
  const payload = await response.json();
  assert.equal(payload.ok, false);
  assert.equal(payload.error.code, 'FORBIDDEN');
});

test('IT-provider-ownership: provider cannot fetch opportunity outside ownership', async () => {
  process.env.SESSION_SECRET = 'test-secret';
  setPoolForTests(
    createMockPool(async (sql) => {
      if (sql.includes('FROM providers')) {
        return {
          rowCount: 1,
          rows: [{ id: 'provider-1' }]
        };
      }
      return {
        rowCount: 0,
        rows: []
      };
    })
  );

  const app = createApp();
  const response = await app.request('/api/provider/leads/op-1', {
    headers: authHeaders({ accountId: 'account-1', role: 'provider' })
  });

  assert.equal(response.status, 404);
  const payload = await response.json();
  assert.equal(payload.ok, false);
  assert.equal(payload.error.code, 'NOT_FOUND');
});

test('IT-provider-lead-detail: returns owned opportunity with allowed next statuses', async () => {
  process.env.SESSION_SECRET = 'test-secret';
  setPoolForTests(
    createMockPool(async (sql) => {
      if (sql.includes('FROM providers')) {
        return {
          rowCount: 1,
          rows: [{ id: 'provider-1' }]
        };
      }
      if (sql.includes('FROM lead_opportunities lo')) {
        return {
          rowCount: 1,
          rows: [
            {
              opportunity_id: 'op-1',
              opportunity_status: 'new',
              valid_for_billing: false,
              lead_price: 42000,
              assigned_at: '2026-05-01T00:00:00.000Z',
              lead_public_code: 'LEAD-001',
              lead_description: 'Necesito cajas para ecommerce',
              client_name: 'Cliente Uno',
              client_email: 'cliente@example.test',
              client_phone: '+573000000001',
              city_slug: 'bogota',
              service_slug: 'cajas-personalizadas'
            }
          ]
        };
      }
      return {
        rowCount: 0,
        rows: []
      };
    })
  );

  const app = createApp();
  const response = await app.request('/api/provider/leads/op-1', {
    headers: authHeaders({ accountId: 'account-1', role: 'provider' })
  });

  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.equal(payload.ok, true);
  assert.equal(payload.data.opportunity_id, 'op-1');
  assert.deepEqual(payload.data.allowed_next_statuses, ['viewed', 'rejected']);
});

test('IT-provider-quote: creates quote and transitions opportunity to quoted', async () => {
  process.env.SESSION_SECRET = 'test-secret';
  const updateCalls: Array<{ sql: string; params: unknown[] }> = [];
  const quoteInsertCalls: Array<{ sql: string; params: unknown[] }> = [];

  setPoolForTests(
    createMockPoolWithConnect(
      async (sql) => {
        if (sql.includes('FROM providers')) {
          return {
            rowCount: 1,
            rows: [{ id: 'provider-1' }]
          };
        }
        return {
          rowCount: 0,
          rows: []
        };
      },
      async (sql, params) => {
        if (sql === 'BEGIN' || sql === 'COMMIT' || sql === 'ROLLBACK') {
          return {
            rowCount: 0,
            rows: []
          };
        }

        if (sql.includes('SELECT status, lead_id')) {
          return {
            rowCount: 1,
            rows: [{ status: 'contacted', lead_id: 'lead-1' }]
          };
        }

        if (sql.includes('INSERT INTO quotes')) {
          quoteInsertCalls.push({ sql, params });
          return {
            rowCount: 1,
            rows: [
              {
                id: 'quote-1',
                opportunity_id: 'op-1',
                amount: 700000,
                currency: 'COP',
                estimated_delivery_time: '7 dias habiles',
                message: 'Incluye diseno y entrega',
                status: 'sent',
                created_at: '2026-05-05T00:00:00.000Z'
              }
            ]
          };
        }

        if (sql.includes('UPDATE lead_opportunities')) {
          updateCalls.push({ sql, params });
          return {
            rowCount: 1,
            rows: []
          };
        }

        if (sql.includes('INSERT INTO lead_events')) {
          return {
            rowCount: 1,
            rows: []
          };
        }

        throw new Error(`Unhandled SQL in quote test: ${sql}`);
      }
    )
  );

  const app = createApp();
  const response = await app.request('/api/provider/leads/op-1/quote', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...authHeaders({ accountId: 'account-1', role: 'provider' })
    },
    body: JSON.stringify({
      amount: 700000,
      currency: 'cop',
      estimated_delivery_time: '7 dias habiles',
      message: 'Incluye diseno y entrega'
    })
  });

  assert.equal(response.status, 201);
  assert.equal(quoteInsertCalls.length, 1);
  assert.equal(quoteInsertCalls[0].params[2], 'COP');
  assert.equal(updateCalls.length, 1);
  assert.equal(updateCalls[0].params[1], true);
  const payload = await response.json();
  assert.equal(payload.ok, true);
  assert.equal(payload.data.status, 'quoted');
});

test('IT-provider-quote: rejects invalid transition to quoted', async () => {
  process.env.SESSION_SECRET = 'test-secret';
  setPoolForTests(
    createMockPoolWithConnect(
      async (sql) => {
        if (sql.includes('FROM providers')) {
          return {
            rowCount: 1,
            rows: [{ id: 'provider-1' }]
          };
        }
        return {
          rowCount: 0,
          rows: []
        };
      },
      async (sql) => {
        if (sql === 'BEGIN' || sql === 'COMMIT' || sql === 'ROLLBACK') {
          return {
            rowCount: 0,
            rows: []
          };
        }
        if (sql.includes('SELECT status, lead_id')) {
          return {
            rowCount: 1,
            rows: [{ status: 'new', lead_id: 'lead-1' }]
          };
        }
        if (sql.includes('INSERT INTO quotes')) {
          throw new Error('quote insert should not happen when transition is invalid');
        }
        return {
          rowCount: 0,
          rows: []
        };
      }
    )
  );

  const app = createApp();
  const response = await app.request('/api/provider/leads/op-1/quote', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...authHeaders({ accountId: 'account-1', role: 'provider' })
    },
    body: JSON.stringify({
      amount: 700000,
      currency: 'COP'
    })
  });

  assert.equal(response.status, 400);
  const payload = await response.json();
  assert.equal(payload.ok, false);
  assert.equal(payload.error.code, 'INVALID_TRANSITION');
});

test('IT-rate-limit-leads: POST /api/leads blocks repeated requests from same client address', async () => {
  process.env.LEADS_RATE_LIMIT_MAX = '2';
  process.env.LEADS_RATE_LIMIT_WINDOW_MS = '60000';

  const app = createApp();
  const requestInit = {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-forwarded-for': '10.0.0.1'
    },
    body: JSON.stringify({ client_name: 'A' })
  } as const;

  const first = await app.request('/api/leads', requestInit);
  assert.equal(first.status, 400);

  const second = await app.request('/api/leads', requestInit);
  assert.equal(second.status, 400);

  const third = await app.request('/api/leads', requestInit);
  assert.equal(third.status, 429);
  assert.equal(third.headers.get('retry-after') !== null, true);
  const payload = await third.json();
  assert.equal(payload.ok, false);
  assert.equal(payload.error.code, 'RATE_LIMITED');
});

test('IT-billing-valid-opportunity: status transition marks valid_for_billing on eligible states', async () => {
  process.env.SESSION_SECRET = 'test-secret';
  const updateCalls: Array<{ sql: string; params: unknown[] }> = [];

  setPoolForTests(
    createMockPoolWithConnect(
      async (sql) => {
        if (sql.includes('FROM providers')) {
          return {
            rowCount: 1,
            rows: [{ id: 'provider-1' }]
          };
        }

        return {
          rowCount: 0,
          rows: []
        };
      },
      async (sql, params) => {
        if (sql === 'BEGIN' || sql === 'COMMIT' || sql === 'ROLLBACK') {
          return {
            rowCount: 0,
            rows: []
          };
        }

        if (sql.includes('SELECT status, lead_id')) {
          return {
            rowCount: 1,
            rows: [{ status: 'contacted', lead_id: 'lead-1' }]
          };
        }

        if (sql.includes('UPDATE lead_opportunities')) {
          updateCalls.push({ sql, params });
          return {
            rowCount: 1,
            rows: []
          };
        }

        if (sql.includes('INSERT INTO lead_events')) {
          return {
            rowCount: 1,
            rows: []
          };
        }

        throw new Error(`Unhandled SQL in billing test: ${sql}`);
      }
    )
  );

  const app = createApp();
  const response = await app.request('/api/provider/leads/op-1/status', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...authHeaders({ accountId: 'account-1', role: 'provider' })
    },
    body: JSON.stringify({
      status: 'quoted',
      note: 'cotizacion enviada'
    })
  });

  assert.equal(response.status, 200);
  assert.equal(updateCalls.length, 1);
  assert.equal(updateCalls[0].params[2], true);
});

test('E2E-public-provider-page-api: GET /api/providers/:slug returns public profile without PII', async () => {
  const app = createApp();
  const response = await app.request('/api/providers/cajas-acme');

  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.equal(payload.ok, true);
  assert.equal(payload.data.slug, 'cajas-acme');
  assert.equal(payload.data.template_id, 'craft-paper');
  assert.equal(Array.isArray(payload.data.services), true);
  assert.equal((payload.data).client_email, undefined);
  assert.equal((payload.data).client_phone, undefined);
});

test('E2E-no-pii-public-pages: GET /api/providers public surfaces do not expose client contact fields', async () => {
  const app = createApp();

  const listResponse = await app.request('/api/providers');
  assert.equal(listResponse.status, 200);
  const listPayload = await listResponse.json();
  assert.equal(listPayload.ok, true);
  for (const item of listPayload.data as Array<Record<string, unknown>>) {
    assert.equal(item.client_email, undefined);
    assert.equal(item.client_phone, undefined);
  }

  const profileResponse = await app.request('/api/providers/cajas-acme');
  assert.equal(profileResponse.status, 200);
  const profilePayload = await profileResponse.json();
  assert.equal(profilePayload.ok, true);
  assert.equal(profilePayload.data.client_email, undefined);
  assert.equal(profilePayload.data.client_phone, undefined);
});

test('IT-admin-review-moderation: admin can moderate review status', async () => {
  process.env.SESSION_SECRET = 'test-secret';
  const adminClientCalls: Array<{ sql: string; params: unknown[] }> = [];
  setPoolForTests(
    createMockPoolWithConnect(
      async (sql, params) => {
        if (sql.includes('UPDATE reviews')) {
          return {
            rowCount: 1,
            rows: [{ id: 'rev-1', status: 'approved', provider_id: 'provider-1' }]
          };
        }
        if (sql.includes('INSERT INTO admin_events')) {
          adminClientCalls.push({ sql, params });
          return {
            rowCount: 1,
            rows: []
          };
        }
        return {
          rowCount: 0,
          rows: []
        };
      },
      async () => ({
        rowCount: 0,
        rows: []
      })
    )
  );

  const app = createApp();
  const response = await app.request('/api/admin/reviews/rev-1/moderate', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...authHeaders({ accountId: 'admin-1', role: 'admin' })
    },
    body: JSON.stringify({
      status: 'approved',
      note: 'review validada'
    })
  });

  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.equal(payload.ok, true);
  assert.equal(payload.data.status, 'approved');
  assert.equal(adminClientCalls.length, 1);
});

test('IT-admin-services-crud: admin can create and update services', async () => {
  process.env.SESSION_SECRET = 'test-secret';
  const events: Array<{ sql: string; params: unknown[] }> = [];
  setPoolForTests(
    createMockPoolWithConnect(
      async (sql, params) => {
        if (sql.includes('INSERT INTO services')) {
          return {
            rowCount: 1,
            rows: [
              {
                id: 'service-1',
                slug: 'acabados-premium',
                name: 'Acabados Premium',
                description: 'Acabados de alto nivel para empaques',
                status: 'active',
                base_lead_price: 45000
              }
            ]
          };
        }
        if (sql.includes('UPDATE services')) {
          return {
            rowCount: 1,
            rows: [
              {
                id: 'service-1',
                slug: 'acabados-premium',
                name: 'Acabados Premium',
                description: 'Acabados de alto nivel para empaques',
                status: 'inactive',
                base_lead_price: 45000
              }
            ]
          };
        }
        if (sql.includes('INSERT INTO admin_events')) {
          events.push({ sql, params });
          return {
            rowCount: 1,
            rows: []
          };
        }
        return {
          rowCount: 0,
          rows: []
        };
      },
      async () => ({
        rowCount: 0,
        rows: []
      })
    )
  );

  const app = createApp();
  const create = await app.request('/api/admin/services', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...authHeaders({ accountId: 'admin-1', role: 'admin' })
    },
    body: JSON.stringify({
      slug: 'acabados-premium',
      name: 'Acabados Premium',
      description: 'Acabados de alto nivel para empaques',
      base_lead_price: 45000
    })
  });

  assert.equal(create.status, 201);
  const createPayload = await create.json();
  assert.equal(createPayload.ok, true);
  assert.equal(createPayload.data.slug, 'acabados-premium');

  const patch = await app.request('/api/admin/services/acabados-premium', {
    method: 'PATCH',
    headers: {
      'content-type': 'application/json',
      ...authHeaders({ accountId: 'admin-1', role: 'admin' })
    },
    body: JSON.stringify({
      status: 'inactive'
    })
  });

  assert.equal(patch.status, 200);
  const patchPayload = await patch.json();
  assert.equal(patchPayload.ok, true);
  assert.equal(patchPayload.data.status, 'inactive');
  assert.equal(events.length, 2);
});

test('IT-admin-services-conflict-duplicate-slug: duplicate slug returns conflict', async () => {
  process.env.SESSION_SECRET = 'test-secret';
  setPoolForTests(
    createMockPoolWithConnect(
      async (sql) => {
        if (sql.includes('INSERT INTO services')) {
          return {
            rowCount: 0,
            rows: []
          };
        }
        if (sql.includes('INSERT INTO admin_events')) {
          throw new Error('admin event should not be inserted for conflict case');
        }
        return {
          rowCount: 0,
          rows: []
        };
      },
      async () => ({
        rowCount: 0,
        rows: []
      })
    )
  );

  const app = createApp();
  const create = await app.request('/api/admin/services', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...authHeaders({ accountId: 'admin-1', role: 'admin' })
    },
    body: JSON.stringify({
      slug: 'acabados-premium',
      name: 'Acabados Premium',
      description: 'Acabados de alto nivel para empaques',
      base_lead_price: 45000
    })
  });

  assert.equal(create.status, 409);
  const payload = await create.json();
  assert.equal(payload.ok, false);
  assert.equal(payload.error.code, 'CONFLICT');
});

test('IT-admin-review-not-found: unknown review id returns not found', async () => {
  process.env.SESSION_SECRET = 'test-secret';
  setPoolForTests(
    createMockPoolWithConnect(
      async (sql) => {
        if (sql.includes('UPDATE reviews')) {
          return {
            rowCount: 0,
            rows: []
          };
        }
        if (sql.includes('INSERT INTO admin_events')) {
          throw new Error('admin event should not be inserted for not-found review');
        }
        return {
          rowCount: 0,
          rows: []
        };
      },
      async () => ({
        rowCount: 0,
        rows: []
      })
    )
  );

  const app = createApp();
  const response = await app.request('/api/admin/reviews/rev-missing/moderate', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...authHeaders({ accountId: 'admin-1', role: 'admin' })
    },
    body: JSON.stringify({
      status: 'approved'
    })
  });

  assert.equal(response.status, 404);
  const payload = await response.json();
  assert.equal(payload.ok, false);
  assert.equal(payload.error.code, 'NOT_FOUND');
});

test('IT-admin-routes-authz: non-admin role is forbidden', async () => {
  process.env.SESSION_SECRET = 'test-secret';
  const app = createApp();
  const response = await app.request('/api/admin/services', {
    headers: authHeaders({ accountId: 'provider-1', role: 'provider' })
  });

  assert.equal(response.status, 403);
  const payload = await response.json();
  assert.equal(payload.ok, false);
  assert.equal(payload.error.code, 'FORBIDDEN');
});
