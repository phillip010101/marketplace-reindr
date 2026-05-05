export type PublicProviderCardInput = {
  id: string;
  display_name: string;
  slug?: string;
  description?: string;
  services: string[];
  city: string;
  template_id?: string;
  reviews_count?: number;
  rating_avg?: number | null;
  client_email?: string;
  client_phone?: string;
};

export type ProviderOpportunitySummaryInput = {
  opportunity_id: string;
  opportunity_status: string;
  valid_for_billing: boolean;
  lead_price: number;
  assigned_at: string;
  lead_public_code: string;
  service_slug: string;
};

export type ProviderOpportunityDetailInput = {
  opportunity_id: string;
  opportunity_status: string;
  valid_for_billing: boolean;
  lead_price: number;
  assigned_at: string;
  lead_public_code: string;
  lead_description: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  city_slug: string;
  service_slug: string;
};

export type LeadCreatedPublicInput = {
  lead_public_code: string;
  requested_service_slugs: string[];
  opportunities_count: number;
  message: string;
};

// public profile: never expose PII fields.
export function toPublicProviderCard(input: PublicProviderCardInput) {
  return {
    id: input.id,
    slug: input.slug,
    display_name: input.display_name,
    description: input.description,
    services: input.services,
    city: input.city,
    template_id: input.template_id,
    reviews_count: input.reviews_count ?? 0,
    rating_avg: input.rating_avg ?? null
  };
}

export function toPublicProviderProfile(input: PublicProviderCardInput) {
  return {
    id: input.id,
    slug: input.slug,
    display_name: input.display_name,
    description: input.description,
    services: input.services,
    city: input.city,
    template_id: input.template_id,
    reviews_count: input.reviews_count ?? 0,
    rating_avg: input.rating_avg ?? null
  };
}

// provider_private profile: summary for own opportunities.
export function toProviderOpportunitySummary(input: ProviderOpportunitySummaryInput) {
  return {
    opportunity_id: input.opportunity_id,
    opportunity_status: input.opportunity_status,
    valid_for_billing: input.valid_for_billing,
    lead_price: input.lead_price,
    assigned_at: input.assigned_at,
    lead_public_code: input.lead_public_code,
    service_slug: input.service_slug
  };
}

// provider_private profile: includes lead contact data only for owned opportunity.
export function toProviderOpportunityDetail(input: ProviderOpportunityDetailInput) {
  return {
    opportunity_id: input.opportunity_id,
    opportunity_status: input.opportunity_status,
    valid_for_billing: input.valid_for_billing,
    lead_price: input.lead_price,
    assigned_at: input.assigned_at,
    lead_public_code: input.lead_public_code,
    lead_description: input.lead_description,
    client_name: input.client_name,
    client_email: input.client_email,
    client_phone: input.client_phone,
    city_slug: input.city_slug,
    service_slug: input.service_slug
  };
}

// public response profile for lead creation confirmation.
export function toLeadCreatedPublicResponse(input: LeadCreatedPublicInput) {
  return {
    lead_public_code: input.lead_public_code,
    requested_service_slugs: input.requested_service_slugs,
    opportunities_count: input.opportunities_count,
    message: input.message
  };
}
