---
id: PLAN_SLICE1_37
title: Plan tecnico del slice Sprint 1
type: governance
status: active
priority: high
version: 1.0.0
applies_to:
  - engineering
  - backend
  - frontend
  - qa
depends_on:
  - SLICE1_36
  - READINESS_35
  - NEXT_STEP_32
  - MIGRATIONS_31
  - TESTING_QA_17
related:
  - API_06
  - LEADS_BILLING_08
  - AUTH_RBAC_28
  - STATE_MACHINE_29
  - DTO_BOUNDARY_30
  - TRAZABILIDAD_24
agent_read_policy: always_when_touching_module
---

# 37 - Plan tecnico del slice Sprint 1

## Purpose

Convert the first Sprint 1 slice declaration into an execution-ready technical plan, without expanding scope.

## Scope Lock

Slice reference: `S1-LEAD-COMPUESTO-CORE` from `SLICE1_36`.

Scope lock rules:

- No wallet charge implementation.
- No payment webhook implementation.
- No dispute automation implementation.
- No extra endpoints outside declared slice.

## Work Batches (Execution Order)

### Batch 0 - Preflight (no feature code)

1. Generate context bundle with `sprint1-slice-execution-plan` pack.
2. Confirm contracts consulted/affected declaration in PR template.
3. Confirm migration risk class per intended DB change.

Exit gate:

- `contract-rag validate` green.
- `contract-rag context` confidence high.

### Batch 1 - Schema and migration baseline

1. Align lead + requested services schema for canonical payload.
2. Align opportunity + event persistence support.
3. Add ownership and dedup indexes.
4. Document rollback notes per migration file.

Exit gate:

- migration apply from zero works,
- pending migrations apply on existing DB,
- seed remains compatible.

### Batch 2 - Lead creation path (`POST /api/leads`)

1. Normalize payload to `requested_service_slugs`.
2. Persist lead + requested services + opportunities + lead_events transactionally.
3. Enforce error shape consistency on validation failures.

Exit gate:

- `IT-leads-create` pass,
- `IT-api-error-shape` pass.

### Batch 3 - Provider ownership-safe reads

1. Enforce provider ownership checks on provider lead detail/list paths.
2. Deny cross-provider access attempts with consistent authorization error.

Exit gate:

- `IT-provider-ownership` pass,
- `IT-provider-leads-authz` pass.

### Batch 4 - State transitions with validator

1. Provider status update path must call transition validator.
2. Reject invalid transitions with explicit error code.
3. Emit lead_event for accepted transitions.

Exit gate:

- transition unit/integration tests pass,
- no direct DB status update path bypasses validator.

### Batch 5 - DTO boundary enforcement

1. Ensure touched public routes return `public` DTO only.
2. Ensure provider/admin routes use correct DTO profile.
3. Add privacy assertions for no-PII public responses.

Exit gate:

- `E2E-no-pii-public-pages` pass,
- provider/admin DTO checks pass.

### Batch 6 - Contract and traceability closure

1. Update affected contracts if behavior/examples changed.
2. Update `TRAZABILIDAD_24` status + evidence for touched requirements.
3. Regenerate context for `sprint1-readiness`.

Exit gate:

- `contract-rag validate` green after changes,
- context confidence high,
- traceability evidence updated.

## Contract Change Policy During Slice

- If API payload examples change, update `API_06` in same change set.
- If transition edges/guards change, update `STATE_MACHINE_29`.
- If route DTO profile changes, update `DTO_BOUNDARY_30`.
- If migration risk class changes, update `MIGRATIONS_31`.

## Test Plan (Minimum)

- `IT-leads-create`
- `IT-api-error-shape`
- `IT-provider-ownership`
- `IT-provider-leads-authz`
- `E2E-lead-flow-3-steps`
- `E2E-no-pii-public-pages`

## Rollback Strategy

- Migration rollback notes are mandatory before applying migrations.
- If lead creation breaks after deploy:
  - disable new entry path behind feature flag or route guard,
  - rollback latest migration set per notes,
  - keep historical data intact (no destructive rollback).
- If privacy check fails:
  - block affected public response path,
  - patch DTO mapper before re-enable.

## Risks and Mitigations

- Risk: alias payload drift.
  - Mitigation: strict normalization + response canonicalization tests.
- Risk: ownership bypass.
  - Mitigation: central guard checks + integration tests.
- Risk: transition bypass.
  - Mitigation: enforce validator usage in handler path and tests.
- Risk: PII leak in public outputs.
  - Mitigation: DTO mapping + no-PII assertions.

## Definition of Ready for Coding

- Batch 0 completed.
- Slice scope lock acknowledged.
- Migration risk classes declared.
- Test scope accepted by QA.

## Definition of Done for Slice

- All batch exit gates passed.
- Required tests green.
- Contract updates merged with code changes.
- Traceability updated with evidence.

## Execution Snapshot (2026-05-05)

- Batch 0: done.
- Batch 1: done (migration pipeline validated against VPS Postgres through SSH tunnel).
- Batch 2: done (lead create path validated with integration tests).
- Batch 3: done (provider ownership/authz checks validated with integration tests).
- Batch 4: done (transition validator path validated with integration tests).
- Batch 5: done (DTO/privacy checks validated in API + web suites).
- Batch 6: done (contracts, traceability, and context regeneration updated).
