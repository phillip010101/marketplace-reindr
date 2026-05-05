import { loadRelationsGraph } from '../lib/registry';

export function runGraph(config: { registryDir: string }, contractId: string): void {
  if (!contractId) throw new Error('contractId is required');

  const graph = loadRelationsGraph(config.registryDir);
  const direct = graph.relations.filter((item) => item.from === contractId);
  const reverse = graph.relations.filter((item) => item.to === contractId);
  const related = graph.relations.filter((item) => item.from === contractId || item.to === contractId);

  console.log(`# Graph for ${contractId}`);
  console.log('\n## Direct dependencies');
  if (direct.length === 0) console.log('- none');
  for (const relation of direct) {
    console.log(`- ${relation.from} --${relation.type}--> ${relation.to}${relation.reason ? ` (${relation.reason})` : ''}`);
  }

  console.log('\n## Reverse dependencies');
  if (reverse.length === 0) console.log('- none');
  for (const relation of reverse) {
    console.log(`- ${relation.from} --${relation.type}--> ${relation.to}${relation.reason ? ` (${relation.reason})` : ''}`);
  }

  console.log('\n## Related one-hop edges');
  if (related.length === 0) console.log('- none');
  for (const relation of related) {
    console.log(`- ${relation.from} --${relation.type}--> ${relation.to}${relation.reason ? ` (${relation.reason})` : ''}`);
  }
}
