import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PROVIDERS,
  getProviderTemplateIds,
  isProviderTemplateId,
  resolveProviderTemplate
} from './public-catalog';

test('provider template IDs are unique and valid', () => {
  const ids = getProviderTemplateIds();
  assert.equal(ids.length > 0, true);
  assert.equal(new Set(ids).size, ids.length);
  for (const id of ids) {
    assert.equal(isProviderTemplateId(id), true);
  }
});

test('all catalog providers have a resolvable template', () => {
  for (const provider of PROVIDERS) {
    assert.equal(isProviderTemplateId(provider.templateId), true);
    const resolved = resolveProviderTemplate(provider.slug);
    assert.equal(resolved.id, provider.templateId);
  }
});

test('unknown template id is rejected', () => {
  assert.equal(isProviderTemplateId('not-existing-template'), false);
});
