-- Migration: 0007_provider_social_media
-- Purpose:
--   Add social media fields to provider profiles for richer public pages.
--
-- Rollback notes:
--   Additive. Rollback is dropping the added columns.
--
-- Forward
ALTER TABLE providers ADD COLUMN IF NOT EXISTS instagram TEXT;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS facebook TEXT;

-- Rollback (manual):
-- ALTER TABLE providers DROP COLUMN IF EXISTS instagram;
-- ALTER TABLE providers DROP COLUMN IF EXISTS facebook;
