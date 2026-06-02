import { Hono } from 'hono';
import { PROVIDERS } from '../../../../packages/core/src/public-catalog';
import { toPublicProviderCard, toPublicProviderProfile } from '../lib/dto';
import { resolvePublicProviderBySlug } from '../lib/public-provider';
import { getPool } from '../lib/db';

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

export const providersRoute = new Hono();

providersRoute.get('/', async (c) => {
  const citySlug = c.req.query('city')?.trim().toLowerCase() ?? null;
  const serviceSlug = c.req.query('service')?.trim().toLowerCase() ?? null;

  if (process.env.DATABASE_URL) {
    try {
      const pool = getPool();
      const conditions: string[] = ['p.status = $1'];
      const values: string[] = ['active'];
      let paramIdx = 2;

      if (citySlug) {
        conditions.push(`loc.slug = $${paramIdx++}`);
        values.push(citySlug);
      }

      if (serviceSlug) {
        conditions.push(`s.slug = $${paramIdx++}`);
        values.push(serviceSlug);
      }

      const where = conditions.join(' AND ');

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
              ARRAY_AGG(DISTINCT sv.slug) FILTER (WHERE sv.slug IS NOT NULL),
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
          LEFT JOIN services sv
            ON sv.id = ps.service_id
           AND sv.status = 'active'
          LEFT JOIN services s
            ON s.id = ps.service_id
          LEFT JOIN reviews r
            ON r.provider_id = p.id
          WHERE ${where}
          GROUP BY p.id, p.slug, p.display_name, p.description, p.plan_id
          ORDER BY
            CASE WHEN COALESCE(p.plan_id, 'free') = 'pro_yearly' THEN 0
                 WHEN COALESCE(p.plan_id, 'free') = 'pro_monthly' THEN 1
                 ELSE 2 END,
            p.display_name ASC
        `,
        values
      );

      if (result.rowCount && result.rowCount > 0) {
        const providers = result.rows.map((row) => ({
          id: row.id,
          slug: row.slug,
          display_name: row.display_name,
          description: row.description ?? '',
          services: row.services ?? [],
          city: row.city_slug ?? '',
          template_id: row.template_id ?? 'craft-paper',
          reviews_count: Number(row.reviews_count ?? 0),
          rating_avg: row.rating_avg === null ? null : Number(row.rating_avg)
        }));

        return c.json({
          ok: true,
          data: providers.map((p) => toPublicProviderCard(p))
        });
      }
    } catch {
      // Fall through to static catalog
    }
  }

  let filtered = PROVIDERS;
  if (citySlug) filtered = filtered.filter((p) => p.citySlug === citySlug);
  if (serviceSlug) filtered = filtered.filter((p) => p.services.includes(serviceSlug));

  return c.json({
    ok: true,
    data: filtered.map((provider) =>
      toPublicProviderCard({
        id: `catalog-${provider.slug}`,
        slug: provider.slug,
        display_name: provider.displayName,
        description: provider.description,
        services: provider.services,
        city: provider.citySlug,
        template_id: provider.templateId,
        reviews_count: 0,
        rating_avg: null
      })
    )
  });
});

providersRoute.get('/:slug/portfolio', async (c) => {
  try {
    const slug = c.req.param('slug').trim().toLowerCase();
    const pool = getPool();
    const result = await pool.query(
      `SELECT pi.id::text, pi.url, pi.caption
       FROM portfolio_images pi
       JOIN providers p ON p.id = pi.provider_id
       WHERE p.slug = $1 AND p.status = 'active'
       ORDER BY pi.sort_order ASC, pi.created_at ASC`,
      [slug]
    );
    return c.json({ ok: true, data: result.rows });
  } catch {
    return c.json({ ok: true, data: [] });
  }
});

providersRoute.get('/:slug', async (c) => {
  const slug = c.req.param('slug');
  const provider = await resolvePublicProviderBySlug(slug);

  if (!provider) {
    return c.json(
      {
        ok: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Proveedor no encontrado.'
        }
      },
      404
    );
  }

  return c.json({
    ok: true,
    data: toPublicProviderProfile(provider)
  });
});

providersRoute.get('/:id/leads', async (c) => {
  return c.json({
    ok: true,
    data: []
  });
});

// ── Page view tracking ──────────────────────────────────────────

providersRoute.post('/:slug/view', async (c) => {
  try {
    const slug = c.req.param('slug').trim().toLowerCase();
    const pool = getPool();
    const prov = await pool.query<{ id: string }>(`SELECT id FROM providers WHERE slug=$1 AND status='active' LIMIT 1`, [slug]);
    if (prov.rowCount && prov.rowCount > 0) {
      await pool.query(`INSERT INTO page_views (provider_id) VALUES ($1)`, [prov.rows[0].id]);
    }
  } catch { /* silently ignore tracking errors */ }
  return c.json({ ok: true });
});
