---
id: MIGRATIONS_31
title: Migrations and Schema Versioning Contract
type: data
status: active
priority: high
version: 1.0.0
applies_to:
  - backend
  - database
  - devops
depends_on:
  - DATA_05
  - DOMAIN_04
related:
  - TESTING_QA_17
  - DOD_21
agent_read_policy: always_when_touching_module
---

# 31 - Migrations and Schema Versioning Contract

## Purpose

Define safe schema evolution for MVP without breaking existing flows.

## Non-Negotiable Rules

- Schema changes must be migration-based and reproducible.
- Never make destructive schema changes without explicit rollback strategy.
- Every migration must include forward SQL and rollback notes.
- Business-rule schema changes must update affected contracts in the same PR.
- Seed data must stay compatible with current schema and test requirements.

## Migration Strategy

- Use ordered SQL migration files.
- Keep migrations idempotent where feasible.
- Avoid long locks in production paths.
- For high-risk changes use staged rollout:
  - backfill nullable column,
  - deploy app using new column,
  - enforce `NOT NULL`/constraints later.

## Versioning Strategy

- Contract `version` must change when business behavior changes.
- Migration file naming should be monotonic and descriptive.
- Breaking API/data behavior requires explicit note in decision log.

## Required Checks per Migration

- Contract impact declared.
- Data backfill plan declared if needed.
- Test impact declared.
- Rollback notes present.

## Phase 0 Baseline Migration Sequence

Execution order for initial hardening:

1. Create/align base identity and provider ownership constraints.
2. Create/align lead + lead_requested_services canonical schema.
3. Create/align lead_opportunities and transition/event support tables.
4. Add indexes for ownership and deduplication queries.
5. Enforce non-null/foreign-key constraints after backfill checks.

## Rollback Policy (Minimum)

- Every migration file must include a rollback section in comments.
- Rollback must specify:
  - objects to drop/revert,
  - data safety caveats,
  - whether rollback is full or partial.
- Destructive rollback (data loss risk) must be flagged before execution.

## Migration Risk Classes

- Low: additive columns/indexes, no behavior change.
- Medium: new constraints with validated backfill.
- High: constraint tightening, column rename/removal, or cross-table rewrites.

High risk migrations require:

- staged rollout plan,
- explicit rollback notes,
- contract re-validation (`contract-rag validate`) before merge.

## Acceptance Criteria

- Fresh environment can apply all migrations from zero.
- Existing environment can apply pending migrations without data loss.
- Seed still runs after migration set is applied.
