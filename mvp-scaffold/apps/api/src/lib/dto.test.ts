import test from 'node:test';
import assert from 'node:assert/strict';
import {
  toLeadCreatedPublicResponse,
  toProviderOpportunityDetail,
  toProviderOpportunitySummary,
  toPublicProviderCard,
  toPublicProviderProfile
} from './dto';

test('public provider DTO does not leak PII', () => {
  const dto = toPublicProviderCard({
    id: 'p1',
    display_name: 'Acme',
    services: ['s1'],
    city: 'bogota',
    client_email: 'secret@test.com',
    client_phone: '+57'
  });

  assert.equal(dto.id, 'p1');
  assert.equal((dto as { client_email?: string }).client_email, undefined);
  assert.equal((dto as { client_phone?: string }).client_phone, undefined);
});

test('provider summary DTO includes only summary fields', () => {
  const dto = toProviderOpportunitySummary({
    opportunity_id: 'o1',
    opportunity_status: 'new',
    valid_for_billing: false,
    lead_price: 1000,
    assigned_at: '2026-05-02T00:00:00.000Z',
    lead_public_code: 'LD-1',
    service_slug: 'impresion'
  });

  assert.equal(dto.opportunity_id, 'o1');
  assert.equal((dto as { client_email?: string }).client_email, undefined);
});

test('provider detail DTO keeps contact data for owned opportunity profile', () => {
  const dto = toProviderOpportunityDetail({
    opportunity_id: 'o1',
    opportunity_status: 'contacted',
    valid_for_billing: false,
    lead_price: 1000,
    assigned_at: '2026-05-02T00:00:00.000Z',
    lead_public_code: 'LD-1',
    lead_description: 'Necesito cotizacion',
    client_name: 'Cliente',
    client_email: 'cliente@test.com',
    client_phone: '+57 300',
    city_slug: 'bogota',
    service_slug: 'impresion'
  });

  assert.equal(dto.client_email, 'cliente@test.com');
  assert.equal(dto.client_phone, '+57 300');
});

test('lead created public response keeps canonical shape', () => {
  const dto = toLeadCreatedPublicResponse({
    lead_public_code: 'LD-1',
    requested_service_slugs: ['impresion'],
    opportunities_count: 2,
    message: 'ok'
  });

  assert.deepEqual(dto, {
    lead_public_code: 'LD-1',
    requested_service_slugs: ['impresion'],
    opportunities_count: 2,
    message: 'ok'
  });
});

test('public provider profile DTO does not leak PII and keeps public fields', () => {
  const dto = toPublicProviderProfile({
    id: 'p1',
    slug: 'cajas-acme',
    display_name: 'Cajas Acme',
    description: 'Perfil publico',
    services: ['cajas-personalizadas'],
    city: 'bogota',
    reviews_count: 3,
    rating_avg: 4.7,
    client_email: 'secret@test.com',
    client_phone: '+57'
  });

  assert.equal(dto.slug, 'cajas-acme');
  assert.equal(dto.reviews_count, 3);
  assert.equal(dto.rating_avg, 4.7);
  assert.equal((dto as { client_email?: string }).client_email, undefined);
  assert.equal((dto as { client_phone?: string }).client_phone, undefined);
});
