import test from 'node:test';
import assert from 'node:assert/strict';
import { getAllowedNextStatuses, validateOpportunityTransition } from './opportunity-state';

test('provider valid transition new->viewed is accepted', () => {
  const result = validateOpportunityTransition('new', 'viewed', 'provider');
  assert.equal(result.ok, true);
});

test('provider cannot set invalid', () => {
  const result = validateOpportunityTransition('new', 'invalid', 'provider');
  assert.equal(result.ok, false);
});

test('admin can set invalid from any state', () => {
  const result = validateOpportunityTransition('quoted', 'invalid', 'admin');
  assert.equal(result.ok, true);
});

test('invalid edge contacted->won is rejected', () => {
  const result = validateOpportunityTransition('contacted', 'won', 'provider');
  assert.equal(result.ok, false);
});

test('provider allowed next statuses from contacted only includes quoted', () => {
  const statuses = getAllowedNextStatuses('contacted', 'provider');
  assert.deepEqual(statuses, ['quoted']);
});

test('admin allowed next statuses from quoted include invalid and closure statuses', () => {
  const statuses = getAllowedNextStatuses('quoted', 'admin');
  assert.deepEqual(statuses, ['won', 'lost', 'invalid']);
});
