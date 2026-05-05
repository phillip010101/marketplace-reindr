export type LeadInput = {
  client_name: string;
  client_email: string;
  client_phone: string;
  city_slug: string;
  primary_service_slug: string;
  description: string;
  consent: boolean;
};

export type ValidationResult =
  | { ok: true }
  | { ok: false; reason: string };

export function validateLeadInput(input: LeadInput): ValidationResult {
  if (!input.consent) {
    return { ok: false, reason: 'El cliente debe aceptar consentimiento de contacto.' };
  }

  if (input.description.trim().length < 10) {
    return { ok: false, reason: 'La descripción es demasiado corta.' };
  }

  if (!input.city_slug || !input.primary_service_slug) {
    return { ok: false, reason: 'Ciudad y servicio son requeridos.' };
  }

  return { ok: true };
}

export type ServiceRelation = {
  sourceServiceSlug: string;
  targetServiceSlug: string;
  weight: number;
  active: boolean;
};

export function getRelatedServices(
  sourceServiceSlug: string,
  relations: ServiceRelation[]
): string[] {
  return relations
    .filter((relation) => relation.active && relation.sourceServiceSlug === sourceServiceSlug)
    .sort((a, b) => b.weight - a.weight)
    .map((relation) => relation.targetServiceSlug);
}

export type ProviderMatchInput = {
  providerId: string;
  serviceSlug: string;
  citySlug: string;
  active: boolean;
};

export function matchProvidersForLead(
  requestedServiceSlugs: string[],
  citySlug: string,
  providers: ProviderMatchInput[]
): ProviderMatchInput[] {
  const requested = new Set(requestedServiceSlugs);

  return providers.filter((provider) => {
    return provider.active && provider.citySlug === citySlug && requested.has(provider.serviceSlug);
  });
}
