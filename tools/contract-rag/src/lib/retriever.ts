import { fetchAllDocuments, keywordSearch, vectorSearch, type Db } from './database';
import { queryKeywords } from './query';
import type { ContextPacksFile, RelationsGraph, SearchResult } from './types';

type RetrieveInput = {
  db: Db;
  task: string;
  contractIndex: { contracts: Array<{ id: string; title: string; file: string; priority: string; status: string }> };
  relations: RelationsGraph;
  contextPacks: ContextPacksFile;
  queryEmbedding?: number[];
  maxChunks: number;
  graphDepth: number;
  preferredContractIds?: string[];
};

function priorityBoost(priority: string): number {
  switch (priority) {
    case 'critical':
      return 0.3;
    case 'high':
      return 0.2;
    case 'medium':
      return 0.1;
    default:
      return 0;
  }
}

function statusBoost(status: string): number {
  return status === 'active' ? 0.12 : 0;
}

function preferredContractBoost(contractId: string, preferredContractIds?: string[]): number {
  return preferredContractIds?.includes(contractId) ? 0.35 : 0;
}

function prioritizePreferredCoverage(
  results: SearchResult[],
  preferredContractIds: string[] | undefined,
  maxChunks: number
): SearchResult[] {
  const sorted = [...results].sort((a, b) => b.score - a.score);
  if (!preferredContractIds || preferredContractIds.length === 0) {
    return sorted.slice(0, maxChunks);
  }

  const selected: SearchResult[] = [];
  const seenChunkIds = new Set<string>();
  for (const contractId of preferredContractIds) {
    const match = sorted.find((item) => item.contractId === contractId && !seenChunkIds.has(item.chunkId));
    if (!match) continue;
    selected.push(match);
    seenChunkIds.add(match.chunkId);
  }

  for (const item of sorted) {
    if (selected.length >= maxChunks) break;
    if (seenChunkIds.has(item.chunkId)) continue;
    selected.push(item);
    seenChunkIds.add(item.chunkId);
  }

  return selected.sort((a, b) => b.score - a.score).slice(0, maxChunks);
}

function expandGraph(ids: Set<string>, graph: RelationsGraph, depth: number): Set<string> {
  const out = new Set(ids);
  let frontier = new Set(ids);
  for (let d = 0; d < depth; d += 1) {
    const next = new Set<string>();
    for (const relation of graph.relations) {
      if (frontier.has(relation.from) && !out.has(relation.to)) {
        out.add(relation.to);
        next.add(relation.to);
      }
      if (frontier.has(relation.to) && !out.has(relation.from)) {
        out.add(relation.from);
        next.add(relation.from);
      }
    }
    frontier = next;
    if (frontier.size === 0) break;
  }
  return out;
}

export async function retrieveHybrid(input: RetrieveInput): Promise<SearchResult[]> {
  const keywords = queryKeywords(input.task);
  const docs = await fetchAllDocuments(input.db);
  const docMap = new Map(docs.map((doc) => [doc.id, doc]));

  const metadataHits = new Set<string>();
  for (const contract of input.contractIndex.contracts) {
    const haystack = `${contract.id} ${contract.title} ${contract.file}`.toLowerCase();
    if (keywords.some((keyword) => haystack.includes(keyword))) {
      metadataHits.add(contract.id);
    }
  }

  for (const pack of input.contextPacks.packs) {
    const haystack = `${pack.id} ${pack.title} ${pack.description ?? ''}`.toLowerCase();
    if (keywords.some((keyword) => haystack.includes(keyword))) {
      for (const id of pack.required_contracts) metadataHits.add(id);
      for (const id of pack.optional_contracts ?? []) metadataHits.add(id);
    }
  }

  const boostedByGraph = expandGraph(metadataHits, input.relations, input.graphDepth);

  const keywordRows = await keywordSearch(input.db, keywords, input.maxChunks * 3);
  const vectorRows = input.queryEmbedding
    ? await vectorSearch(input.db, input.queryEmbedding, input.maxChunks * 3)
    : [];

  type ScoreCarrier = SearchResult & { _vectorScore: number; _keywordScore: number };
  const merged = new Map<string, ScoreCarrier>();

  // Score is intentionally transparent. We combine vector + keyword + deterministic boosts.
  const ingest = (
    sourceRows: Array<{ id: string; contract_id: string; file_path: string; heading_path: string; content: string; vector_score?: number; keyword_score?: number }>,
    source: 'vector' | 'keyword'
  ) => {
    for (const row of sourceRows) {
      const existing = merged.get(row.id);
      const vectorScore = source === 'vector' ? (row.vector_score ?? 0) : (existing?._vectorScore ?? 0);
      const keywordScore = source === 'keyword' ? (row.keyword_score ?? 0) : (existing?._keywordScore ?? 0);

      const doc = docMap.get(row.contract_id);
      const metadataScore = metadataHits.has(row.contract_id) ? 0.25 : 0;
      const relationScore = boostedByGraph.has(row.contract_id) ? 0.15 : 0;
      const pBoost = priorityBoost(doc?.priority ?? 'medium');
      const sBoost = statusBoost(doc?.status ?? 'active');
      const preferredBoost = preferredContractBoost(row.contract_id, input.preferredContractIds);
      const score = vectorScore + keywordScore + metadataScore + relationScore + pBoost + sBoost + preferredBoost;
      const scoreBreakdown = {
        vectorScore,
        keywordScore,
        metadataBoost: metadataScore,
        relationBoost: relationScore,
        priorityBoost: pBoost,
        statusBoost: sBoost,
        preferredBoost
      };

      merged.set(row.id, {
        contractId: row.contract_id,
        filePath: row.file_path,
        title: doc?.title ?? row.contract_id,
        headingPath: row.heading_path,
        chunkId: row.id,
        content: row.content,
        score,
        scoreBreakdown,
        _vectorScore: vectorScore,
        _keywordScore: keywordScore
      });
    }
  };

  ingest(vectorRows, 'vector');
  ingest(keywordRows, 'keyword');

  const topResults = prioritizePreferredCoverage(
    Array.from(merged.values()).map((row) => ({
      contractId: row.contractId,
      filePath: row.filePath,
      title: row.title,
      headingPath: row.headingPath,
      chunkId: row.chunkId,
      content: row.content,
      score: row.score,
      scoreBreakdown: row.scoreBreakdown
    })),
    input.preferredContractIds,
    input.maxChunks
  );

  return topResults;
}

export async function retrieveHybridLocal(input: {
  task: string;
  contracts: Array<{ id: string; title: string; file: string; priority: string; status: string }>;
  chunks: Array<{ id: string; contractId: string; filePath: string; headingPath: string; content: string }>;
  relations: RelationsGraph;
  contextPacks: ContextPacksFile;
  queryEmbedding?: number[];
  embedFn?: (text: string) => Promise<number[]>;
  maxChunks: number;
  graphDepth: number;
  preferredContractIds?: string[];
}): Promise<SearchResult[]> {
  const keywords = queryKeywords(input.task);
  const docMap = new Map(input.contracts.map((doc) => [doc.id, doc]));

  const metadataHits = new Set<string>();
  for (const contract of input.contracts) {
    const haystack = `${contract.id} ${contract.title} ${contract.file}`.toLowerCase();
    if (keywords.some((keyword) => haystack.includes(keyword))) metadataHits.add(contract.id);
  }
  for (const pack of input.contextPacks.packs) {
    const haystack = `${pack.id} ${pack.title} ${pack.description ?? ''}`.toLowerCase();
    if (keywords.some((keyword) => haystack.includes(keyword))) {
      for (const id of pack.required_contracts) metadataHits.add(id);
      for (const id of pack.optional_contracts ?? []) metadataHits.add(id);
    }
  }

  const boostedByGraph = expandGraph(metadataHits, input.relations, input.graphDepth);
  const queryVector = input.queryEmbedding ?? (input.embedFn ? await input.embedFn(input.task) : undefined);

  const results: SearchResult[] = [];
  for (const chunk of input.chunks) {
    const lower = `${chunk.headingPath}\n${chunk.content}`.toLowerCase();
    let keywordScore = 0;
    for (const kw of keywords) {
      if (lower.includes(kw)) keywordScore += 1;
    }
    keywordScore = keywords.length > 0 ? keywordScore / keywords.length : 0;

    let vectorScore = 0;
    if (queryVector && input.embedFn) {
      const chunkVector = await input.embedFn(`${chunk.headingPath}\n${chunk.content}`);
      let dot = 0;
      for (let i = 0; i < Math.min(queryVector.length, chunkVector.length); i += 1) {
        dot += queryVector[i] * chunkVector[i];
      }
      vectorScore = dot;
    }

    const doc = docMap.get(chunk.contractId);
    const metadataBoost = metadataHits.has(chunk.contractId) ? 0.25 : 0;
    const relationBoost = boostedByGraph.has(chunk.contractId) ? 0.15 : 0;
    const pBoost = priorityBoost(doc?.priority ?? 'medium');
    const sBoost = statusBoost(doc?.status ?? 'active');
    const preferredBoost = preferredContractBoost(chunk.contractId, input.preferredContractIds);
    const score = vectorScore + keywordScore + metadataBoost + relationBoost + pBoost + sBoost + preferredBoost;

    if (score <= 0) continue;
    results.push({
      contractId: chunk.contractId,
      filePath: chunk.filePath,
      title: doc?.title ?? chunk.contractId,
      headingPath: chunk.headingPath,
      chunkId: chunk.id,
      content: chunk.content,
      score,
      scoreBreakdown: {
        vectorScore,
        keywordScore,
        metadataBoost,
        relationBoost,
        priorityBoost: pBoost,
        statusBoost: sBoost,
        preferredBoost
      }
    });
  }

  return prioritizePreferredCoverage(results, input.preferredContractIds, input.maxChunks);
}
