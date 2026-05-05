---
id: SLICE1_36
title: Sprint 1 first slice declaration
type: governance
status: active
priority: high
version: 1.0.0
applies_to:
  - engineering
  - product
  - qa
depends_on:
  - READINESS_35
  - NEXT_STEP_32
  - CIERRE_PREDEV_34
related:
  - API_06
  - LEADS_BILLING_08
  - AUTH_RBAC_28
  - STATE_MACHINE_29
  - DTO_BOUNDARY_30
  - MIGRATIONS_31
  - TESTING_QA_17
agent_read_policy: always_when_touching_module
---

# 36 - Sprint 1 first slice declaration

## Purpose

Declare the first Sprint 1 implementation slice with explicit contract boundaries before coding starts.

## Slice Scope

Slice ID: `S1-LEAD-COMPUESTO-CORE`

In scope:

1. `POST /api/leads` canonical payload normalization (`requested_service_slugs`).
2. Transactional persistence of lead + requested services + opportunities + lead_events.
3. Opportunity ownership-safe provider read path.
4. Transition validation on provider status update path.
5. Public/provider/admin DTO boundary enforcement on touched endpoints.

Out of scope:

1. Wallet charge execution.
2. Payment webhook flows.
3. Dispute automation.

## Contracts Consulted

- `NEXT_STEP_32`
- `CIERRE_PREDEV_34`
- `READINESS_35`
- `API_06`
- `LEADS_BILLING_08`
- `AUTH_RBAC_28`
- `STATE_MACHINE_29`
- `DTO_BOUNDARY_30`
- `MIGRATIONS_31`
- `TESTING_QA_17`

## Contracts Affected

- `API_06` (request/response examples if route details shift)
- `STATE_MACHINE_29` (if any transition edge changes)
- `DTO_BOUNDARY_30` (if endpoint profile mapping changes)
- `MIGRATIONS_31` (if migration sequence/risk classes need refinement)
- `TRAZABILIDAD_24` (status/evidence updates as work progresses)

## Migration Impact (Expected)

- Additive and medium-risk schema work expected in first slice:
  - lead related tables/constraints alignment,
  - ownership and dedup indexes,
  - no destructive change planned in first increment.

Rollback expectation:

- Rollback notes required per migration.
- No irreversible destructive rollback accepted in this slice.

## Test Scope (Expected)

- `IT-leads-create`
- `IT-provider-ownership`
- `IT-provider-leads-authz`
- `IT-api-error-shape`
- `E2E-lead-flow-3-steps`
- `E2E-no-pii-public-pages`

## Risks

- Risk of contract drift if alias payload behavior is not normalized consistently.
- Risk of privacy leaks if DTO mapping is bypassed in any handler.
- Risk of transition bypass if status updates skip core validator.

## Approval Snapshot

Date: 2026-05-02

- Product declaration: ready for slice planning.
- Engineering declaration: ready for slice planning.
- QA declaration: minimum suite defined for slice entry.

## Exit Criteria

- Slice can start implementation with declared boundaries and no unresolved readiness blocker.
