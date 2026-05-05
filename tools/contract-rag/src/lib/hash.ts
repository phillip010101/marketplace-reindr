import crypto from 'node:crypto';

export function stableHash(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}

export function stableId(parts: string[]): string {
  return stableHash(parts.join('::')).slice(0, 24);
}
