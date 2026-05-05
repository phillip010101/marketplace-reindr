-- Migration: 0004_provider_template_id
-- Purpose:
--   Add provider-level UI template selector persistence.
--   Keeps provider public profile skin configurable without duplicating style logic in frontend.

ALTER TABLE providers
  ADD COLUMN IF NOT EXISTS template_id TEXT;

UPDATE providers
SET template_id = CASE slug
  WHEN 'cajas-acme' THEN 'craft-paper'
  WHEN 'troqueles-norte' THEN 'urban-ink'
  WHEN 'printlab-bogota' THEN 'clean-lab'
  ELSE COALESCE(template_id, 'executive-grid')
END
WHERE template_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_providers_template_id
  ON providers(template_id);
