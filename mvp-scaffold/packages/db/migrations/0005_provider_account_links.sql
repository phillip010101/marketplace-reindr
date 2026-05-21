-- Migration: 0005_provider_account_links
-- Purpose:
--   Link seeded provider accounts with seeded providers so provider panel endpoints work on VPS.
--
-- Forward
UPDATE providers p
SET account_id = a.id
FROM accounts a
WHERE p.slug = 'cajas-acme'
  AND a.email = 'cajas-acme@test.com'
  AND a.role = 'provider'
  AND p.account_id IS NULL;

UPDATE providers p
SET account_id = a.id
FROM accounts a
WHERE p.slug = 'troqueles-norte'
  AND a.email = 'troqueles-norte@test.com'
  AND a.role = 'provider'
  AND p.account_id IS NULL;

UPDATE providers p
SET account_id = a.id
FROM accounts a
WHERE p.slug = 'printlab-bogota'
  AND a.email = 'printlab@test.com'
  AND a.role = 'provider'
  AND p.account_id IS NULL;

-- Rollback (manual):
-- UPDATE providers
-- SET account_id = NULL
-- WHERE slug IN ('cajas-acme', 'troqueles-norte', 'printlab-bogota');
