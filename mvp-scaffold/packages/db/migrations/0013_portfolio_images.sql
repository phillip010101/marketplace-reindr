-- Migration: 0013_portfolio_images
-- Purpose:
--   Add portfolio image support for provider profiles.
--
-- Rollback notes:
--   Additive. Rollback drops the table.
--
-- Forward
CREATE TABLE IF NOT EXISTS portfolio_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  caption TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_portfolio_provider ON portfolio_images(provider_id, sort_order);

-- Rollback (manual):
-- DROP TABLE IF EXISTS portfolio_images;
