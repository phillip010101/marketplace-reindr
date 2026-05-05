export function normalizeSlugList(slugs: string[]): string[] {
  return Array.from(
    new Set(
      slugs
        .map((slug) => slug.trim().toLowerCase())
        .filter(Boolean)
    )
  );
}

export function isSlugValueValid(slug: string): boolean {
  return /^[a-z0-9-]+$/.test(slug);
}

export function findInvalidSlugValues(slugs: string[]): string[] {
  return slugs.filter((slug) => !isSlugValueValid(slug));
}

export function resolveCanonicalRequestedServiceSlugs(input: {
  requested_service_slugs: string[];
  related_services: string[];
}): string[] {
  const source =
    input.requested_service_slugs.length > 0
      ? input.requested_service_slugs
      : input.related_services;

  return normalizeSlugList(source);
}
