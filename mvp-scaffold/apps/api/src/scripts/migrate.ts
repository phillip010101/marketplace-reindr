import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import process from 'node:process';
import pg from 'pg';

type MigrationFile = {
  id: string;
  filePath: string;
  sql: string;
  checksum: string;
};

const { Client } = pg;

function resolveMigrationsDir(): string {
  const currentFile = fileURLToPath(import.meta.url);
  return path.resolve(path.dirname(currentFile), '../../../../packages/db/migrations');
}

function sha256(input: string): string {
  return createHash('sha256').update(input, 'utf8').digest('hex');
}

async function loadMigrationFiles(migrationsDir: string): Promise<MigrationFile[]> {
  const dirStat = await fs.stat(migrationsDir).catch(() => null);
  if (!dirStat || !dirStat.isDirectory()) {
    throw new Error(`Migrations directory not found: ${migrationsDir}`);
  }

  const entries = await fs.readdir(migrationsDir, { withFileTypes: true });
  const fileNames = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.sql'))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));

  const files: MigrationFile[] = [];
  for (const fileName of fileNames) {
    const filePath = path.join(migrationsDir, fileName);
    const sql = await fs.readFile(filePath, 'utf8');
    files.push({
      id: fileName,
      filePath,
      sql,
      checksum: sha256(sql)
    });
  }

  return files;
}

async function ensureMigrationsTable(client: InstanceType<typeof Client>): Promise<void> {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      checksum TEXT NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
}

async function main(): Promise<void> {
  const checkOnly = process.argv.includes('--check');
  const databaseUrl = process.env.DATABASE_URL ?? 'postgres://reindr:reindr@localhost:5432/reindr_marketplace';
  const migrationsDir = resolveMigrationsDir();
  const migrationFiles = await loadMigrationFiles(migrationsDir);

  if (migrationFiles.length === 0) {
    console.log(`No migration files found in ${migrationsDir}`);
    return;
  }

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    await ensureMigrationsTable(client);

    const appliedRows = await client.query<{ id: string; checksum: string }>(
      'SELECT id, checksum FROM schema_migrations'
    );
    const appliedMap = new Map(appliedRows.rows.map((row) => [row.id, row.checksum]));

    const pending: MigrationFile[] = [];
    for (const migration of migrationFiles) {
      const appliedChecksum = appliedMap.get(migration.id);
      if (!appliedChecksum) {
        pending.push(migration);
        continue;
      }
      if (appliedChecksum !== migration.checksum) {
        throw new Error(
          `Migration checksum mismatch for ${migration.id}. ` +
          `Applied checksum differs from file content; create a new migration instead of editing old one.`
        );
      }
    }

    if (checkOnly) {
      if (pending.length === 0) {
        console.log('Migration check passed: no pending migrations.');
        return;
      }
      console.log(`Migration check failed: ${pending.length} pending migration(s).`);
      for (const migration of pending) {
        console.log(`- ${migration.id}`);
      }
      process.exitCode = 1;
      return;
    }

    if (pending.length === 0) {
      console.log('No pending migrations.');
      return;
    }

    for (const migration of pending) {
      console.log(`Applying migration: ${migration.id}`);
      await client.query('BEGIN');
      try {
        await client.query(migration.sql);
        await client.query(
          'INSERT INTO schema_migrations (id, checksum) VALUES ($1, $2)',
          [migration.id, migration.checksum]
        );
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    }

    console.log(`Applied ${pending.length} migration(s).`);
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  if (error instanceof Error) {
    console.error(`${error.name}: ${error.message}`);
    if (error.stack) console.error(error.stack);
  } else {
    console.error('Unknown migration runner error:', error);
  }
  process.exitCode = 1;
});
