CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS contract_documents (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  priority TEXT NOT NULL DEFAULT 'medium',
  version TEXT,
  file_path TEXT NOT NULL UNIQUE,
  content_hash TEXT NOT NULL,
  summary_short TEXT,
  summary_long TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS contract_chunks (
  id TEXT PRIMARY KEY,
  contract_id TEXT NOT NULL REFERENCES contract_documents(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  heading_path TEXT NOT NULL,
  content TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  token_count INTEGER NOT NULL DEFAULT 0,
  importance TEXT NOT NULL DEFAULT 'normal',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  embedding vector(1536),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS contract_relations (
  id TEXT PRIMARY KEY,
  from_contract_id TEXT NOT NULL,
  to_contract_id TEXT NOT NULL,
  relation_type TEXT NOT NULL,
  reason TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS contract_context_queries (
  id TEXT PRIMARY KEY,
  task TEXT NOT NULL,
  generated_context TEXT NOT NULL,
  used_contract_ids TEXT[] NOT NULL DEFAULT '{}',
  used_chunk_ids TEXT[] NOT NULL DEFAULT '{}',
  token_budget INTEGER NOT NULL,
  token_count INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contract_chunks_contract_id
ON contract_chunks(contract_id);

CREATE INDEX IF NOT EXISTS idx_contract_chunks_metadata
ON contract_chunks USING GIN(metadata);

CREATE INDEX IF NOT EXISTS idx_contract_documents_metadata
ON contract_documents USING GIN(metadata);
