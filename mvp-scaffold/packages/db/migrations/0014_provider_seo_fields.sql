-- Migration: 0014_provider_seo_fields
-- Purpose: Add SEO meta fields for provider pages.
-- Forward
ALTER TABLE providers ADD COLUMN IF NOT EXISTS meta_title TEXT;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS meta_description TEXT;
-- Rollback: ALTER TABLE providers DROP COLUMN meta_title, DROP COLUMN meta_description;
