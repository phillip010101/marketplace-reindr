-- Migration: 0002_admin_events_audit
-- Purpose:
--   Persist auditable admin actions in DB-backed flows.
--   Covers review moderation and services CRUD events.
--
-- Rollback notes:
--   This migration is additive.
--   Rollback is dropping the created index and table.
--
-- Forward
CREATE TABLE IF NOT EXISTS admin_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type TEXT NOT NULL,
  actor_account_id TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_events_created_at
  ON admin_events(created_at DESC);

-- Rollback (manual):
-- DROP INDEX IF EXISTS idx_admin_events_created_at;
-- DROP TABLE IF EXISTS admin_events;
