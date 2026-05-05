import { openDb } from '../lib/database';
import { createEmbeddingsProvider } from '../lib/embeddings';
import { loadContextPacks, loadContractsIndex, loadRelationsGraph } from '../lib/registry';
import { retrieveHybrid, retrieveHybridLocal } from '../lib/retriever';
import { readLocalCache } from '../lib/local-cache';

export async function runSearch(config: {
  repoRoot: string;
  registryDir: string;
  databaseUrl?: string;
  openAiApiKey?: string;
  embeddingModel: string;
  embeddingDimension: number;
  maxChunks: number;
  graphDepth: number;
}, query: string): Promise<void> {
  if (!query.trim()) {
    throw new Error('Search query is required');
  }

  const provider = createEmbeddingsProvider({
    openAiApiKey: config.openAiApiKey,
    model: config.embeddingModel,
    dimension: config.embeddingDimension
  });
  const embedding = await provider.embed(query);

  const index = loadContractsIndex(config.registryDir);
  const graph = loadRelationsGraph(config.registryDir);
  const packs = loadContextPacks(config.registryDir);
  let results;

  if (!config.databaseUrl) {
    const cache = readLocalCache(config.repoRoot);
    if (!cache) {
      throw new Error('No DATABASE_URL and no local cache found. Run `contract-rag index` first.');
    }
    results = await retrieveHybridLocal({
      task: query,
      contracts: cache.contracts,
      chunks: cache.chunks.map((chunk) => ({
        id: chunk.id,
        contractId: chunk.contractId,
        filePath: chunk.filePath,
        headingPath: chunk.headingPath,
        content: chunk.content
      })),
      relations: graph,
      contextPacks: packs,
      queryEmbedding: embedding,
      embedFn: (text) => provider.embed(text),
      maxChunks: config.maxChunks,
      graphDepth: config.graphDepth
    });
  } else {
    const db = await openDb(config.databaseUrl);
    try {
      results = await retrieveHybrid({
        db,
        task: query,
        contractIndex: index,
        relations: graph,
        contextPacks: packs,
        queryEmbedding: embedding,
        maxChunks: config.maxChunks,
        graphDepth: config.graphDepth
      });
    } finally {
      await db.close();
    }
  }

  if (results.length === 0) {
    console.log('No results found.');
    return;
  }

  const seenContracts = new Set<string>();
  for (const result of results) {
    if (!seenContracts.has(result.contractId)) {
      seenContracts.add(result.contractId);
      console.log(`\n[contract] ${result.contractId} (${result.title})`);
      const relationNotes = graph.relations
        .filter((relation) => relation.from === result.contractId || relation.to === result.contractId)
        .map((relation) => `${relation.from} --${relation.type}--> ${relation.to}${relation.reason ? ` (${relation.reason})` : ''}`);
      if (relationNotes.length > 0) {
        console.log('  relation notes:');
        for (const note of relationNotes) console.log(`  - ${note}`);
      }
    }
    console.log(`- ${result.filePath} :: ${result.headingPath} :: score=${result.score.toFixed(3)}`);
    const preview = result.content.replace(/\s+/g, ' ').slice(0, 180);
    console.log(`  ${preview}`);
  }
}
