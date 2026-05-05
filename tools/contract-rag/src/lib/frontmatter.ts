import YAML from 'yaml';
import { stableHash } from './hash';
import type { ContractFrontmatter } from './types';

export type FrontmatterParseResult = {
  frontmatter: ContractFrontmatter;
  body: string;
  rawContent: string;
  headings: string[];
  contentHash: string;
};

function normalizeStringArray(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((item) => String(item)).filter(Boolean);
  }
  return [String(value)];
}

export function parseContractFrontmatter(content: string): FrontmatterParseResult {
  const normalized = content.replace(/\r\n/g, '\n');
  const trimmed = normalized.trimStart();
  if (!trimmed.startsWith('---')) {
    throw new Error('Contract file is missing YAML frontmatter delimiter ---');
  }

  const match = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/m.exec(trimmed);
  if (!match) {
    throw new Error('Contract frontmatter is not closed with ---');
  }
  const yamlRaw = match[1].trim();
  const body = match[2].trimStart();
  const parsed = YAML.parse(yamlRaw) ?? {};

  const frontmatter: ContractFrontmatter = {
    ...(parsed as Record<string, unknown>),
    id: String(parsed.id ?? ''),
    title: String(parsed.title ?? ''),
    type: String(parsed.type ?? ''),
    status: String(parsed.status ?? 'active'),
    priority: (String(parsed.priority ?? 'medium') as ContractFrontmatter['priority']),
    version: parsed.version ? String(parsed.version) : undefined,
    applies_to: normalizeStringArray(parsed.applies_to),
    depends_on: normalizeStringArray(parsed.depends_on),
    related: normalizeStringArray(parsed.related),
    agent_read_policy: parsed.agent_read_policy ? String(parsed.agent_read_policy) : undefined
  };

  const headings = body
    .split('\n')
    .filter((line) => line.trim().startsWith('#'))
    .map((line) => line.replace(/^#+\s*/, '').trim());

  return {
    frontmatter,
    body,
    rawContent: normalized,
    headings,
    contentHash: stableHash(content)
  };
}
