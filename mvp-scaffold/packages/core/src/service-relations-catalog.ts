import type { ServiceRelation } from './lead-routing';

// Local fallback catalog used when DB-backed relations are unavailable.
// Source-of-truth remains contracts + DB seed; this list keeps local development unblocked.
export const DEFAULT_SERVICE_RELATIONS: ServiceRelation[] = [
  { sourceServiceSlug: 'cajas-personalizadas', targetServiceSlug: 'troqueles', weight: 100, active: true },
  { sourceServiceSlug: 'cajas-personalizadas', targetServiceSlug: 'impresion', weight: 95, active: true },
  { sourceServiceSlug: 'cajas-personalizadas', targetServiceSlug: 'serigrafia-screen', weight: 92, active: true },
  { sourceServiceSlug: 'cajas-personalizadas', targetServiceSlug: 'etiquetas', weight: 90, active: true },
  { sourceServiceSlug: 'cajas-personalizadas', targetServiceSlug: 'diseno-empaque', weight: 88, active: true },
  { sourceServiceSlug: 'cajas-personalizadas', targetServiceSlug: 'fotografia-producto', weight: 84, active: true },
  { sourceServiceSlug: 'cajas-personalizadas', targetServiceSlug: 'landing-page', weight: 82, active: true },
  { sourceServiceSlug: 'cajas-personalizadas', targetServiceSlug: 'ecommerce', weight: 80, active: true }
];
