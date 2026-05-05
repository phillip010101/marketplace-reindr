import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';
import pg from 'pg';

const { Client } = pg;

function resolveDbDir(): string {
  const currentFile = fileURLToPath(import.meta.url);
  return path.resolve(path.dirname(currentFile), '../../../../packages/db');
}

async function readSqlFile(filePath: string): Promise<string> {
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch (error) {
    throw new Error(`Unable to read SQL file: ${filePath}. ${(error as Error).message}`);
  }
}

async function executeSql(client: InstanceType<typeof Client>, sql: string, label: string): Promise<void> {
  if (!sql.trim()) {
    console.log(`Skipped ${label}: empty file.`);
    return;
  }
  await client.query(sql);
  console.log(`Applied ${label}.`);
}

async function tableExists(client: InstanceType<typeof Client>, tableName: string): Promise<boolean> {
  const result = await client.query<{ regclass: string | null }>(
    `SELECT to_regclass($1) AS regclass`,
    [`public.${tableName}`]
  );
  return Boolean(result.rows[0]?.regclass);
}

async function tableRowCount(client: InstanceType<typeof Client>, tableName: string): Promise<number> {
  const result = await client.query<{ count: string }>(
    `SELECT count(*)::text AS count FROM ${tableName}`
  );
  return Number(result.rows[0]?.count ?? '0');
}

async function main(): Promise<void> {
  const withSeed = process.argv.includes('--with-seed');
  const seedOnly = process.argv.includes('--seed-only');
  const databaseUrl = process.env.DATABASE_URL ?? 'postgres://reindr:reindr@localhost:5432/reindr_marketplace';
  const dbDir = resolveDbDir();
  const schemaPath = path.join(dbDir, 'schema.sql');
  const seedPath = path.join(dbDir, 'seed.sql');

  const schemaSql = seedOnly ? '' : await readSqlFile(schemaPath);
  const seedSql = (withSeed || seedOnly) ? await readSqlFile(seedPath) : '';

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    if (!seedOnly) {
      const accountsExists = await tableExists(client, 'accounts');
      if (accountsExists) {
        console.log('Skipped schema.sql: schema already present (accounts table exists).');
      } else {
        await executeSql(client, schemaSql, 'schema.sql');
      }
    }

    if (withSeed || seedOnly) {
      const accountsExists = await tableExists(client, 'accounts');
      if (!accountsExists) {
        throw new Error('Cannot apply seed: accounts table does not exist yet. Run schema bootstrap first.');
      }
      const accountRows = await tableRowCount(client, 'accounts');
      if (accountRows > 0) {
        console.log('Skipped seed.sql: accounts already has data.');
      } else {
        await executeSql(client, seedSql, 'seed.sql');
      }
    }
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  if (error instanceof Error) {
    console.error(`${error.name}: ${error.message}`);
    if (error.stack) console.error(error.stack);
  } else {
    console.error('Unknown bootstrap-db error:', error);
  }
  process.exitCode = 1;
});
