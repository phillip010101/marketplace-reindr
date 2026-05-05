import pg from 'pg';

const { Pool } = pg;

let pool: InstanceType<typeof Pool> | null = null;
let poolOverride: InstanceType<typeof Pool> | null = null;

export function getPool(): InstanceType<typeof Pool> {
  if (poolOverride) {
    return poolOverride;
  }

  if (!pool) {
    const connectionString = process.env.DATABASE_URL ?? 'postgres://reindr:reindr@localhost:5432/reindr_marketplace';
    pool = new Pool({ connectionString });
  }
  return pool;
}

export function setPoolForTests(nextPool: InstanceType<typeof Pool> | null): void {
  poolOverride = nextPool;
}
