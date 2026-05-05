---
id: RUTA_MAESTRA_39
title: Ruta de desarrollo operativa maestra
type: governance
status: active
priority: critical
version: 1.0.0
applies_to:
  - engineering
  - product
  - qa
  - architecture
depends_on:
  - ROADMAP_18
  - NEXT_STEP_32
  - READINESS_35
  - PLAN_SLICE1_37
  - PR_BREAKDOWN_38
  - TRAZABILIDAD_24
  - DOD_21
related:
  - API_06
  - STATE_MACHINE_29
  - DTO_BOUNDARY_30
  - MIGRATIONS_31
  - TESTING_QA_17
agent_read_policy: always_when_touching_module
---

# 39 - Ruta de desarrollo operativa maestra

## Purpose

Define one complete, minimal, and enforceable development route so nothing is omitted while keeping delivery efficient.

## Design Principles

- Single execution route, no parallel hidden processes.
- Small PRs with explicit contracts and gates.
- Source of truth in contracts, never in generated artifacts.
- Reuse first, then extend, then create new.
- No hardcoded business constants in handlers/UI.

## Anti-Omission Method (RAG Trace Loop)

For every PR, run this loop in order:

1. Context step:
   - run `contract-rag context "task" --pack <matching-pack>`
2. Contract declaration step:
   - declare contracts consulted and contracts affected.
3. Traceability step:
   - map requirement -> data rule -> endpoint -> UI path -> test case (`TRAZABILIDAD_24`).
4. Risk step:
   - declare migration risk class and rollback expectation.
5. Verification step:
   - run defined test subset for the slice.
6. Closure step:
   - update contracts/examples if behavior changed.
   - re-run `contract-rag validate`.

If any step is missing, PR is blocked.

## Anti-Hardcode Policy

Forbidden:

- hardcoded service/city/role/status values inside handlers/pages.
- duplicated validation logic across route handlers.
- SQL/business constants spread across multiple modules without shared source.

Required:

- central enums/constants for statuses and roles.
- centralized payload normalization for lead fields.
- shared validator/mappers in core modules.
- config/env driven operational thresholds.

## Anti-Duplication Policy

Required order before writing new code:

1. Search existing implementation.
2. Reuse existing module if behavior fits.
3. Extend existing module if gap is incremental.
4. Create new module only if no safe reuse path exists.

PR must include a short "reuse check" note:

- searched modules,
- reused/extended target,
- reason for any new module.

## Standard PR Contract (Mandatory Sections)

Every PR description must include:

- task understood
- contracts consulted
- contracts affected
- migration impact
- rollback risk
- tests expected
- traceability rows touched

## Development Route by Stages

### Stage A - Readiness and Scope Lock

- apply `READINESS_35`, `SLICE1_36`, `PLAN_SLICE1_37`.
- confirm pack context is high confidence.

Exit:

- readiness gates green.

### Stage B - Schema/Infrastructure Slice Base

- execute PR sequence starting with schema/migration baseline.

Exit:

- migration checks green + rollback notes present.

### Stage C - Core Behavior Implementation

- implement only declared slice behavior in batch order.

Exit:

- required integration tests green.

### Stage D - Access, State, DTO Safety

- enforce ownership, transition validation, DTO boundaries.

Exit:

- security/privacy tests green and no bypass path.

### Stage E - Contract and Trace Closure

- update affected contracts and traceability evidence.
- re-generate context and validate.

Exit:

- `contract-rag validate` green and context confidence high.

## RAG Usage Matrix

- Planning PR: `--pack sprint1-readiness`
- Executing slice: `--pack sprint1-slice-execution-plan`
- Cross-phase audit: `--pack pre-development-audit-v3`

Rule:

- Never start coding tasks without fresh context generated in same work session.

## Minimal Command Flow (Per PR)

1. `pnpm contract-rag validate`
2. `pnpm contract-rag context "PR task" --pack <pack>`
3. execute scoped work
4. run required tests
5. update contracts/traceability if changed
6. `pnpm contract-rag validate`

## Merge Gates (Hard Blockers)

- missing contract declaration in PR
- missing rollback notes for schema-sensitive changes
- missing required tests for slice stage
- contract and behavior mismatch
- traceability not updated for touched requirement

## Success Criteria

- predictable PR sequence
- zero silent scope expansion
- no hardcoded business logic in delivery path
- no duplicated core logic without explicit justification
- every behavior change traceable to contract + test + evidence
