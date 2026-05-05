import test from 'node:test';
import assert from 'node:assert/strict';
import { isChunkChanged } from '../src/commands/index';

test('detects unchanged chunks and skips re-embedding condition', () => {
  const existing = new Map<string, string>([['chunk-1', 'hash-a']]);
  assert.equal(isChunkChanged(existing, 'chunk-1', 'hash-a'), false);
  assert.equal(isChunkChanged(existing, 'chunk-1', 'hash-b'), true);
  assert.equal(isChunkChanged(existing, 'chunk-2', 'hash-any'), true);
});
