import fs from 'node:fs';
import path from 'node:path';
import { loadContracts } from './contracts-loader';
import { parseContractFrontmatter } from './frontmatter';
import { loadContextPacks, loadContractsIndex, loadRelationsGraph } from './registry';
import { listFilesRecursive, readUtf8, toPosixRelative } from './fs-utils';

export type ValidationResult = {
  ok: boolean;
  errors: string[];
  warnings: string[];
};

const REQUIRED_REGISTRY_FILES = [
  'agent-entrypoint.md',
  'contracts.index.yml',
  'relations.graph.yml',
  'global.rules.md',
  'decision-log.md',
  'context-packs.yml'
];

export function validateAll(repoRoot: string, contractsDir: string, registryDir: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const file of REQUIRED_REGISTRY_FILES) {
    const fullPath = path.join(registryDir, file);
    if (!fs.existsSync(fullPath)) {
      errors.push(`Missing required registry file: contracts/_registry/${file}`);
    }
  }

  const parsedContracts = loadContracts(contractsDir, repoRoot);
  const contractFiles = listFilesRecursive(contractsDir, (fullPath) => fullPath.endsWith('.md'))
    .filter((fullPath) => !toPosixRelative(repoRoot, fullPath).startsWith('contracts/_registry/'));

  for (const file of contractFiles) {
    const relative = toPosixRelative(repoRoot, file);
    try {
      const parsed = parseContractFrontmatter(readUtf8(file));
      if (!parsed.frontmatter.id) {
        errors.push(`Contract missing id in ${relative}`);
      }
      if (!parsed.frontmatter.title) {
        errors.push(`Contract missing title in ${relative}`);
      }
      if (!parsed.frontmatter.type) {
        errors.push(`Contract missing type in ${relative}`);
      }
    } catch (error) {
      errors.push(`Invalid or missing frontmatter in ${relative}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  const ids = parsedContracts.map((item) => item.frontmatter.id);
  const uniqueIds = new Set(ids);
  if (ids.length !== uniqueIds.size) {
    errors.push('Duplicate contract IDs found in markdown contracts.');
  }
  for (const contract of parsedContracts) {
    if (!contract.frontmatter.id) {
      errors.push(`Contract missing id in ${contract.filePath}`);
    }
  }

  const index = loadContractsIndex(registryDir);
  const indexIds = index.contracts.map((entry) => entry.id);
  if (new Set(indexIds).size !== indexIds.length) {
    errors.push('contracts.index.yml contains duplicate contract IDs.');
  }
  for (const entry of index.contracts) {
    const fullPath = path.join(repoRoot, entry.file);
    if (!fs.existsSync(fullPath)) {
      errors.push(`contracts.index.yml references missing file: ${entry.file}`);
    }
  }

  const knownIds = new Set(parsedContracts.map((item) => item.frontmatter.id));

  const graph = loadRelationsGraph(registryDir);
  for (const relation of graph.relations) {
    if (!knownIds.has(relation.from)) {
      errors.push(`relations.graph.yml references unknown from contract: ${relation.from}`);
    }
    if (!knownIds.has(relation.to)) {
      errors.push(`relations.graph.yml references unknown to contract: ${relation.to}`);
    }
  }

  const packs = loadContextPacks(registryDir);
  for (const pack of packs.packs) {
    for (const id of pack.required_contracts) {
      if (!knownIds.has(id)) {
        errors.push(`context-packs.yml pack ${pack.id} references unknown required contract: ${id}`);
      }
    }
    for (const id of pack.optional_contracts ?? []) {
      if (!knownIds.has(id)) {
        errors.push(`context-packs.yml pack ${pack.id} references unknown optional contract: ${id}`);
      }
    }
  }

  if (parsedContracts.length === 0) {
    warnings.push('No contracts with valid frontmatter were found. Add frontmatter to contract markdown files.');
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings
  };
}
