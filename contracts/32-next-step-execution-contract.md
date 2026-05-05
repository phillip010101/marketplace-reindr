---
id: NEXT_STEP_32
title: Next Step Execution Contract
type: governance
status: active
priority: high
version: 1.0.0
applies_to:
  - engineering
  - backend
  - frontend
  - database
depends_on:
  - AUDITORIA_V2_27
  - AUTH_RBAC_28
  - STATE_MACHINE_29
  - DTO_BOUNDARY_30
  - MIGRATIONS_31
  - DOD_21
related:
  - LEADS_BILLING_08
  - API_06
  - PROVIDER_PANEL_11
agent_read_policy: always_when_touching_module
---

# 32 - Next Step Execution Contract

## Purpose

Define the single execution sequence to move from contract phase into implementation without drift.

## Non-Negotiable Rules

- No feature implementation starts unless `contract-rag validate` is green.
- Any implementation task must start with a context bundle generated from the matching pack.
- Code changes that alter business behavior must update affected contracts in the same change set.
- If implementation and contract conflict, contracts must be amended before code merge.

## Current Readiness Snapshot

- Contract baseline: ready.
- RAG contract validation: ready.
- Local-cache RAG mode: ready.
- DB-backed RAG mode: ready (`migrate` executed with pgvector enabled).

## Canonical First Implementation Scope

Start with the `lead-compuesto` pack and close the lead flow end-to-end:

1. Canonical payload `requested_service_slugs` enforced in web + API.
2. Persist lead, requested services, opportunities, and lead events transactionally.
3. Apply opportunity deduplication invariant.
4. Enforce state machine checks in all status transitions.
5. Enforce DTO boundary for public/provider/admin outputs.

## Ordered Execution Gates

### Gate 1 - Infrastructure/quality baseline

- TS and test baseline in place for touched modules.
- Migration pipeline runnable.
- Seed compatibility checked.

### Gate 2 - Lead flow correctness

- `POST /api/leads` persists all required entities.
- Transition matrix validated by core and integration tests.
- Audit events emitted for key transitions.

### Gate 3 - Access and privacy safety

- Provider ownership checks enforced.
- Public endpoints pass no-PII checks.
- Admin-only routes deny non-admin roles.

### Gate 4 - Contract and QA closure

- Affected contracts updated.
- Context packs still valid.
- `contract-rag validate` green after changes.

## Required Agent Behavior Before Coding

- Declare contracts consulted.
- Declare contracts affected.
- Declare migration impact.
- Declare tests expected.
- Declare rollback risk for schema-sensitive changes.

## Acceptance Criteria

- Team can point to one active execution sequence without ambiguity.
- Next sprint starts from `lead-compuesto` with explicit gates and no contract drift.
