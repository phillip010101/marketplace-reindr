#!/usr/bin/env node
import { getConfig } from './lib/config';
import { runInit } from './commands/init';
import { runMigrate } from './commands/migrate';
import { runIndex } from './commands/index';
import { runSearch } from './commands/search';
import { runGraph } from './commands/graph';
import { runValidate } from './commands/validate';
import { runContext } from './commands/context';

function parseFlags(args: string[]): {
  positional: string[];
  flags: Record<string, string | boolean>;
} {
  const positional: string[] = [];
  const flags: Record<string, string | boolean> = {};

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (!arg.startsWith('--')) {
      positional.push(arg);
      continue;
    }
    const [name, valueInline] = arg.slice(2).split('=');
    if (valueInline !== undefined) {
      flags[name] = valueInline;
      continue;
    }
    const next = args[i + 1];
    if (next && !next.startsWith('--')) {
      flags[name] = next;
      i += 1;
    } else {
      flags[name] = true;
    }
  }
  return { positional, flags };
}

function printUsage(): void {
  console.log(`contract-rag commands:
  contract-rag init [--force]
  contract-rag validate
  contract-rag migrate
  contract-rag index
  contract-rag search "query"
  contract-rag graph CONTRACT_ID
  contract-rag context "task" [--budget 8000] [--pack pack-id] [--module leads] [--json] [--full]
`);
}

async function main(): Promise<void> {
  const config = getConfig();
  const rawArgs = process.argv.slice(2);
  const { positional, flags } = parseFlags(rawArgs);
  const command = positional[0];

  if (!command) {
    printUsage();
    process.exitCode = 1;
    return;
  }

  switch (command) {
    case 'init':
      runInit(config, { force: Boolean(flags.force) });
      return;
    case 'validate':
      runValidate(config);
      return;
    case 'migrate':
      await runMigrate(config);
      return;
    case 'index':
      await runIndex(config);
      return;
    case 'search': {
      const query = positional.slice(1).join(' ');
      await runSearch(config, query);
      return;
    }
    case 'graph': {
      const contractId = positional[1];
      runGraph(config, contractId);
      return;
    }
    case 'context': {
      const task = positional.slice(1).join(' ');
      await runContext(config, task, {
        budget: flags.budget ? Number(flags.budget) : undefined,
        pack: typeof flags.pack === 'string' ? flags.pack : undefined,
        module: typeof flags.module === 'string' ? flags.module : undefined,
        json: Boolean(flags.json),
        full: Boolean(flags.full)
      });
      return;
    }
    default:
      printUsage();
      throw new Error(`Unknown command: ${command}`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
