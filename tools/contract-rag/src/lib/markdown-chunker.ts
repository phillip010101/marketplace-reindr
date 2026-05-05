import { stableHash, stableId } from './hash';
import { estimateTokens } from './token-estimate';
import type { ContractChunkInput } from './types';

function normalizeHeading(line: string): { level: number; text: string } | null {
  const match = /^(#{1,6})\s+(.*)$/.exec(line.trim());
  if (!match) return null;
  return { level: match[1].length, text: match[2].trim() };
}

function classifyImportance(headingPath: string, content: string): 'normal' | 'high' | 'critical' {
  const joined = `${headingPath}\n${content}`.toLowerCase();
  if (joined.includes('non-negotiable') || joined.includes('must') || joined.includes('critical rule')) {
    return 'critical';
  }
  if (joined.includes('risk') || joined.includes('security') || joined.includes('invariant')) {
    return 'high';
  }
  return 'normal';
}

export function chunkMarkdownByHeadings(
  contractId: string,
  filePath: string,
  body: string
): ContractChunkInput[] {
  const lines = body.split('\n');
  const chunks: ContractChunkInput[] = [];
  const headingStack: string[] = [];

  let currentHeadingPath = 'Document';
  let buffer: string[] = [];

  const flush = (): void => {
    const content = buffer.join('\n').trim();
    if (!content) return;
    const contentHash = stableHash(content);
    const chunkId = stableId([contractId, currentHeadingPath, contentHash]);
    const importance = classifyImportance(currentHeadingPath, content);
    chunks.push({
      id: chunkId,
      contractId,
      filePath,
      headingPath: currentHeadingPath,
      content,
      contentHash,
      tokenCount: estimateTokens(content),
      importance,
      metadata: { importance }
    });
  };

  for (const line of lines) {
    const heading = normalizeHeading(line);
    if (!heading) {
      buffer.push(line);
      continue;
    }

    flush();
    buffer = [];

    while (headingStack.length >= heading.level) {
      headingStack.pop();
    }
    headingStack.push(heading.text);
    currentHeadingPath = headingStack.join(' > ');
  }

  flush();

  if (chunks.length === 0) {
    const content = body.trim();
    if (content) {
      const contentHash = stableHash(content);
      chunks.push({
        id: stableId([contractId, 'Document', contentHash]),
        contractId,
        filePath,
        headingPath: 'Document',
        content,
        contentHash,
        tokenCount: estimateTokens(content),
        importance: classifyImportance('Document', content),
        metadata: {}
      });
    }
  }

  return chunks;
}
