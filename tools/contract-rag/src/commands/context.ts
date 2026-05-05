import fs from 'node:fs';
import path from 'node:path';
import { openDb, logContextQuery } from '../lib/database';
import { createEmbeddingsProvider } from '../lib/embeddings';
import { buildContextBundle, renderContextBundle, writeContextBundle } from '../lib/context-builder';
import { stableId } from '../lib/hash';
import { readLocalCache } from '../lib/local-cache';
import { loadContextPacks, loadContractsIndex, loadRelationsGraph } from '../lib/registry';
import { retrieveHybrid, retrieveHybridLocal } from '../lib/retriever';

export async function runContext(
  config: {
    repoRoot: string;
    registryDir: string;
    contextGeneratedDir: string;
    databaseUrl?: string;
    openAiApiKey?: string;
    embeddingModel: string;
    embeddingDimension: number;
    contextBudget: number;
    maxChunks: number;
    graphDepth: number;
  },
  task: string,
  options: {
    budget?: number;
    pack?: string;
    module?: string;
    json?: boolean;
    full?: boolean;
  }
): Promise<void> {
  if (!task.trim()) throw new Error('Task is required');
  const budget = options.budget ?? config.contextBudget;
  const provider = createEmbeddingsProvider({
    openAiApiKey: config.openAiApiKey,
    model: config.embeddingModel,
    dimension: config.embeddingDimension
  });
  const embedding = await provider.embed(task);

  const index = loadContractsIndex(config.registryDir);
  const graph = loadRelationsGraph(config.registryDir);
  const packs = loadContextPacks(config.registryDir);
  const globalRulesPath = path.join(config.registryDir, 'global.rules.md');
  const decisionLogPath = path.join(config.registryDir, 'decision-log.md');
  const globalRulesRaw = fs.existsSync(globalRulesPath) ? fs.readFileSync(globalRulesPath, 'utf8') : '';
  const decisionLogRaw = fs.existsSync(decisionLogPath) ? fs.readFileSync(decisionLogPath, 'utf8') : '';
  const rewrittenTask = options.module ? `${task} module:${options.module}` : task;
  const selectedPack = options.pack ?? packs.packs.find((pack) => options.module && pack.id.includes(options.module))?.id;
  const selectedPackRequiredContracts =
    packs.packs.find((pack) => pack.id === selectedPack)?.required_contracts ?? [];

  let searchResults;
  if (!config.databaseUrl) {
    const cache = readLocalCache(config.repoRoot);
    if (!cache) {
      throw new Error('No DATABASE_URL and no local cache found. Run `contract-rag index` first.');
    }
    searchResults = await retrieveHybridLocal({
      task: rewrittenTask,
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
      graphDepth: config.graphDepth,
      preferredContractIds: selectedPackRequiredContracts
    });
  } else {
    const db = await openDb(config.databaseUrl);
    try {
      searchResults = await retrieveHybrid({
        db,
        task: rewrittenTask,
        contractIndex: index,
        relations: graph,
        contextPacks: packs,
        queryEmbedding: embedding,
        maxChunks: config.maxChunks,
        graphDepth: config.graphDepth,
        preferredContractIds: selectedPackRequiredContracts
      });
    } finally {
      await db.close();
    }
  }

  const bundle = buildContextBundle({
    task,
    searchResults: options.full ? searchResults : searchResults,
    relations: graph,
    contextPacks: packs,
    contractSummaries: new Map(index.contracts.map((item) => [item.id, item.summary ?? ''])),
    globalRulesRaw,
    decisionLogRaw,
    budget,
    selectedPackId: selectedPack
  });

  const markdown = renderContextBundle(bundle, { full: options.full });
  const contextPath = path.join(config.contextGeneratedDir, 'current-context.md');
  writeContextBundle(contextPath, markdown);

  if (config.databaseUrl) {
    const db = await openDb(config.databaseUrl);
    try {
      await logContextQuery(db, {
        id: stableId([task, String(Date.now())]),
        task,
        generatedContext: markdown,
        usedContractIds: bundle.usedContractIds,
        usedChunkIds: bundle.usedChunkIds,
        tokenBudget: bundle.tokenBudget,
        tokenCount: bundle.tokenCount
      });
    } finally {
      await db.close();
    }
  }

  if (options.json) {
    console.log(JSON.stringify(bundle, null, 2));
  } else {
    console.log(`Context bundle written: ${contextPath}`);
    console.log(`Confidence: ${bundle.confidence}`);
    console.log(`Used contracts: ${bundle.usedContractIds.join(', ') || 'none'}`);
    console.log(`Token estimate: ${bundle.tokenCount}/${bundle.tokenBudget}`);
    if (!config.databaseUrl) {
      console.log('Mode: local-cache (DATABASE_URL not set)');
    }
  }
}
