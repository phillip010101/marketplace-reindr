import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { validateAll } from '../src/lib/validate';

function setupBase(): { root: string; contractsDir: string; registryDir: string } {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'contract-rag-'));
  const contractsDir = path.join(root, 'contracts');
  const registryDir = path.join(contractsDir, '_registry');
  fs.mkdirSync(registryDir, { recursive: true });

  fs.writeFileSync(path.join(contractsDir, 'c1.md'), `---
id: C1
title: Contract One
type: module
status: active
priority: high
---

# C1
Body
`);
  fs.writeFileSync(path.join(registryDir, 'agent-entrypoint.md'), '# entry');
  fs.writeFileSync(path.join(registryDir, 'global.rules.md'), '# rules');
  fs.writeFileSync(path.join(registryDir, 'decision-log.md'), '# decisions');
  fs.writeFileSync(path.join(registryDir, 'contracts.index.yml'), 'contracts:\n  - id: C1\n    file: contracts/c1.md\n    title: Contract One\n    type: module\n    status: active\n    priority: high\n');
  fs.writeFileSync(path.join(registryDir, 'relations.graph.yml'), 'relations: []\n');
  fs.writeFileSync(path.join(registryDir, 'context-packs.yml'), 'packs:\n  - id: pack\n    title: p\n    required_contracts: [C1]\n');

  return { root, contractsDir, registryDir };
}

test('validate passes with consistent files', () => {
  const { root, contractsDir, registryDir } = setupBase();
  const result = validateAll(root, contractsDir, registryDir);
  assert.equal(result.ok, true);
});

test('validate fails when graph references unknown id', () => {
  const { root, contractsDir, registryDir } = setupBase();
  fs.writeFileSync(
    path.join(registryDir, 'relations.graph.yml'),
    'relations:\n  - from: C1\n    to: UNKNOWN\n    type: depends_on\n'
  );
  const result = validateAll(root, contractsDir, registryDir);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes('UNKNOWN')));
});

test('validate fails when context pack references unknown contract', () => {
  const { root, contractsDir, registryDir } = setupBase();
  fs.writeFileSync(
    path.join(registryDir, 'context-packs.yml'),
    'packs:\n  - id: bad-pack\n    title: bad\n    required_contracts: [UNKNOWN]\n'
  );
  const result = validateAll(root, contractsDir, registryDir);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes('UNKNOWN')));
});
