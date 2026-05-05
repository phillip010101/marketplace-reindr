import test from 'node:test';
import assert from 'node:assert/strict';
import { isBillableOpportunityStatus } from './billing';

test('isBillableOpportunityStatus marks contacted/quoted/won as billable', () => {
  assert.equal(isBillableOpportunityStatus('contacted'), true);
  assert.equal(isBillableOpportunityStatus('quoted'), true);
  assert.equal(isBillableOpportunityStatus('won'), true);
});

test('isBillableOpportunityStatus keeps non-billable statuses false', () => {
  assert.equal(isBillableOpportunityStatus('new'), false);
  assert.equal(isBillableOpportunityStatus('viewed'), false);
  assert.equal(isBillableOpportunityStatus('lost'), false);
  assert.equal(isBillableOpportunityStatus('rejected'), false);
  assert.equal(isBillableOpportunityStatus('invalid'), false);
});
