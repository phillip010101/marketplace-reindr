import fs from 'node:fs';
import path from 'node:path';
import { ensureDir } from './fs-utils';
import type { ContractChunkInput, ParsedContract } from './types';

export type LocalCache = {
  generatedAt: string;
  contracts: Array<{
    id: string;
    title: string;
    file: string;
    type: string;
    status: string;
    priority: string;
    summary?: string;
  }>;
  chunks: ContractChunkInput[];
};

export function localCachePath(repoRoot: string): string {
  return path.join(repoRoot, '.context', 'generated', 'contract-rag-cache.json');
}

export function writeLocalCache(repoRoot: string, contracts: ParsedContract[]): string {
  const out: LocalCache = {
    generatedAt: new Date().toISOString(),
    contracts: contracts.map((contract) => ({
      id: contract.frontmatter.id,
      title: contract.frontmatter.title,
      file: contract.filePath,
      type: contract.frontmatter.type,
      status: contract.frontmatter.status ?? 'active',
      priority: contract.frontmatter.priority ?? 'medium',
      summary: String(contract.frontmatter.summary ?? contract.body.slice(0, 180))
    })),
    chunks: contracts.flatMap((contract) => contract.chunks)
  };

  const filePath = localCachePath(repoRoot);
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(out, null, 2), 'utf8');
  return filePath;
}

export function readLocalCache(repoRoot: string): LocalCache | null {
  const filePath = localCachePath(repoRoot);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw) as LocalCache;
}
