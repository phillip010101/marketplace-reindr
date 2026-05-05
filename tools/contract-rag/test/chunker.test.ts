import test from 'node:test';
import assert from 'node:assert/strict';
import { chunkMarkdownByHeadings } from '../src/lib/markdown-chunker';

test('chunks markdown by headings', () => {
  const body = `
# A
Text A
## A.1
Text A1
# B
Text B
`;
  const chunks = chunkMarkdownByHeadings('C1', 'contracts/a.md', body);
  assert.equal(chunks.length, 3);
  assert.equal(chunks[0].headingPath, 'A');
  assert.equal(chunks[1].headingPath, 'A > A.1');
  assert.equal(chunks[2].headingPath, 'B');
});
