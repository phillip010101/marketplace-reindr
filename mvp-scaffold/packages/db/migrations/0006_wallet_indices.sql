-- Migration: 0006_wallet_indices
-- Purpose:
--   Add performance indices for wallet balance queries and billing lookups.
--
-- Rollback notes:
--   Additive. Rollback is dropping the created indices.
--
-- Forward
CREATE INDEX IF NOT EXISTS idx_wallet_provider_created
  ON wallet_transactions(provider_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_wallet_opportunity
  ON wallet_transactions(lead_opportunity_id)
  WHERE lead_opportunity_id IS NOT NULL;

-- Rollback (manual):
-- DROP INDEX IF EXISTS idx_wallet_provider_created;
-- DROP INDEX IF EXISTS idx_wallet_opportunity;
