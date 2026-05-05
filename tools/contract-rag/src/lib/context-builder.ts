import fs from 'node:fs';
import path from 'node:path';
import { queryKeywords } from './query';
import { estimateTokens } from './token-estimate';
import type { ContextBundle, ContextPacksFile, RelationsGraph, SearchResult } from './types';

function unique(items: string[]): string[] {
  return Array.from(new Set(items));
}

function trimToBudgetWithRequiredCoverage(
  extracts: SearchResult[],
  budget: number,
  requiredContracts: string[]
): SearchResult[] {
  const sorted = [...extracts].sort((a, b) => b.score - a.score);
  const selected: SearchResult[] = [];
  const selectedChunkIds = new Set<string>();
  let used = 0;

  const tryAdd = (extract: SearchResult): boolean => {
    if (selectedChunkIds.has(extract.chunkId)) return false;
    const chunkTokens = estimateTokens(extract.content);
    if (used + chunkTokens > budget) return false;
    selected.push(extract);
    selectedChunkIds.add(extract.chunkId);
    used += chunkTokens;
    return true;
  };

  // Required contracts first: reserve at least one chunk when possible.
  for (const contractId of requiredContracts) {
    const match = sorted.find((extract) => extract.contractId === contractId && !selectedChunkIds.has(extract.chunkId));
    if (!match) continue;
    tryAdd(match);
  }

  // Fill remaining budget with top-scoring chunks.
  for (const extract of sorted) {
    if (used >= budget) break;
    tryAdd(extract);
  }

  return selected.sort((a, b) => b.score - a.score);
}

export function buildContextBundle(options: {
  task: string;
  searchResults: SearchResult[];
  relations: RelationsGraph;
  contextPacks: ContextPacksFile;
  contractSummaries?: Map<string, string>;
  globalRulesRaw: string;
  decisionLogRaw: string;
  budget: number;
  selectedPackId?: string;
}): ContextBundle {
  const selectedPack = options.selectedPackId
    ? options.contextPacks.packs.find((pack) => pack.id === options.selectedPackId)
    : undefined;

  const requiredContracts = unique([
    ...(selectedPack?.required_contracts ?? []),
    ...options.searchResults.slice(0, 4).map((item) => item.contractId)
  ]);
  const relatedContracts = unique([
    ...options.searchResults.slice(4).map((item) => item.contractId),
    ...(selectedPack?.optional_contracts ?? [])
  ]).filter((id) => !requiredContracts.includes(id));

  const summaryIds = unique([...requiredContracts, ...relatedContracts]).slice(0, 12);
  const contractSummaries = summaryIds.map((id) => {
    const summary = options.contractSummaries?.get(id) ?? 'No summary available.';
    return `- ${id}: ${summary}`;
  });

  const graphNotes = options.relations.relations
    .filter((relation) => requiredContracts.includes(relation.from) || requiredContracts.includes(relation.to))
    .map((relation) => `${relation.from} --${relation.type}--> ${relation.to}${relation.reason ? ` (${relation.reason})` : ''}`);

  const globalRules = options.globalRulesRaw
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('- '));

  const packRules = (selectedPack?.critical_rules ?? []).map((rule) => `- ${rule}`);
  const rules = unique([...globalRules, ...packRules]);

  const keywords = queryKeywords(options.task);
  const activeDecisionBlocks = options.decisionLogRaw
    .split(/^##\s+/m)
    .map((segment) => segment.trim())
    .filter(Boolean)
    .map((segment) => `## ${segment}`)
    .filter((block) => /status:\s*active/i.test(block))
    .filter((block) => {
      const lower = block.toLowerCase();
      if (requiredContracts.some((id) => lower.includes(id.toLowerCase()))) return true;
      return keywords.some((keyword) => lower.includes(keyword));
    });

  const extractBudget = Math.max(500, Math.floor(options.budget * 0.65));
  const extracts = trimToBudgetWithRequiredCoverage(options.searchResults, extractBudget, requiredContracts);
  const usedContractIds = unique([
    ...requiredContracts,
    ...relatedContracts,
    ...extracts.map((extract) => extract.contractId)
  ]);
  const usedChunkIds = extracts.map((extract) => extract.chunkId);

  const riskSet = new Set<string>();
  for (const extract of extracts) {
    const lower = extract.content.toLowerCase();
    if (lower.includes('non-negotiable') || lower.includes('must')) {
      riskSet.add('Potential violation of non-negotiable rules if implementation drifts from extracted contracts.');
    }
    if (lower.includes('security') || lower.includes('privacy')) {
      riskSet.add('Security/privacy-sensitive sections detected. Validate DTO boundaries and role access before coding.');
    }
  }
  if (riskSet.size === 0) {
    riskSet.add('Medium confidence retrieval. Manually verify contract headings before applying invasive changes.');
  }

  const confidence: ContextBundle['confidence'] =
    requiredContracts.length >= 3 && extracts.length >= 5 ? 'high'
      : extracts.length >= 3 ? 'medium'
        : 'low';

  const tokenCount = estimateTokens([
    options.task,
    rules.join('\n'),
    activeDecisionBlocks.join('\n'),
    extracts.map((extract) => extract.content).join('\n')
  ].join('\n'));

  return {
    task: options.task,
    confidence,
    requiredContracts,
    relatedContracts,
    contractSummaries,
    graphNotes,
    rules,
    extracts,
    decisions: activeDecisionBlocks,
    risks: Array.from(riskSet),
    usedContractIds,
    usedChunkIds,
    tokenCount,
    tokenBudget: options.budget
  };
}

export function renderContextBundle(bundle: ContextBundle, options?: { full?: boolean }): string {
  const extractLines = bundle.extracts.map((extract) => {
    const excerpt = options?.full
      ? extract.content
      : extract.content.length > 700
        ? `${extract.content.slice(0, 700)}...`
        : extract.content;
    return `### ${extract.contractId} :: ${extract.headingPath}\nSource: ${extract.filePath}\nScore: ${extract.score.toFixed(3)}\n\n${excerpt}`;
  });

  return `# Agent Context Bundle

## Task
${bundle.task}

## Context Confidence
${bundle.confidence}

## Required Contracts
${bundle.requiredContracts.map((id) => `- ${id}`).join('\n') || '- none'}

## Related Contracts
${bundle.relatedContracts.map((id) => `- ${id}`).join('\n') || '- none'}

## Contract Summaries
${bundle.contractSummaries.join('\n') || '- none'}

## Contract Graph
${bundle.graphNotes.map((line) => `- ${line}`).join('\n') || '- none'}

## Non-Negotiable Rules
${bundle.rules.join('\n') || '- none'}

## Relevant Extracts
${extractLines.join('\n\n') || 'No extracts within budget.'}

## Active Decisions
${bundle.decisions.join('\n\n') || 'No active decisions found.'}

## Risks
${bundle.risks.map((risk) => `- ${risk}`).join('\n')}

## Required Agent Behavior
Before changing code, the agent must declare:
- contracts read,
- contracts affected,
- proposed changes,
- migrations needed,
- tests expected.
`;
}

export function writeContextBundle(filePath: string, markdown: string): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, markdown, 'utf8');
}
