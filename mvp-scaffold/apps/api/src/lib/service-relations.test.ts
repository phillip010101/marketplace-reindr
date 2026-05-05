import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveServiceRelations } from './service-relations';

test('resolveServiceRelations uses local catalog when DATABASE_URL is missing', async () => {
  const previousDatabaseUrl = process.env.DATABASE_URL;
  delete process.env.DATABASE_URL;

  const relations = await resolveServiceRelations('cajas-personalizadas');

  if (previousDatabaseUrl === undefined) {
    delete process.env.DATABASE_URL;
  } else {
    process.env.DATABASE_URL = previousDatabaseUrl;
  }

  assert.ok(relations.length > 0);
  assert.equal(relations[0]?.sourceServiceSlug, 'cajas-personalizadas');
});
