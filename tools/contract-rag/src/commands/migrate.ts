import path from 'node:path';
import { openDb, runMigrations } from '../lib/database';

export async function runMigrate(config: { repoRoot: string; databaseUrl?: string }): Promise<void> {
  const db = await openDb(config.databaseUrl);
  try {
    const applied = await runMigrations(db, path.join(config.repoRoot, 'tools', 'contract-rag', 'migrations'));
    if (applied.length === 0) {
      console.log('No pending migrations.');
      return;
    }
    for (const file of applied) {
      console.log(`Applied migration: ${file}`);
    }
  } finally {
    await db.close();
  }
}
