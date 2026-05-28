-- Migration: 0008_provider_custom_styles
-- Purpose:
--   Add custom_styles JSONB column so providers can override template defaults.
--   Adds categories and customization support without breaking existing templates.
--
-- Rollback notes:
--   Additive. Rollback is dropping the column.
--
-- Forward
ALTER TABLE providers ADD COLUMN IF NOT EXISTS custom_styles JSONB DEFAULT '{}'::jsonb;

-- Rollback (manual):
-- ALTER TABLE providers DROP COLUMN IF EXISTS custom_styles;
