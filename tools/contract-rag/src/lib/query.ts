const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'to', 'for', 'of', 'in', 'on', 'with',
  'de', 'la', 'el', 'los', 'las', 'y', 'o', 'para', 'con', 'en', 'por'
]);

export function normalizeQuery(input: string): string {
  return input.trim().toLowerCase();
}

export function queryKeywords(input: string): string[] {
  return normalizeQuery(input)
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .map((item) => item.trim())
    .filter((item) => item.length >= 3 && !STOP_WORDS.has(item));
}
