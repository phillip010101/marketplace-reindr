---
id: HANDOFF_SLICE1_40
title: Handoff slice 1 para continuar en otro PC
type: governance
status: active
priority: high
version: 1.0.0
applies_to:
  - engineering
  - qa
depends_on:
  - PLAN_SLICE1_37
  - PR_BREAKDOWN_38
  - TRAZABILIDAD_24
  - RUTA_MAESTRA_39
related:
  - API_06
  - MIGRATIONS_31
  - TESTING_QA_17
agent_read_policy: always_when_touching_module
---

# 40 - Handoff slice 1 para continuar en otro PC

## Purpose

Provide an exact continuation path so the project can be resumed on another machine without losing guarantees.

## Current State Snapshot

Slice 1 closure status:

- Batch 1 to Batch 6: completed and validated.
- DB-backed checks executed using VPS Postgres (SSH tunnel local).
- API/web/core quality gates green after DB integration checks.
- Traceability matrix updated to full `hecho` closure for fase 1.

Additional hardening completed after closure:

- Admin routes on DB persistence (no in-memory fallback).
- Bearer token auth on private routes.
- Auth token issuance endpoints (`/api/auth/login`, `/api/auth/me`).
- Provider panel baseline completed with:
  - `GET /api/provider/me`
  - `PATCH /api/provider/me`
  - `POST /api/provider/leads/:opportunityId/quote`

## Resume Checklist on New PC (Ordered)

1. Pull repository and install dependencies:
   - `pnpm install`
2. Run preflight contract checks:
   - `pnpm contract-rag validate`
   - `pnpm contract-rag context "resume slice1 on new pc" --pack sprint1-slice-execution-plan`
3. Configure and start DB:
   - set `DATABASE_URL`
   - start postgres service/container
4. Apply migration pipeline:
   - `pnpm db:migrate`
   - `pnpm db:migrate:check`
5. Run workspace quality gates:
   - `pnpm --dir mvp-scaffold typecheck`
   - `pnpm --dir mvp-scaffold --filter @reindr/api test`
6. Run slice integration checks:
   - `IT-leads-create`
   - `IT-api-error-shape`
   - `IT-provider-ownership`
   - `IT-provider-leads-authz`
   - `IT-lead-events-emitted`
7. Run E2E privacy and lead flow checks:
   - `E2E-no-pii-public-pages`
   - `E2E-lead-flow-3-steps`
8. Final contract closure:
   - `pnpm contract-rag validate`
   - `pnpm contract-rag context "next slice planning after slice1 closure" --pack sprint1-readiness`

## Non-Negotiable Resume Rules

- Do not skip migration checks before integration tests.
- Do not mark `hecho` without test evidence.
- Do not add scope beyond `S1-LEAD-COMPUESTO-CORE`.
- If behavior changes, update affected contracts in same change set.

## Evidence Requirements

For every completed pending check:

- command executed,
- output summary,
- touched file or test id,
- date,
- owner.

## Exit Criteria

- Workspace can be resumed with DB-connected gates in green.
- No contract/document mismatch regarding slice 1 completion.
- Next slice can start from a fresh context bundle with declared scope.
