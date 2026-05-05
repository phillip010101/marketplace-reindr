import fs from 'node:fs';
import path from 'node:path';
import { ensureDir, listFilesRecursive, writeFileIfMissing } from '../lib/fs-utils';

const agentEntrypoint = `# Agent Entrypoint

Before modifying code:

1. Run or read the generated context bundle.
2. Identify relevant contracts.
3. Read required contracts if needed.
4. Respect active decisions.
5. Do not contradict active contracts.
6. If a code change changes business rules, update the contract.
7. If a contract is incomplete, propose an amendment before implementing.
8. Declare contracts affected before coding.

Required response before code changes:

- Task understood
- Contracts consulted
- Contracts affected
- Risk assessment
- Implementation plan
- Tests to run
`;

const contractsIndex = `contracts: []\n`;
const relationsGraph = `relations: []\n`;
const contextPacks = `packs: []\n`;
const decisionLog = `# Decision Log

## DEC-001 Contracts are source of truth

Date: 2026-04-28
Status: active

Decision:
Contracts in \`/contracts\` are the source of truth.

Reason:
Avoid agentic drift and undocumented architecture.

Impact:
Changes that modify business rules must update contracts.
`;

const globalRules = `# Global Rules

## Non-Negotiable Rules

- Contracts in /contracts are authoritative.
- Vector DB and generated bundles are derived data.
- If generated context contradicts contracts, contracts win.
- Business-rule changes require contract updates.
`;

const defaultContract = `---
id: EXAMPLE_MODULE_CONTRACT
title: Example Module Contract
type: module
status: active
priority: medium
version: 1.0.0
applies_to:
  - backend
  - frontend
depends_on:
  - DATA_MODEL
related: []
agent_read_policy: when_touching_module
---

# Example Module Contract

## Purpose

Define the behavior of the example module.

## Non-Negotiable Rules

- Keep contract as source of truth.
- Do not hide business state outside declared entities.

## Agent Notes

- Update this contract if business behavior changes.
`;

export function runInit(config: {
  repoRoot: string;
  contractsDir: string;
  registryDir: string;
}, options: { force: boolean }): void {
  ensureDir(config.contractsDir);
  ensureDir(config.registryDir);
  ensureDir(path.join(config.repoRoot, '.context', 'generated'));

  const create = (relativePath: string, content: string): string => {
    const absolute = path.join(config.repoRoot, relativePath);
    if (options.force) {
      ensureDir(path.dirname(absolute));
      fs.writeFileSync(absolute, content, 'utf8');
      return `updated ${relativePath}`;
    }
    const created = writeFileIfMissing(absolute, content);
    return created ? `created ${relativePath}` : `kept ${relativePath}`;
  };

  const logs = [
    create('contracts/_registry/agent-entrypoint.md', agentEntrypoint),
    create('contracts/_registry/contracts.index.yml', contractsIndex),
    create('contracts/_registry/relations.graph.yml', relationsGraph),
    create('contracts/_registry/global.rules.md', globalRules),
    create('contracts/_registry/decision-log.md', decisionLog),
    create('contracts/_registry/context-packs.yml', contextPacks),
    create('.context/generated/current-context.md', '# Agent Context Bundle\n\nNo context generated yet.\n')
  ];

  const hasContracts = listFilesRecursive(config.contractsDir, (fullPath) => fullPath.endsWith('.md'))
    .some((fullPath) => !fullPath.includes(`${path.sep}_registry${path.sep}`));

  if (!hasContracts) {
    logs.push(create('contracts/modules/example/100-example-module-contract.md', defaultContract));
  }

  for (const line of logs) {
    console.log(line);
  }
}
