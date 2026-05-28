-- Migration: 0009_plans_system
-- Purpose:
--   Add plans table and link providers to plans for monetization.
--   Free tier has limits on services, cities, and free leads.
--
-- Rollback notes:
--   Additive. Rollback drops the table and columns.
--
-- Forward
CREATE TABLE IF NOT EXISTS plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price_monthly INTEGER NOT NULL DEFAULT 0,
  price_yearly INTEGER NOT NULL DEFAULT 0,
  max_services INTEGER,
  max_cities INTEGER,
  max_leads_free INTEGER DEFAULT 10,
  custom_styles_allowed BOOLEAN NOT NULL DEFAULT false,
  custom_domain_allowed BOOLEAN NOT NULL DEFAULT false,
  remove_branding BOOLEAN NOT NULL DEFAULT false,
  priority_boost BOOLEAN NOT NULL DEFAULT false,
  verified_badge BOOLEAN NOT NULL DEFAULT false
);

INSERT INTO plans (id, name, price_monthly, price_yearly, max_services, max_cities, max_leads_free, custom_styles_allowed)
VALUES
  ('free', 'Gratuito', 0, 0, 3, 1, 10, false),
  ('pro_monthly', 'Pro Mensual', 49900, 0, NULL, NULL, NULL, true),
  ('pro_yearly', 'Pro Anual', 0, 499000, NULL, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;

UPDATE plans SET
  custom_domain_allowed = true, remove_branding = true, priority_boost = false, verified_badge = false
WHERE id = 'pro_monthly';

UPDATE plans SET
  custom_domain_allowed = true, remove_branding = true, priority_boost = true, verified_badge = true
WHERE id = 'pro_yearly';

ALTER TABLE providers ADD COLUMN IF NOT EXISTS plan_id TEXT DEFAULT 'free' REFERENCES plans(id);
ALTER TABLE providers ADD COLUMN IF NOT EXISTS custom_domain TEXT;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS domain_verified_at TIMESTAMPTZ;

-- Rollback (manual):
-- ALTER TABLE providers DROP COLUMN IF EXISTS domain_verified_at;
-- ALTER TABLE providers DROP COLUMN IF EXISTS custom_domain;
-- ALTER TABLE providers DROP COLUMN IF EXISTS plan_id;
-- DROP TABLE IF EXISTS plans;
