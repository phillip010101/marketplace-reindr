import type { OpportunityStatus } from './opportunity-state';

const BILLABLE_STATUSES: OpportunityStatus[] = ['contacted', 'quoted', 'won'];

export function isBillableOpportunityStatus(status: OpportunityStatus): boolean {
  return BILLABLE_STATUSES.includes(status);
}
