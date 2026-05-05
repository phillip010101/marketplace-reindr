---
id: PR_BREAKDOWN_38
title: Sprint 1 slice PR breakdown Batch 1 y 2
type: governance
status: active
priority: high
version: 1.0.0
applies_to:
  - engineering
  - backend
  - qa
depends_on:
  - PLAN_SLICE1_37
  - SLICE1_36
  - MIGRATIONS_31
  - TESTING_QA_17
related:
  - API_06
  - LEADS_BILLING_08
  - DTO_BOUNDARY_30
  - TRAZABILIDAD_24
agent_read_policy: always_when_touching_module
---

# 38 - Sprint 1 slice PR breakdown Batch 1 y 2

## Purpose

Define a concrete PR-by-PR execution plan for Batch 1 (schema/migrations) and Batch 2 (`POST /api/leads`) of `S1-LEAD-COMPUESTO-CORE`.

## Scope Lock

- Only Batch 1 and Batch 2 work.
- No provider panel feature expansion.
- No wallet/payment/dispute implementation.
- No extra endpoint creation outside declared slice.

## PR-001 (Batch 1): Schema and Migration Baseline

PR ID: `S1-B1-PR001-schema-baseline`

### Goal

Align schema for canonical lead payload and transactional persistence support.

### Expected Work

1. Ensure canonical structures for:
   - leads
   - lead_requested_services
   - lead_opportunities
   - lead_events
2. Add ownership and dedup-oriented indexes.
3. Document rollback notes in each migration.

### Expected Files (indicative)

- `apps/api/*` migration runner wiring if needed
- `packages/db/*` schema and SQL migration files
- seed alignment files (if schema requires seed updates)

### Required Checks

- migration from zero works
- migration on existing DB works
- seed compatibility check passes

### Risk Class

- Medium (additive + constraint alignment)

### Merge Criteria

- `contract-rag validate` green
- migration checks green
- rollback notes present
- no destructive change without explicit approval

## PR-002 (Batch 2): Lead Creation Path (`POST /api/leads`)

PR ID: `S1-B2-PR002-leads-create-path`

### Goal

Implement canonical payload normalization and transactional lead creation flow.

### Expected Work

1. Input normalization:
   - prioritize `requested_service_slugs`
   - map `related_services` alias during transition
2. Transactional persistence:
   - lead + requested services + opportunities + lead events
3. Consistent error response shape on validation failures.

### Expected Files (indicative)

- `apps/api/src/routes/*leads*`
- `packages/core/*lead*`
- `packages/db/*` repository/query helpers
- request validation schemas

### Required Tests

- `IT-leads-create`
- `IT-api-error-shape`
- `E2E-lead-flow-3-steps` (or deferred but declared with date)

### Risk Class

- Medium (behavioral flow + transactional consistency)

### Merge Criteria

- required tests green (or explicit temporary waiver with date/owner)
- no persistence path stores `related_services`
- response examples stay aligned with `API_06`

## Cross-PR Rules

- Do not merge PR-002 before PR-001 is green.
- Every PR must declare:
  - contracts consulted
  - contracts affected
  - migration impact
  - rollback risk
  - tests expected
- If behavior shifts from contracts, update contracts in same PR.

## Evidence Logging

Update `TRAZABILIDAD_24` for affected rows with:

- owner
- status
- test id
- evidence reference (PR/check run)
- date

## Exit Criteria (B1+B2)

- PR-001 merged with migration safety checks.
- PR-002 merged with lead creation path checks.
- `contract-rag context --pack sprint1-slice-execution-plan` stays high confidence.
