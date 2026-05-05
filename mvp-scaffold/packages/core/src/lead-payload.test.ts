import test from 'node:test';
import assert from 'node:assert/strict';
import {
  findInvalidSlugValues,
  normalizeSlugList,
  resolveCanonicalRequestedServiceSlugs
} from './lead-payload';

test('resolveCanonicalRequestedServiceSlugs prioritizes requested_service_slugs', () => {
  const result = resolveCanonicalRequestedServiceSlugs({
    requested_service_slugs: [' Impresion ', 'impresion', 'Troqueles'],
    related_services: ['ignored-one']
  });

  assert.deepEqual(result, ['impresion', 'troqueles']);
});

test('resolveCanonicalRequestedServiceSlugs falls back to related_services', () => {
  const result = resolveCanonicalRequestedServiceSlugs({
    requested_service_slugs: [],
    related_services: [' Landing-Page ', 'landing-page']
  });

  assert.deepEqual(result, ['landing-page']);
});

test('findInvalidSlugValues returns only invalid slug values', () => {
  const normalized = normalizeSlugList(['ok-slug', 'bad slug', 'otro_ok', 'otro_ok']);
  const invalid = findInvalidSlugValues(normalized);

  assert.deepEqual(invalid, ['bad slug', 'otro_ok']);
});
