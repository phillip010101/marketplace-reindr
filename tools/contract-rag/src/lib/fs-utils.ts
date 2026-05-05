import fs from 'node:fs';
import path from 'node:path';

export function ensureDir(dirPath: string): void {
  fs.mkdirSync(dirPath, { recursive: true });
}

export function writeFileIfMissing(filePath: string, content: string): boolean {
  if (fs.existsSync(filePath)) return false;
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, 'utf8');
  return true;
}

export function writeFile(filePath: string, content: string): void {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, 'utf8');
}

export function readUtf8(filePath: string): string {
  return fs.readFileSync(filePath, 'utf8');
}

export function listFilesRecursive(dir: string, predicate: (absolutePath: string) => boolean): string[] {
  const out: string[] = [];
  if (!fs.existsSync(dir)) return out;

  const stack = [dir];
  while (stack.length > 0) {
    const current = stack.pop()!;
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
      } else if (predicate(fullPath)) {
        out.push(fullPath);
      }
    }
  }
  return out;
}

export function toPosixRelative(root: string, file: string): string {
  return path.relative(root, file).split(path.sep).join('/');
}
