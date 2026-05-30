-- Migration: 0011_posts_table
-- Purpose:
--   Move blog posts from Astro content collections to DB.
--   Enables full CMS editing from admin without code deployment.
--
-- Rollback notes:
--   Additive. Existing .md files remain as backup. Rollback drops the table.
--
-- Forward
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  tags TEXT[] DEFAULT '{}',
  city TEXT,
  service TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Rollback (manual):
-- DROP TABLE IF EXISTS posts;
