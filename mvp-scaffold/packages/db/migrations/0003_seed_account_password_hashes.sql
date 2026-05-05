-- Migration: 0003_seed_account_password_hashes
-- Purpose:
--   Seed deterministic password hashes for MVP test accounts so JWT login can be exercised.
--
-- Credentials (dev/test):
--   admin@reindr.test -> Admin123!
--   provider accounts  -> Provider123!
--
-- Rollback notes:
--   Reversible by setting password_hash NULL for seeded emails.
--
-- Forward
UPDATE accounts
SET password_hash = 'scrypt$v1$reindr-admin-salt-v1$eg_bEmfirRtn-WA5vsXKBEeYY_YH2wm7Hwqjz5AWwX0'
WHERE email = 'admin@reindr.test'
  AND (password_hash IS NULL OR password_hash = '');

UPDATE accounts
SET password_hash = 'scrypt$v1$reindr-provider-salt-v1$qMWPvz0Yfcn67vMG6w_b67RY4bdVPqLX0g9BCuoBktM'
WHERE email IN ('cajas-acme@test.com', 'troqueles-norte@test.com', 'printlab@test.com')
  AND (password_hash IS NULL OR password_hash = '');

-- Rollback (manual):
-- UPDATE accounts SET password_hash = NULL
-- WHERE email IN (
--   'admin@reindr.test',
--   'cajas-acme@test.com',
--   'troqueles-norte@test.com',
--   'printlab@test.com'
-- );
