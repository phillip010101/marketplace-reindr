import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import { ensureDir, writeFile } from './fs-utils';
import type { ContractIndexEntry, ContextPacksFile, RelationsGraph } from './types';

export function loadYamlFile<T>(filePath: string, fallback: T): T {
  if (!fs.existsSync(filePath)) return fallback;
  const raw = fs.readFileSync(filePath, 'utf8');
  const parsed = YAML.parse(raw);
  if (!parsed) return fallback;
  return parsed as T;
}

export function saveYamlFile(filePath: string, data: unknown): void {
  ensureDir(path.dirname(filePath));
  writeFile(filePath, YAML.stringify(data));
}

export function loadContractsIndex(registryDir: string): { contracts: ContractIndexEntry[] } {
  return loadYamlFile(path.join(registryDir, 'contracts.index.yml'), { contracts: [] });
}

export function saveContractsIndex(registryDir: string, index: { contracts: ContractIndexEntry[] }): void {
  saveYamlFile(path.join(registryDir, 'contracts.index.yml'), index);
}

export function loadRelationsGraph(registryDir: string): RelationsGraph {
  return loadYamlFile(path.join(registryDir, 'relations.graph.yml'), { relations: [] });
}

export function saveRelationsGraph(registryDir: string, graph: RelationsGraph): void {
  saveYamlFile(path.join(registryDir, 'relations.graph.yml'), graph);
}

export function loadContextPacks(registryDir: string): ContextPacksFile {
  return loadYamlFile(path.join(registryDir, 'context-packs.yml'), { packs: [] });
}

export function listActiveDecisionBlocks(decisionLogRaw: string): string[] {
  const blocks = decisionLogRaw
    .split(/^##\s+/m)
    .map((segment) => segment.trim())
    .filter(Boolean)
    .map((segment) => `## ${segment}`);

  return blocks.filter((block) => /status:\s*active/i.test(block));
}
