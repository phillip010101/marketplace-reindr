import test from 'node:test';
import assert from 'node:assert/strict';
import { retrieveHybridLocal } from '../src/lib/retriever';

test('retrieveHybridLocal keeps at least one chunk from preferred contracts when available', async () => {
  const results = await retrieveHybridLocal({
    task: 'lead conversion flow',
    contracts: [
      { id: 'REQUIRED_A', title: 'Required A', file: 'contracts/a.md', priority: 'low', status: 'active' },
      { id: 'OTHER_B', title: 'Other B', file: 'contracts/b.md', priority: 'high', status: 'active' }
    ],
    chunks: [
      {
        id: 'chunk-required',
        contractId: 'REQUIRED_A',
        filePath: 'contracts/a.md',
        headingPath: 'Rules',
        content: 'This section is about ownership and invariants.'
      },
      {
        id: 'chunk-other',
        contractId: 'OTHER_B',
        filePath: 'contracts/b.md',
        headingPath: 'Lead conversion',
        content: 'lead conversion lead conversion lead conversion'
      }
    ],
    relations: { relations: [] },
    contextPacks: { packs: [] },
    maxChunks: 2,
    graphDepth: 1,
    preferredContractIds: ['REQUIRED_A']
  });

  assert.equal(results.length, 2);
  assert.ok(results.some((item) => item.contractId === 'REQUIRED_A'));
});
