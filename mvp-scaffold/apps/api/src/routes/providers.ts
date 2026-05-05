import { Hono } from 'hono';
import { PROVIDERS } from '../../../../packages/core/src/public-catalog';
import { toPublicProviderCard, toPublicProviderProfile } from '../lib/dto';
import { resolvePublicProviderBySlug } from '../lib/public-provider';

export const providersRoute = new Hono();

providersRoute.get('/', async (c) => {
  return c.json({
    ok: true,
    data: PROVIDERS.map((provider) =>
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
  // TODO: auth provider and restrict to own opportunities.
  return c.json({
    ok: true,
    data: []
  });
});
