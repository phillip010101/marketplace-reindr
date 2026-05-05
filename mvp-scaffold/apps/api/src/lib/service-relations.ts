import { DEFAULT_SERVICE_RELATIONS } from '../../../../packages/core/src/service-relations-catalog';
import type { ServiceRelation } from '../../../../packages/core/src/lead-routing';
import { getPool } from './db';

function normalizeSlug(slug: string): string {
  return slug.trim().toLowerCase();
}

async function loadRelationsFromDb(sourceServiceSlug: string): Promise<ServiceRelation[]> {
  const pool = getPool();
  const result = await pool.query<{
    source_slug: string;
    target_slug: string;
    weight: number;
    active: boolean;
  }>(
    `
      SELECT
        source.slug AS source_slug,
        target.slug AS target_slug,
        sr.weight,
        sr.active
      FROM service_relations sr
      JOIN services source ON source.id = sr.source_service_id
      JOIN services target ON target.id = sr.target_service_id
      WHERE source.slug = $1
        AND source.status = 'active'
        AND target.status = 'active'
    `,
    [sourceServiceSlug]
  );

  return result.rows.map((row) => ({
    sourceServiceSlug: row.source_slug,
    targetServiceSlug: row.target_slug,
    weight: Number(row.weight ?? 0),
    active: Boolean(row.active)
  }));
}

export async function resolveServiceRelations(sourceServiceSlug: string): Promise<ServiceRelation[]> {
  const normalizedSource = normalizeSlug(sourceServiceSlug);
  if (!process.env.DATABASE_URL) {
    return DEFAULT_SERVICE_RELATIONS.filter(
      (relation) => relation.sourceServiceSlug === normalizedSource
    );
  }

  try {
    const dbRelations = await loadRelationsFromDb(normalizedSource);
    if (dbRelations.length > 0) {
      return dbRelations;
    }
  } catch (error) {
    console.warn('resolveServiceRelations fallback to local catalog', error);
  }

  return DEFAULT_SERVICE_RELATIONS.filter(
    (relation) => relation.sourceServiceSlug === normalizedSource
  );
}
