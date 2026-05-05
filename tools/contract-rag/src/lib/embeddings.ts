import { stableHash } from './hash';

export type EmbeddingsProvider = {
  name: string;
  available: boolean;
  embed: (text: string) => Promise<number[]>;
};

function normalize(vec: number[]): number[] {
  const norm = Math.sqrt(vec.reduce((acc, value) => acc + value * value, 0));
  if (norm === 0) return vec;
  return vec.map((v) => v / norm);
}

function hashEmbedding(text: string, dimension = 1536): number[] {
  const vec = new Array<number>(dimension).fill(0);
  const words = text.toLowerCase().split(/\s+/).filter(Boolean);
  for (const word of words) {
    const hash = stableHash(word);
    const index = parseInt(hash.slice(0, 8), 16) % dimension;
    const sign = parseInt(hash.slice(8, 10), 16) % 2 === 0 ? 1 : -1;
    vec[index] += sign;
  }
  return normalize(vec);
}

export function createEmbeddingsProvider(options: {
  openAiApiKey?: string;
  model: string;
  dimension: number;
}): EmbeddingsProvider {
  const { openAiApiKey, model, dimension } = options;

  if (!openAiApiKey) {
    return {
      name: 'hash-fallback',
      available: false,
      embed: async (text: string) => hashEmbedding(text, dimension)
    };
  }

  return {
    name: `openai:${model}`,
    available: true,
    embed: async (text: string) => {
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openAiApiKey}`
        },
        body: JSON.stringify({
          model,
          input: text
        })
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`OpenAI embeddings request failed: ${response.status} ${body}`);
      }

      const parsed = (await response.json()) as { data: Array<{ embedding: number[] }> };
      return parsed.data[0].embedding;
    }
  };
}
