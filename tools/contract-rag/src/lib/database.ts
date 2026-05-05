import fs from 'node:fs';
import path from 'node:path';
import { Client } from 'pg';
import type { ContractChunkInput, ParsedContract } from './types';

export type Db = {
  client: Client;
  close: () => Promise<void>;
};

export type ChunkRow = {
  id: string;
  contract_id: string;
  file_path: string;
  heading_path: string;
  content: string;
  content_hash: string;
  token_count: number;
  metadata: Record<string, unknown>;
};

export async function openDb(databaseUrl?: string): Promise<Db> {
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required for migrate/index/search/context commands');
  }

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  return {
    client,
    close: async () => client.end()
  };
}

export async function runMigrations(db: Db, migrationsDir: string): Promise<string[]> {
  await db.client.query(`
    CREATE TABLE IF NOT EXISTS contract_rag_migrations (
      id TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  const files = fs.readdirSync(migrationsDir).filter((name) => name.endsWith('.sql')).sort();
  const applied: string[] = [];
  for (const file of files) {
    const id = path.basename(file, '.sql');
    const already = await db.client.query('SELECT 1 FROM contract_rag_migrations WHERE id = $1', [id]);
    if (already.rowCount && already.rowCount > 0) continue;

    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    await db.client.query('BEGIN');
    try {
      await db.client.query(sql);
      await db.client.query('INSERT INTO contract_rag_migrations(id) VALUES ($1)', [id]);
      await db.client.query('COMMIT');
      applied.push(file);
    } catch (error) {
      await db.client.query('ROLLBACK');
      throw error;
    }
  }

  return applied;
}

export async function upsertContractDocument(db: Db, contract: ParsedContract): Promise<void> {
  const fm = contract.frontmatter;
  await db.client.query(
    `
      INSERT INTO contract_documents (
        id, title, type, status, priority, version, file_path, content_hash,
        summary_short, summary_long, metadata, created_at, updated_at
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11, now(), now())
      ON CONFLICT (id)
      DO UPDATE SET
        title = EXCLUDED.title,
        type = EXCLUDED.type,
        status = EXCLUDED.status,
        priority = EXCLUDED.priority,
        version = EXCLUDED.version,
        file_path = EXCLUDED.file_path,
        content_hash = EXCLUDED.content_hash,
        summary_short = EXCLUDED.summary_short,
        summary_long = EXCLUDED.summary_long,
        metadata = EXCLUDED.metadata,
        updated_at = now()
    `,
    [
      fm.id,
      fm.title,
      fm.type,
      fm.status ?? 'active',
      fm.priority ?? 'medium',
      fm.version ?? null,
      contract.filePath,
      contract.contentHash,
      contract.headings[0] ?? '',
      contract.body.slice(0, 1200),
      JSON.stringify({
        applies_to: fm.applies_to ?? [],
        depends_on: fm.depends_on ?? [],
        related: fm.related ?? [],
        agent_read_policy: fm.agent_read_policy ?? null
      })
    ]
  );
}

export async function loadChunkHashesByContract(db: Db, contractId: string): Promise<Map<string, string>> {
  const result = await db.client.query<{ id: string; content_hash: string }>(
    'SELECT id, content_hash FROM contract_chunks WHERE contract_id = $1',
    [contractId]
  );
  const map = new Map<string, string>();
  for (const row of result.rows) {
    map.set(row.id, row.content_hash);
  }
  return map;
}

export async function upsertChunk(
  db: Db,
  chunk: ContractChunkInput,
  embedding: number[] | null
): Promise<void> {
  const embeddingValue = embedding ? `[${embedding.join(',')}]` : null;
  await db.client.query(
    `
      INSERT INTO contract_chunks (
        id, contract_id, file_path, heading_path, content, content_hash,
        token_count, importance, metadata, embedding, created_at, updated_at
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,
        CASE WHEN $10::text IS NULL THEN NULL ELSE $10::vector END,
        now(), now()
      )
      ON CONFLICT (id)
      DO UPDATE SET
        contract_id = EXCLUDED.contract_id,
        file_path = EXCLUDED.file_path,
        heading_path = EXCLUDED.heading_path,
        content = EXCLUDED.content,
        content_hash = EXCLUDED.content_hash,
        token_count = EXCLUDED.token_count,
        importance = EXCLUDED.importance,
        metadata = EXCLUDED.metadata,
        embedding = CASE
          WHEN $10::text IS NULL THEN contract_chunks.embedding
          ELSE $10::vector
        END,
        updated_at = now()
    `,
    [
      chunk.id,
      chunk.contractId,
      chunk.filePath,
      chunk.headingPath,
      chunk.content,
      chunk.contentHash,
      chunk.tokenCount,
      chunk.importance,
      JSON.stringify(chunk.metadata),
      embeddingValue
    ]
  );
}

export async function pruneMissingChunks(db: Db, contractId: string, existingChunkIds: string[]): Promise<void> {
  if (existingChunkIds.length === 0) {
    await db.client.query('DELETE FROM contract_chunks WHERE contract_id = $1', [contractId]);
    return;
  }
  await db.client.query(
    'DELETE FROM contract_chunks WHERE contract_id = $1 AND NOT (id = ANY($2::text[]))',
    [contractId, existingChunkIds]
  );
}

export async function replaceRelations(
  db: Db,
  relations: Array<{ id: string; from: string; to: string; type: string; reason?: string }>
): Promise<void> {
  await db.client.query('DELETE FROM contract_relations');
  for (const relation of relations) {
    await db.client.query(
      `
      INSERT INTO contract_relations (
        id, from_contract_id, to_contract_id, relation_type, reason, metadata, created_at
      ) VALUES ($1,$2,$3,$4,$5,'{}'::jsonb, now())
      `,
      [relation.id, relation.from, relation.to, relation.type, relation.reason ?? null]
    );
  }
}

export async function fetchAllDocuments(db: Db): Promise<Array<{ id: string; title: string; file_path: string; priority: string; status: string }>> {
  const result = await db.client.query(
    'SELECT id, title, file_path, priority, status FROM contract_documents ORDER BY id'
  );
  return result.rows;
}

export async function fetchAllChunks(db: Db): Promise<ChunkRow[]> {
  const result = await db.client.query<ChunkRow>(
    'SELECT id, contract_id, file_path, heading_path, content, content_hash, token_count, metadata FROM contract_chunks'
  );
  return result.rows;
}

export async function vectorSearch(
  db: Db,
  queryEmbedding: number[],
  limit: number
): Promise<Array<ChunkRow & { vector_score: number }>> {
  const embeddingText = `[${queryEmbedding.join(',')}]`;
  const result = await db.client.query<ChunkRow & { vector_score: number }>(
    `
      SELECT
        id, contract_id, file_path, heading_path, content, content_hash, token_count, metadata,
        1 - (embedding <=> $1::vector) AS vector_score
      FROM contract_chunks
      WHERE embedding IS NOT NULL
      ORDER BY embedding <=> $1::vector
      LIMIT $2
    `,
    [embeddingText, limit]
  );
  return result.rows;
}

export async function keywordSearch(db: Db, keywords: string[], limit: number): Promise<Array<ChunkRow & { keyword_score: number }>> {
  if (keywords.length === 0) return [];
  const rows = await fetchAllChunks(db);
  const scored = rows
    .map((row) => {
      const haystack = `${row.heading_path}\n${row.content}`.toLowerCase();
      let hits = 0;
      for (const kw of keywords) {
        if (!kw) continue;
        if (haystack.includes(kw)) hits += 1;
      }
      return { ...row, keyword_score: hits / Math.max(1, keywords.length) };
    })
    .filter((row) => row.keyword_score > 0)
    .sort((a, b) => b.keyword_score - a.keyword_score)
    .slice(0, limit);

  return scored;
}

export async function logContextQuery(
  db: Db,
  row: {
    id: string;
    task: string;
    generatedContext: string;
    usedContractIds: string[];
    usedChunkIds: string[];
    tokenBudget: number;
    tokenCount: number;
  }
): Promise<void> {
  await db.client.query(
    `
      INSERT INTO contract_context_queries (
        id, task, generated_context, used_contract_ids, used_chunk_ids,
        token_budget, token_count, metadata, created_at
      )
      VALUES ($1,$2,$3,$4::text[],$5::text[],$6,$7,'{}'::jsonb, now())
    `,
    [
      row.id,
      row.task,
      row.generatedContext,
      row.usedContractIds,
      row.usedChunkIds,
      row.tokenBudget,
      row.tokenCount
    ]
  );
}
