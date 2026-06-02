import test from 'node:test';
import assert from 'node:assert/strict';
import type { Pool, PoolClient } from 'pg';
import { createApp } from '../app';
import { createAccessToken } from '../lib/auth-token';
import { setPoolForTests } from '../lib/db';

type MockQuery = (sql: string, params: unknown[]) => Promise<{ rowCount: number; rows: Record<string, unknown>[] }>;

const providerAId = '11111111-1111-1111-1111-111111111111';
const providerBId = '22222222-2222-2222-2222-222222222222';
const oppAId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

function mockPoolForOwnership(): Pool {
  const db: Record<string, any[]> = {};
  
  const query: MockQuery = async (sql, params) => {
    if (sql.includes('FROM providers WHERE account_id')) {
      return { rowCount: 1, rows: [{ id: providerAId, status: 'active' }] };
    }
    if (sql.includes('FROM lead_opportunities') && sql.includes('WHERE id = $1')) {
      const id = params[0];
      if (id === oppAId) {
        return { rowCount: 1, rows: [{ status: 'new', lead_id: 'lead-1', provider_id: providerBId, lead_price: 10000 }] };
      }
      return { rowCount: 0, rows: [] };
    }
    if (sql.includes('FROM lead_opportunities lo')) {
      return { rowCount: 3, rows: [
        { opportunity_id: oppAId, opportunity_status: 'new', valid_for_billing: false, lead_price: 10000, assigned_at: new Date().toISOString(), lead_public_code: 'LD-1', service_slug: 'cajas' }
      ] };
    }
    return { rowCount: 1, rows: [{}] };
  };

  const client = {
    query,
    release: () => {}
  };

  const pool = {
    query,
    connect: async () => client as unknown as PoolClient
  };

  return pool as unknown as Pool;
}

test('IT-provider-ownership: provider A cannot read provider B opportunity detail (ownership enforced via SQL)', async () => {
  setPoolForTests(mockPoolForOwnership());
  const app = createApp();
  const tokenA = createAccessToken({ accountId: 'acc-a', role: 'provider' });

  const res = await app.request(`/api/provider/leads/${oppAId}`, {
    headers: { Authorization: `Bearer ${tokenA}` }
  });

  const body = await res.json();
  assert.equal(body.ok, false);
  assert.ok(body.error.code === 'NOT_FOUND' || body.error.code === 'FORBIDDEN' || body.error.code === 'INTERNAL_ERROR',
    `Expected error code, got ${body.error.code}`);
});

test('IT-provider-ownership: provider can read own opportunities list', async () => {
  setPoolForTests(mockPoolForOwnership());
  const app = createApp();

  const tokenA = createAccessToken({ accountId: 'acc-a', role: 'provider' });

  const res = await app.request('/api/provider/leads', {
    headers: { Authorization: `Bearer ${tokenA}` }
  });

  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.ok, true);
});

test('IT-provider-authz: non-provider role rejected', async () => {
  setPoolForTests(mockPoolForOwnership());
  const app = createApp();

  const clientToken = createAccessToken({ accountId: 'acc-c', role: 'client' });
  const adminToken = createAccessToken({ accountId: 'acc-admin', role: 'admin' });

  const res1 = await app.request('/api/provider/leads', {
    headers: { Authorization: `Bearer ${clientToken}` }
  });
  assert.equal(res1.status, 403);

  const res2 = await app.request('/api/provider/me', {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert.equal(res2.status, 403);
});

setPoolForTests(null);
