import {
  PROVIDER_TEMPLATES,
  getProviderTemplateById,
  type ProviderTemplate,
  type ProviderTemplateId
} from './provider-templates';

export {
  PROVIDER_TEMPLATES,
  getProviderTemplateById,
  getProviderTemplateIds,
  isProviderTemplateId
} from './provider-templates';
export type { ProviderTemplate, ProviderTemplateId } from './provider-templates';

export type ServiceCatalogItem = {
  slug: string;
  name: string;
  description: string;
};

export type ProviderCatalogItem = {
  slug: string;
  displayName: string;
  citySlug: string;
  cityLabel: string;
  description: string;
  services: string[];
  reviews: ProviderReviewCatalogItem[];
  templateId: ProviderTemplateId;
};

export type ProviderReviewCatalogStatus = 'pending' | 'approved' | 'rejected' | 'flagged';

export type ProviderReviewCatalogItem = {
  id: string;
  rating: number;
  title: string;
  body: string;
  authorLabel: string;
  createdAt: string;
  status: ProviderReviewCatalogStatus;
};

export const SERVICES: ServiceCatalogItem[] = [
  {
    slug: 'cajas-personalizadas',
    name: 'Cajas personalizadas',
    description: 'Fabricacion de cajas a medida para ecommerce, retail y marcas de consumo.'
  },
  {
    slug: 'troqueles',
    name: 'Troqueles',
    description: 'Diseno y fabricacion de troqueles para corte y estructuracion de empaques.'
  },
  {
    slug: 'impresion',
    name: 'Impresion',
    description: 'Impresion comercial para empaques, etiquetas y material grafico.'
  },
  {
    slug: 'serigrafia-screen',
    name: 'Serigrafia / Screen',
    description: 'Acabados y personalizacion por screen para empaques y productos.'
  },
  {
    slug: 'etiquetas',
    name: 'Etiquetas',
    description: 'Etiquetas adhesivas y personalizadas para producto, envios y marca.'
  },
  {
    slug: 'diseno-empaque',
    name: 'Diseno de empaque',
    description: 'Diseno grafico y estructural para empaques listos para produccion.'
  },
  {
    slug: 'fotografia-producto',
    name: 'Fotografia de producto',
    description: 'Fotografia para catalogo digital, ecommerce y pauta comercial.'
  },
  {
    slug: 'landing-page',
    name: 'Landing page',
    description: 'Landing pages de captacion para campanas comerciales.'
  },
  {
    slug: 'ecommerce',
    name: 'Ecommerce',
    description: 'Tiendas online y catalogos de producto con foco en conversion.'
  }
];

export const PROVIDERS: ProviderCatalogItem[] = [
  {
    slug: 'cajas-acme',
    displayName: 'Cajas Acme',
    citySlug: 'bogota',
    cityLabel: 'Bogota',
    description: 'Fabricamos empaques para marcas con foco en tiempos cortos y lotes variables.',
    services: ['cajas-personalizadas', 'diseno-empaque'],
    templateId: 'craft-paper',
    reviews: [
      {
        id: 'rvw-1',
        rating: 5,
        title: 'Excelente cumplimiento',
        body: 'Entregaron en tiempo y con buena calidad de impresion.',
        authorLabel: 'Cliente verificado',
        createdAt: '2026-04-18',
        status: 'approved'
      },
      {
        id: 'rvw-2',
        rating: 4,
        title: 'En revision',
        body: 'Esta resena aun esta pendiente de moderacion.',
        authorLabel: 'Cliente pendiente',
        createdAt: '2026-04-22',
        status: 'pending'
      }
    ]
  },
  {
    slug: 'troqueles-norte',
    displayName: 'Troqueles Norte',
    citySlug: 'bogota',
    cityLabel: 'Bogota',
    description: 'Especialistas en troquelado y corte para proyectos editoriales y de empaque.',
    services: ['troqueles', 'serigrafia-screen'],
    templateId: 'urban-ink',
    reviews: []
  },
  {
    slug: 'printlab-bogota',
    displayName: 'PrintLab Bogota',
    citySlug: 'bogota',
    cityLabel: 'Bogota',
    description: 'Impresion y etiquetas para marcas en crecimiento con soporte de produccion.',
    services: ['impresion', 'etiquetas'],
    templateId: 'clean-lab',
    reviews: []
  }
];

const RELATED_SERVICE_MAP: Record<string, string[]> = {
  'cajas-personalizadas': [
    'troqueles',
    'impresion',
    'serigrafia-screen',
    'etiquetas',
    'diseno-empaque',
    'fotografia-producto',
    'landing-page',
    'ecommerce'
  ],
  troqueles: ['cajas-personalizadas', 'impresion'],
  impresion: ['etiquetas', 'serigrafia-screen', 'diseno-empaque']
};

export function getServiceBySlug(slug: string): ServiceCatalogItem | undefined {
  return SERVICES.find((service) => service.slug === slug);
}

export function getServiceName(slug: string): string {
  return getServiceBySlug(slug)?.name ?? slug;
}

export function getRelatedServiceSlugs(serviceSlug: string): string[] {
  return RELATED_SERVICE_MAP[serviceSlug] ?? [];
}

export function getProvidersForServiceInCity(citySlug: string, serviceSlug: string): ProviderCatalogItem[] {
  return PROVIDERS.filter(
    (provider) => provider.citySlug === citySlug && provider.services.includes(serviceSlug)
  );
}

export function getProviderBySlug(slug: string): ProviderCatalogItem | undefined {
  return PROVIDERS.find((provider) => provider.slug === slug);
}

export function getPublicApprovedReviews(providerSlug: string): ProviderReviewCatalogItem[] {
  const provider = getProviderBySlug(providerSlug);
  if (!provider) return [];
  return provider.reviews.filter((review) => review.status === 'approved');
}

export function resolveProviderTemplate(providerSlug: string): ProviderTemplate {
  const provider = getProviderBySlug(providerSlug);
  if (provider) {
    const matched = getProviderTemplateById(provider.templateId);
    if (matched) return matched;
  }
  return PROVIDER_TEMPLATES[0];
}
