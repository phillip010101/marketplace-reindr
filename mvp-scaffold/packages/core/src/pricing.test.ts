import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateLeadPrice } from './pricing';

test('UT-core-calculateLeadPrice: applies multipliers deterministically', () => {
  const baseOnly = calculateLeadPrice({
    basePrice: 100,
    requestedServicesCount: 1,
    hasBudget: false
  });
  assert.equal(baseOnly, 100);

  const withBudgetAndUrgency = calculateLeadPrice({
    basePrice: 100,
    requestedServicesCount: 2,
    hasBudget: true,
    urgency: 'urgent'
  });
  // 100 * 1.3 * 1.1 * 1.2 = 171.6 -> 172
  assert.equal(withBudgetAndUrgency, 172);

  const fourServicesTier = calculateLeadPrice({
    basePrice: 100,
    requestedServicesCount: 4,
    hasBudget: false
  });
  // both tiers apply in current rule set: 100 * 1.3 * 1.6 = 208
  assert.equal(fourServicesTier, 208);
});
