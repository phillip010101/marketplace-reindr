import test from 'node:test';
import assert from 'node:assert/strict';
import { buildContextBundle } from '../src/lib/context-builder';
import type { SearchResult } from '../src/lib/types';

test('builds compact context bundle with required sections', () => {
  const results: SearchResult[] = [
    {
      contractId: 'LEADS_CONTRACT',
      filePath: 'contracts/modules/leads.md',
      title: 'Leads',
      headingPath: 'Non-Negotiable Rules',
      chunkId: 'c1',
      content: 'Lead must be auditable.',
      score: 1.2,
      scoreBreakdown: {}
    }
  ];

  const bundle = buildContextBundle({
    task: 'implement lead conversion',
    searchResults: results,
    relations: { relations: [{ from: 'LEADS_CONTRACT', to: 'DATA_MODEL', type: 'depends_on' }] },
    contextPacks: { packs: [{ id: 'lead-pack', title: 'Lead pack', required_contracts: ['LEADS_CONTRACT'], critical_rules: ['Do not break audit trail.'] }] },
    globalRulesRaw: '- Contracts are source of truth.\n',
    decisionLogRaw: '## DEC-001\nStatus: active\nDecision:\nUse contracts.\n',
    budget: 8000,
    selectedPackId: 'lead-pack'
  });

  assert.equal(bundle.task, 'implement lead conversion');
  assert.ok(bundle.requiredContracts.includes('LEADS_CONTRACT'));
  assert.ok(bundle.usedContractIds.includes('LEADS_CONTRACT'));
  assert.ok(bundle.rules.length >= 1);
  assert.ok(bundle.extracts.length >= 1);
});

test('context bundle keeps at least one extract for each required contract when available', () => {
  const results: SearchResult[] = [
    {
      contractId: 'REQ_A',
      filePath: 'contracts/a.md',
      title: 'A',
      headingPath: 'A heading',
      chunkId: 'a-1',
      content: 'A rule with must and invariant.',
      score: 0.8,
      scoreBreakdown: {}
    },
    {
      contractId: 'REQ_B',
      filePath: 'contracts/b.md',
      title: 'B',
      headingPath: 'B heading',
      chunkId: 'b-1',
      content: 'B rule with must and security.',
      score: 0.7,
      scoreBreakdown: {}
    },
    {
      contractId: 'OTHER_C',
      filePath: 'contracts/c.md',
      title: 'C',
      headingPath: 'C heading',
      chunkId: 'c-1',
      content: 'C chunk with high generic relevance.',
      score: 0.95,
      scoreBreakdown: {}
    }
  ];

  const bundle = buildContextBundle({
    task: 'prepare sprint execution',
    searchResults: results,
    relations: { relations: [] },
    contextPacks: { packs: [{ id: 'pack-x', title: 'Pack X', required_contracts: ['REQ_A', 'REQ_B'] }] },
    globalRulesRaw: '- Contracts are source of truth.\n',
    decisionLogRaw: '',
    budget: 8000,
    selectedPackId: 'pack-x'
  });

  const extractContractIds = new Set(bundle.extracts.map((item) => item.contractId));
  assert.ok(extractContractIds.has('REQ_A'));
  assert.ok(extractContractIds.has('REQ_B'));
});
