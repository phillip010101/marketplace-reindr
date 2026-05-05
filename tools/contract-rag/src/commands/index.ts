import { createEmbeddingsProvider } from '../lib/embeddings';
import { loadContracts } from '../lib/contracts-loader';
import { stableId } from '../lib/hash';
import { openDb, pruneMissingChunks, replaceRelations, upsertChunk, upsertContractDocument, loadChunkHashesByContract } from '../lib/database';
import { loadRelationsGraph, saveContractsIndex, saveRelationsGraph } from '../lib/registry';
import { writeLocalCache } from '../lib/local-cache';
import type { ContractIndexEntry, ParsedContract, RelationsGraph } from '../lib/types';

function buildIndexEntries(contracts: ParsedContract[]): ContractIndexEntry[] {
  return contracts.map((contract) => {
    const fm = contract.frontmatter;
    return {
      id: fm.id,
      file: contract.filePath,
      title: fm.title,
      type: fm.type,
      status: fm.status ?? 'active',
      priority: fm.priority ?? 'medium',
      version: fm.version ?? '',
      summary: String(fm.summary ?? contract.body.split('\n').slice(0, 2).join(' ').slice(0, 180)),
      applies_to: fm.applies_to ?? [],
      depends_on: fm.depends_on ?? [],
      related: fm.related ?? [],
      agent_read_policy: fm.agent_read_policy ?? 'when_related'
    };
  });
}

function deriveRelationsFromFrontmatter(contracts: ParsedContract[]): RelationsGraph {
  const relations: RelationsGraph['relations'] = [];
  for (const contract of contracts) {
    const from = contract.frontmatter.id;
    for (const to of contract.frontmatter.depends_on ?? []) {
      relations.push({
        from,
        to,
        type: 'depends_on',
        reason: 'Derived from frontmatter depends_on'
      });
    }
    for (const to of contract.frontmatter.related ?? []) {
      relations.push({
        from,
        to,
        type: 'related',
        reason: 'Derived from frontmatter related'
      });
    }
  }
  return { relations };
}

function mergeRelations(existing: RelationsGraph, derived: RelationsGraph): RelationsGraph {
  const byKey = new Map<string, { from: string; to: string; type: string; reason?: string }>();
  for (const item of existing.relations) {
    byKey.set(`${item.from}|${item.to}|${item.type}`, item);
  }
  for (const item of derived.relations) {
    const key = `${item.from}|${item.to}|${item.type}`;
    if (!byKey.has(key)) byKey.set(key, item);
  }
  return { relations: Array.from(byKey.values()) };
}

export function isChunkChanged(existingHashes: Map<string, string>, chunkId: string, contentHash: string): boolean {
  return existingHashes.get(chunkId) !== contentHash;
}

export async function runIndex(config: {
  repoRoot: string;
  contractsDir: string;
  registryDir: string;
  databaseUrl?: string;
  openAiApiKey?: string;
  embeddingModel: string;
  embeddingDimension: number;
}): Promise<void> {
  const contracts = loadContracts(config.contractsDir, config.repoRoot);
  if (contracts.length === 0) {
    throw new Error('No contracts with valid frontmatter were found to index.');
  }

  const indexEntries = buildIndexEntries(contracts);
  saveContractsIndex(config.registryDir, { contracts: indexEntries });

  const existingGraph = loadRelationsGraph(config.registryDir);
  const derivedGraph = deriveRelationsFromFrontmatter(contracts);
  const mergedGraph = mergeRelations(existingGraph, derivedGraph);
  saveRelationsGraph(config.registryDir, mergedGraph);

  const provider = createEmbeddingsProvider({
    openAiApiKey: config.openAiApiKey,
    model: config.embeddingModel,
    dimension: config.embeddingDimension
  });

  if (!provider.available) {
    console.warn('Embeddings API key not found. Using local hash embeddings fallback.');
  }

  if (!config.databaseUrl) {
    const cachePath = writeLocalCache(config.repoRoot, contracts);
    console.warn(`DATABASE_URL not set. Indexed in local-cache mode only: ${cachePath}`);
    return;
  }

  const db = await openDb(config.databaseUrl);
  try {
    for (const contract of contracts) {
      await upsertContractDocument(db, contract);

      const existingHashes = await loadChunkHashesByContract(db, contract.frontmatter.id);
      const currentIds: string[] = [];
      let changedCount = 0;
      let unchangedCount = 0;

      for (const chunk of contract.chunks) {
        currentIds.push(chunk.id);
        const changed = isChunkChanged(existingHashes, chunk.id, chunk.contentHash);
        let embedding: number[] | null = null;
        if (changed) {
          embedding = await provider.embed(`${chunk.headingPath}\n${chunk.content}`);
          changedCount += 1;
        } else {
          unchangedCount += 1;
        }
        await upsertChunk(db, chunk, embedding);
      }

      await pruneMissingChunks(db, contract.frontmatter.id, currentIds);
      console.log(`Indexed ${contract.frontmatter.id}: ${changedCount} changed chunks, ${unchangedCount} unchanged chunks`);
    }

    const dbRelations = mergedGraph.relations.map((relation) => ({
      id: stableId([relation.from, relation.to, relation.type]),
      from: relation.from,
      to: relation.to,
      type: relation.type,
      reason: relation.reason
    }));
    await replaceRelations(db, dbRelations);
  } finally {
    await db.close();
  }
}
