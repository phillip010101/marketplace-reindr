---
id: STATE_MACHINE_29
title: Lead and Opportunity State Machine Contract
type: domain
status: active
priority: high
version: 1.0.0
applies_to:
  - backend
  - database
  - admin
depends_on:
  - DOMAIN_04
  - LEADS_BILLING_08
related:
  - PROVIDER_PANEL_11
  - ADMIN_12
agent_read_policy: always_when_touching_module
---

# 29 - Lead and Opportunity State Machine Contract

## Purpose

Define canonical transitions for lead and opportunity statuses and prevent invalid state changes.

## Non-Negotiable Rules

- State transitions must be validated in domain logic before persistence.
- Invalid transitions must be rejected with explicit error code.
- Every accepted transition must produce a `lead_event`.
- Admin invalidation can move an entity to `invalid` from any current state.

## Lead Statuses

- `new`
- `qualified`
- `assigned`
- `in_progress`
- `closed`
- `archived`
- `invalid`

## Opportunity Statuses

- `new`
- `viewed`
- `contacted`
- `quoted`
- `won`
- `lost`
- `rejected`
- `invalid`

## Allowed Opportunity Transitions

- `new -> viewed`
- `viewed -> contacted`
- `contacted -> quoted`
- `quoted -> won`
- `quoted -> lost`
- `new -> rejected`
- `any -> invalid` (admin)

## Transition Guard Rules

- `won` requires prior `quoted`.
- `lost` requires prior `quoted`.
- `rejected` can only happen from `new`.
- Provider role cannot set `invalid`; only admin can.

## Ownership and Role Transition Matrix

| Transition | Provider | Admin | Notes |
| --- | --- | --- | --- |
| `new -> viewed` | allowed (own opportunity only) | allowed | Provider requires ownership check. |
| `viewed -> contacted` | allowed (own opportunity only) | allowed | Must emit lead_event. |
| `contacted -> quoted` | allowed (own opportunity only) | allowed | Quote payload validation required. |
| `quoted -> won` | allowed (own opportunity only) | allowed | Requires prior `quoted`. |
| `quoted -> lost` | allowed (own opportunity only) | allowed | Requires prior `quoted`. |
| `new -> rejected` | allowed (own opportunity only) | allowed | Rejection reason recommended. |
| `any -> invalid` | denied | allowed | Admin-only safety transition. |

### Enforcement Notes

- "Own opportunity only" means `opportunity.provider_id == current_user.provider_id`.
- Admin can transition cross-provider opportunities for moderation/support cases.
- Every accepted transition must store actor role and actor id in `lead_event` metadata.

## Implementation Rule

- Implement transition matrix in `packages/core`.
- API handlers must call core transition validator before DB update.

## Acceptance Criteria

- Unit tests cover allowed and denied transitions.
- Integration tests ensure provider cannot bypass transition matrix.
