import path from 'node:path';
import { parseContractFrontmatter } from './frontmatter';
import { listFilesRecursive, readUtf8, toPosixRelative } from './fs-utils';
import { chunkMarkdownByHeadings } from './markdown-chunker';
import type { ParsedContract } from './types';

export function loadContracts(contractsDir: string, repoRoot: string): ParsedContract[] {
  const files = listFilesRecursive(contractsDir, (fullPath) => fullPath.endsWith('.md'));
  const out: ParsedContract[] = [];

  for (const file of files) {
    const raw = readUtf8(file);
    try {
      const parsed = parseContractFrontmatter(raw);
      if (!parsed.frontmatter.id || !parsed.frontmatter.title || !parsed.frontmatter.type) {
        continue;
      }

      const relativePath = toPosixRelative(repoRoot, file);
      const chunks = chunkMarkdownByHeadings(parsed.frontmatter.id, relativePath, parsed.body);

      out.push({
        frontmatter: parsed.frontmatter,
        rawContent: parsed.rawContent,
        body: parsed.body,
        filePath: relativePath,
        contentHash: parsed.contentHash,
        headings: parsed.headings,
        chunks
      });
    } catch {
      // Ignore markdown files without parsable frontmatter.
      continue;
    }
  }

  out.sort((a, b) => a.filePath.localeCompare(b.filePath));
  return out;
}

export function resolveContractFile(repoRoot: string, relativePath: string): string {
  return path.join(repoRoot, relativePath);
}
