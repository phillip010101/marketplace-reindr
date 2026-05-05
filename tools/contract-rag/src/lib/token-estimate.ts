// Rough token estimator to avoid pulling a heavy tokenizer dependency.
// We bias high to keep generated bundles under budget.
export function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / 3.5);
}
