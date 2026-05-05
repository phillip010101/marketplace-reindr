---
id: READINESS_35
title: Sprint 1 readiness checklist
type: governance
status: active
priority: high
version: 1.0.0
applies_to:
  - engineering
  - product
  - qa
depends_on:
  - CIERRE_PREDEV_34
  - NEXT_STEP_32
  - TRAZABILIDAD_24
  - DOD_21
related:
  - TESTING_QA_17
  - API_06
  - MIGRATIONS_31
agent_read_policy: always_when_touching_module
---

# 35 - Sprint 1 readiness checklist

## Purpose

Define explicit entry conditions for Sprint 1 after contractual P0 closure.

## Non-Negotiable Rules

- Sprint planning can proceed only if all Gate A and Gate B checks are green.
- Feature coding remains blocked until Gate C approval.
- Every checklist item must have owner, evidence, and date.

## Gate A - Contract and Context Integrity

1. `contract-rag validate` green.
2. `pre-development-audit-v3` context confidence = high.
3. `next-step-execution` context confidence = high.
4. No active contradiction between `API_06`, `STATE_MACHINE_29`, `DTO_BOUNDARY_30`, `MIGRATIONS_31`.

## Gate B - Traceability and QA Readiness

1. `TRAZABILIDAD_24` rows for phase 0 have named owner.
2. `TRAZABILIDAD_24` rows for phase 0 have target test id.
3. `TESTING_QA_17` includes minimal suite for lead compuesto, authz ownership, and DTO privacy checks.
4. Migration verification path is defined (`MIGRATIONS_31`).

## Gate C - Start Authorization (No Code Yet)

1. Product + engineering confirm first Sprint 1 slice.
2. Contracts affected by first slice are declared up front.
3. Rollback risk and test scope for first slice are declared.

## Current Snapshot (2026-05-02)

- Gate A:
  - `validate`: green
  - context `pre-development-audit-v3`: high
  - context `next-step-execution`: high
  - contradiction check (`API_06`, `STATE_MACHINE_29`, `DTO_BOUNDARY_30`, `MIGRATIONS_31`): no active contradiction detected
- Gate B:
  - `TRAZABILIDAD_24` owner check: green
  - `TRAZABILIDAD_24` test id check: green
  - `TESTING_QA_17` suite minima declarada: green
  - migration verification path (`MIGRATIONS_31`): green
- Gate C:
  - first slice declared in `SLICE1_36`
  - contracts affected declared
  - rollback risk and test scope declared
  - status: green for planning handoff (implementation still controlled by sprint scope)

## Evidence Template

- Item:
- Owner:
- Status:
- Evidence file/link:
- Date:

## Exit Criteria

- Sprint 1 can start with one declared slice and clear contract boundaries.
- No unresolved blocker from previous pre-development contracts.
