export type ContractPriority = 'low' | 'medium' | 'high' | 'critical';

export type ContractFrontmatter = {
  id: string;
  title: string;
  type: string;
  status?: string;
  priority?: ContractPriority;
  version?: string;
  applies_to?: string[];
  depends_on?: string[];
  related?: string[];
  agent_read_policy?: string;
  summary?: string;
  [key: string]: unknown;
};

export type ParsedContract = {
  frontmatter: ContractFrontmatter;
  rawContent: string;
  body: string;
  filePath: string;
  contentHash: string;
  headings: string[];
  chunks: ContractChunkInput[];
};

export type ContractChunkInput = {
  id: string;
  contractId: string;
  filePath: string;
  headingPath: string;
  content: string;
  contentHash: string;
  tokenCount: number;
  importance: 'normal' | 'high' | 'critical';
  metadata: Record<string, unknown>;
};

export type ContractIndexEntry = {
  id: string;
  file: string;
  title: string;
  type: string;
  status: string;
  priority: string;
  version?: string;
  summary?: string;
  applies_to?: string[];
  depends_on?: string[];
  related?: string[];
  agent_read_policy?: string;
};

export type RelationsGraph = {
  relations: Array<{
    from: string;
    to: string;
    type: string;
    reason?: string;
  }>;
};

export type ContextPack = {
  id: string;
  title: string;
  description?: string;
  required_contracts: string[];
  optional_contracts?: string[];
  critical_rules?: string[];
};

export type ContextPacksFile = {
  packs: ContextPack[];
};

export type SearchResult = {
  contractId: string;
  filePath: string;
  title: string;
  headingPath: string;
  chunkId: string;
  content: string;
  score: number;
  scoreBreakdown: Record<string, number>;
};

export type ContextBundle = {
  task: string;
  confidence: 'high' | 'medium' | 'low';
  requiredContracts: string[];
  relatedContracts: string[];
  contractSummaries: string[];
  graphNotes: string[];
  rules: string[];
  extracts: SearchResult[];
  decisions: string[];
  risks: string[];
  usedContractIds: string[];
  usedChunkIds: string[];
  tokenCount: number;
  tokenBudget: number;
};
