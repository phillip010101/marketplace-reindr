import test from 'node:test';
import assert from 'node:assert/strict';
import { createEmbeddingsProvider } from '../src/lib/embeddings';

test('uses fallback embeddings when no API key exists', async () => {
  const provider = createEmbeddingsProvider({
    openAiApiKey: '',
    model: 'text-embedding-3-small',
    dimension: 1536
  });

  assert.equal(provider.available, false);
  const embedding = await provider.embed('hello world');
  assert.equal(embedding.length, 1536);
});
