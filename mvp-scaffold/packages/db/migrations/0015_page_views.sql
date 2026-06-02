-- Migration: 0015_page_views
-- Purpose: Track page views on provider profiles for analytics.
-- Rollback notes: Additive. Rollback drops the table.
CREATE TABLE IF NOT EXISTS page_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_page_views_provider_date ON page_views(provider_id, viewed_at);
