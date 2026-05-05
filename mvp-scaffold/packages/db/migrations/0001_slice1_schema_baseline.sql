-- Migration: 0001_slice1_schema_baseline
-- Purpose:
--   Batch 1 baseline for S1-LEAD-COMPUESTO-CORE.
--   Align ownership-safe lookup and dedup/traceability indexes.
--
-- Rollback notes:
--   This migration is additive (indexes only). Rollback is dropping added indexes.
--   No table/column drop is performed in forward path.
--
-- Forward
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Ownership lookup and one-provider-per-account invariant (when account is linked).
CREATE UNIQUE INDEX IF NOT EXISTS uq_providers_account_id_not_null
  ON providers(account_id)
  WHERE account_id IS NOT NULL;

-- Prevent duplicate opportunity rows for same lead/provider/service.
CREATE UNIQUE INDEX IF NOT EXISTS uq_lead_opportunities_lead_provider_service
  ON lead_opportunities(lead_id, provider_id, service_id);

-- Query and dedup support for lead assignment and anti-duplicate checks.
CREATE INDEX IF NOT EXISTS idx_leads_dedup_lookup
  ON leads(client_email, client_phone, city_id, primary_service_id, created_at DESC);

-- Fast lookup of requested services and event timeline per lead/opportunity.
CREATE INDEX IF NOT EXISTS idx_lead_requested_services_lead_primary
  ON lead_requested_services(lead_id, is_primary);

CREATE INDEX IF NOT EXISTS idx_lead_events_lead_created
  ON lead_events(lead_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_lead_events_opportunity_created
  ON lead_events(opportunity_id, created_at DESC);

-- Rollback (manual):
-- DROP INDEX IF EXISTS idx_lead_events_opportunity_created;
-- DROP INDEX IF EXISTS idx_lead_events_lead_created;
-- DROP INDEX IF EXISTS idx_lead_requested_services_lead_primary;
-- DROP INDEX IF EXISTS idx_leads_dedup_lookup;
-- DROP INDEX IF EXISTS uq_lead_opportunities_lead_provider_service;
-- DROP INDEX IF EXISTS uq_providers_account_id_not_null;
