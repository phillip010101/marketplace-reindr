import test from 'node:test';
import assert from 'node:assert/strict';
import { getRelatedServices, matchProvidersForLead, validateLeadInput } from './lead-routing';

test('UT-core-related-services: getRelatedServices returns only active relations for source sorted by weight', () => {
  const related = getRelatedServices('cajas-personalizadas', [
    { sourceServiceSlug: 'cajas-personalizadas', targetServiceSlug: 'impresion', weight: 60, active: true },
    { sourceServiceSlug: 'cajas-personalizadas', targetServiceSlug: 'troqueles', weight: 100, active: true },
    { sourceServiceSlug: 'cajas-personalizadas', targetServiceSlug: 'etiquetas', weight: 95, active: false },
    { sourceServiceSlug: 'landing-page', targetServiceSlug: 'ecommerce', weight: 90, active: true }
  ]);

  assert.deepEqual(related, ['troqueles', 'impresion']);
});

test('getRelatedServices returns empty array when no active relation exists', () => {
  const related = getRelatedServices('cajas-personalizadas', [
    { sourceServiceSlug: 'landing-page', targetServiceSlug: 'ecommerce', weight: 90, active: true }
  ]);

  assert.deepEqual(related, []);
});

test('matchProvidersForLead excludes inactive providers and city mismatch', () => {
  const matches = matchProvidersForLead(
    ['troqueles', 'impresion'],
    'bogota',
    [
      { providerId: 'p1', serviceSlug: 'troqueles', citySlug: 'bogota', active: true },
      { providerId: 'p2', serviceSlug: 'troqueles', citySlug: 'bogota', active: false },
      { providerId: 'p3', serviceSlug: 'impresion', citySlug: 'medellin', active: true },
      { providerId: 'p4', serviceSlug: 'etiquetas', citySlug: 'bogota', active: true }
    ]
  );

  assert.deepEqual(matches.map((item) => item.providerId), ['p1']);
});

test('IT-no-assign-suspended-provider: suspended/inactive provider does not match lead opportunities', () => {
  const matches = matchProvidersForLead(
    ['troqueles'],
    'bogota',
    [
      { providerId: 'active-provider', serviceSlug: 'troqueles', citySlug: 'bogota', active: true },
      { providerId: 'suspended-provider', serviceSlug: 'troqueles', citySlug: 'bogota', active: false }
    ]
  );

  assert.deepEqual(matches.map((item) => item.providerId), ['active-provider']);
});

test('UT-core-validateLeadInput: validates consent, description and required slugs', () => {
  assert.deepEqual(
    validateLeadInput({
      client_name: 'Cliente',
      client_email: 'cliente@test.com',
      client_phone: '+57 300',
      city_slug: 'bogota',
      primary_service_slug: 'impresion',
      description: 'Necesito una solucion de empaque integral',
      consent: true
    }),
    { ok: true }
  );

  assert.equal(
    validateLeadInput({
      client_name: 'Cliente',
      client_email: 'cliente@test.com',
      client_phone: '+57 300',
      city_slug: 'bogota',
      primary_service_slug: 'impresion',
      description: 'Corta',
      consent: true
    }).ok,
    false
  );
});
