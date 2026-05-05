import test from 'node:test';
import assert from 'node:assert/strict';
import { parseContractFrontmatter } from '../src/lib/frontmatter';

test('parses frontmatter and body', () => {
  const input = `---
id: TEST_CONTRACT
title: Test Contract
type: module
status: active
priority: high
depends_on:
  - DATA_MODEL
---

# Test

Body here.
`;

  const parsed = parseContractFrontmatter(input);
  assert.equal(parsed.frontmatter.id, 'TEST_CONTRACT');
  assert.equal(parsed.frontmatter.title, 'Test Contract');
  assert.equal(parsed.frontmatter.type, 'module');
  assert.deepEqual(parsed.frontmatter.depends_on, ['DATA_MODEL']);
  assert.ok(parsed.body.includes('Body here.'));
  assert.ok(parsed.contentHash.length > 10);
});
