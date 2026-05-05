import {
  getProviderBySlug,
  isProviderTemplateId,
  resolveProviderTemplate
} from '../../../../packages/core/src/public-catalog';
import { getPool } from './db';

export type PublicProviderRecord = {
  id: string;
  slug: string;
  display_name: string;
  description: string;
  city: string;
  services: string[];
  template_id: string;
  reviews_count: number;
  rating_avg: number | null;
};

type PublicProviderRow = {
  id: string;
  slug: string;
  display_name: string;
  description: string | null;
  city_slug: string | null;
  services: string[] | null;
  template_id: string | null;
  reviews_count: string | number;
  rating_avg: string | number | null;
};

function toPublicProviderRecord(row: PublicProviderRow): PublicProviderRecord {
  const fallbackTemplateId = resolveProviderTemplate(row.slug).id;
  const templateId =
    row.template_id && isProviderTemplateId(row.template_id)
      ? row.template_id
      : fallbackTemplateId;
  return {
    id: row.id,
    slug: row.slug,
    display_name: row.display_name,
    description: row.description ?? '',
    city: row.city_slug ?? '',
    services: row.services ?? [],
    template_id: templateId,
    reviews_count: Number(row.reviews_count ?? 0),
    rating_avg: row.rating_avg === null ? null : Number(row.rating_avg)
  };
}

function fallbackPublicProvider(slug: string): PublicProviderRecord | null {
  const provider = getProviderBySlug(slug);
  if (!provider) return null;
  return {
    id: `fallback-${provider.slug}`,
    slug: provider.slug,
    display_name: provider.displayName,
    description: provider.description,
    city: provider.citySlug,
    services: provider.services,
    template_id: provider.templateId,
    reviews_count: 0,
    rating_avg: null
  };
}

export async function resolvePublicProviderBySlug(slug: string): Promise<PublicProviderRecord | null> {
  const normalizedSlug = slug.trim().toLowerCase();
  if (!process.env.DATABASE_URL) {
    return fallbackPublicProvider(normalizedSlug);
  }

  try {
    const pool = getPool();
    const result = await pool.query<PublicProviderRow>(
      `
        SELECT
          p.id::text AS id,
          p.slug,
          p.display_name,
          p.description,
          p.template_id,
          MIN(loc.slug) AS city_slug,
          COALESCE(
            ARRAY_AGG(DISTINCT s.slug) FILTER (WHERE s.slug IS NOT NULL),
            ARRAY[]::text[]
          ) AS services,
          COUNT(r.id) FILTER (WHERE r.status = 'approved') AS reviews_count,
          AVG(r.rating) FILTER (WHERE r.status = 'approved') AS rating_avg
        FROM providers p
        LEFT JOIN provider_services ps
          ON ps.provider_id = p.id
         AND ps.active = true
        LEFT JOIN locations loc
          ON loc.id = ps.location_id
         AND loc.type = 'city'
        LEFT JOIN services s
          ON s.id = ps.service_id
         AND s.status = 'active'
        LEFT JOIN reviews r
          ON r.provider_id = p.id
        WHERE p.slug = $1
          AND p.status = 'active'
        GROUP BY p.id, p.slug, p.display_name, p.description
        LIMIT 1
      `,
      [normalizedSlug]
    );

    if (result.rowCount && result.rowCount > 0) {
      return toPublicProviderRecord(result.rows[0]);
    }
  } catch (error) {
    console.warn('resolvePublicProviderBySlug fallback to local catalog', error);
  }

  return fallbackPublicProvider(normalizedSlug);
}
