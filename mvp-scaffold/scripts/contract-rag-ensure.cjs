const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const repoRoot = path.resolve(__dirname, '..', '..');
const toolDir = path.join(repoRoot, 'tools', 'contract-rag');

function run(command, cwd) {
  const result = spawnSync(command, {
    cwd,
    stdio: 'inherit',
    shell: true
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function runSoft(command, cwd) {
  const result = spawnSync(command, {
    cwd,
    stdio: 'inherit',
    shell: true
  });
  return result.status === 0;
}

function quoteArg(value) {
  return `"${String(value).replace(/"/g, '\\"')}"`;
}

function buildCliCommand(args) {
  return `npm.cmd run cli -- ${args.map(quoteArg).join(' ')}`;
}

const toolNodeModules = path.join(toolDir, 'node_modules');
if (!fs.existsSync(toolNodeModules)) {
  console.log('[contract-rag] Installing tool dependencies...');
  run('npm.cmd install --no-audit --no-fund', toolDir);
}

const ensureMode = String(process.env.CONTRACT_RAG_ENSURE_MODE ?? 'full').toLowerCase();
const ensureTask = process.env.CONTRACT_RAG_ENSURE_TASK ?? 'workspace preflight contract sync';
const ensurePack = process.env.CONTRACT_RAG_ENSURE_PACK ?? '';
const ensureModule = process.env.CONTRACT_RAG_ENSURE_MODULE ?? '';
const strictEnsure = ['1', 'true', 'yes'].includes(
  String(process.env.CONTRACT_RAG_ENSURE_STRICT ?? '').toLowerCase()
);

console.log(`[contract-rag] Ensuring registry baseline (mode: ${ensureMode})...`);
run(buildCliCommand(['init']), toolDir);

if (ensureMode === 'baseline') {
  process.exit(0);
}

run(buildCliCommand(['validate']), toolDir);

if (strictEnsure) {
  run(buildCliCommand(['index']), toolDir);
} else {
  const indexed = runSoft(buildCliCommand(['index']), toolDir);
  if (!indexed) {
    console.warn(
      '[contract-rag] Warning: index skipped due to runtime error (likely DB/tunnel unavailable). Continuing in non-strict mode.'
    );
    process.exit(0);
  }
}

const contextArgs = ['context', ensureTask];
if (ensurePack.trim()) {
  contextArgs.push('--pack', ensurePack.trim());
}
if (ensureModule.trim()) {
  contextArgs.push('--module', ensureModule.trim());
}

if (strictEnsure) {
  run(buildCliCommand(contextArgs), toolDir);
} else {
  const contextBuilt = runSoft(buildCliCommand(contextArgs), toolDir);
  if (!contextBuilt) {
    console.warn(
      '[contract-rag] Warning: context generation skipped due to runtime error. Continuing in non-strict mode.'
    );
  }
}
