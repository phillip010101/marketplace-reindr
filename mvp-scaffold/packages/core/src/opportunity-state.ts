export const OPPORTUNITY_STATUSES = [
  'new',
  'viewed',
  'contacted',
  'quoted',
  'won',
  'lost',
  'rejected',
  'invalid'
] as const;

export type OpportunityStatus = (typeof OPPORTUNITY_STATUSES)[number];
export type TransitionActorRole = 'provider' | 'admin';

export type TransitionValidationResult =
  | { ok: true }
  | { ok: false; reason: string };

const ALLOWED_PROVIDER_TRANSITIONS = [
  'new->viewed',
  'viewed->contacted',
  'contacted->quoted',
  'quoted->won',
  'quoted->lost',
  'new->rejected'
] as const;
const ALLOWED_PROVIDER_TRANSITIONS_SET = new Set<string>(ALLOWED_PROVIDER_TRANSITIONS);

export function isOpportunityStatus(value: string): value is OpportunityStatus {
  return (OPPORTUNITY_STATUSES as readonly string[]).includes(value);
}

export function validateOpportunityTransition(
  currentStatus: OpportunityStatus,
  nextStatus: OpportunityStatus,
  actorRole: TransitionActorRole
): TransitionValidationResult {
  if (currentStatus === nextStatus) {
    return { ok: true };
  }

  if (nextStatus === 'invalid') {
    return actorRole === 'admin'
      ? { ok: true }
      : { ok: false, reason: 'Solo admin puede mover oportunidad a invalid.' };
  }

  if (actorRole === 'admin') {
    // Admin can perform provider-valid transitions plus invalid transition above.
    const key = `${currentStatus}->${nextStatus}`;
    return ALLOWED_PROVIDER_TRANSITIONS_SET.has(key)
      ? { ok: true }
      : { ok: false, reason: `Transicion no permitida: ${key}` };
  }

  const key = `${currentStatus}->${nextStatus}`;
  if (!ALLOWED_PROVIDER_TRANSITIONS_SET.has(key)) {
    return { ok: false, reason: `Transicion no permitida: ${key}` };
  }

  return { ok: true };
}

export function getAllowedNextStatuses(
  currentStatus: OpportunityStatus,
  actorRole: TransitionActorRole
): OpportunityStatus[] {
  return OPPORTUNITY_STATUSES.filter((candidate) => {
    if (candidate === currentStatus) return false;
    const result = validateOpportunityTransition(currentStatus, candidate, actorRole);
    return result.ok;
  });
}
