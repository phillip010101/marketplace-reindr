import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';

export type RagConfig = {
  repoRoot: string;
  contractsDir: string;
  registryDir: string;
  contextGeneratedDir: string;
  databaseUrl?: string;
  openAiApiKey?: string;
  embeddingModel: string;
  contextBudget: number;
  maxChunks: number;
  graphDepth: number;
  embeddingDimension: number;
};

function loadEnv(repoRoot: string): void {
  const toolEnv = path.join(repoRoot, 'tools', 'contract-rag', '.env');
  const rootEnv = path.join(repoRoot, '.env');
  const scaffoldEnv = path.join(repoRoot, 'mvp-scaffold', '.env');

  for (const envFile of [toolEnv, rootEnv, scaffoldEnv]) {
    if (fs.existsSync(envFile)) {
      dotenv.config({ path: envFile, override: false });
    }
  }
}

function findRepoRoot(start: string): string {
  let current = start;
  while (true) {
    const contractsPath = path.join(current, 'contracts');
    if (fs.existsSync(contractsPath) && fs.statSync(contractsPath).isDirectory()) {
      return current;
    }

    const parent = path.dirname(current);
    if (parent === current) {
      throw new Error('Could not find repository root containing /contracts');
    }
    current = parent;
  }
}

export function getConfig(): RagConfig {
  const repoRoot = findRepoRoot(process.cwd());
  loadEnv(repoRoot);

  const embeddingModel = process.env.CONTRACT_RAG_EMBEDDING_MODEL ?? 'text-embedding-3-small';
  const contextBudget = Number(process.env.CONTRACT_RAG_CONTEXT_BUDGET ?? '8000');
  const maxChunks = Number(process.env.CONTRACT_RAG_MAX_CHUNKS ?? '12');
  const graphDepth = Number(process.env.CONTRACT_RAG_GRAPH_DEPTH ?? '1');

  return {
    repoRoot,
    contractsDir: path.join(repoRoot, 'contracts'),
    registryDir: path.join(repoRoot, 'contracts', '_registry'),
    contextGeneratedDir: path.join(repoRoot, '.context', 'generated'),
    databaseUrl: process.env.DATABASE_URL,
    openAiApiKey: process.env.OPENAI_API_KEY,
    embeddingModel,
    contextBudget,
    maxChunks,
    graphDepth,
    embeddingDimension: 1536
  };
}
