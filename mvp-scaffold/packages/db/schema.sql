CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  role TEXT NOT NULL CHECK (role IN ('client', 'provider', 'admin')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'pending')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE providers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID REFERENCES accounts(id),
  display_name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  phone TEXT,
  whatsapp TEXT,
  website_url TEXT,
  logo_url TEXT,
  cover_url TEXT,
  template_id TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_review', 'active', 'suspended')),
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_id UUID REFERENCES services(id),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  base_lead_price INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_id UUID REFERENCES locations(id),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('country', 'region', 'city', 'zone')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE provider_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id),
  location_id UUID NOT NULL REFERENCES locations(id),
  service_description TEXT,
  min_budget INTEGER,
  max_budget INTEGER,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(provider_id, service_id, location_id)
);

CREATE TABLE service_relations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  target_service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  relation_type TEXT NOT NULL CHECK (relation_type IN ('complement', 'prerequisite', 'upsell', 'alternative')),
  weight INTEGER NOT NULL DEFAULT 0,
  prompt_label TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(source_service_id, target_service_id)
);

CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  public_code TEXT NOT NULL UNIQUE,
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  city_id UUID NOT NULL REFERENCES locations(id),
  primary_service_id UUID NOT NULL REFERENCES services(id),
  description TEXT NOT NULL,
  budget_range TEXT,
  urgency TEXT,
  source TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'qualified', 'assigned', 'in_progress', 'closed', 'archived', 'invalid')),
  consent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE lead_requested_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id),
  is_primary BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  UNIQUE(lead_id, service_id)
);

CREATE TABLE lead_opportunities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES providers(id),
  service_id UUID NOT NULL REFERENCES services(id),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'viewed', 'contacted', 'quoted', 'won', 'lost', 'rejected', 'invalid')),
  valid_for_billing BOOLEAN NOT NULL DEFAULT false,
  lead_price INTEGER NOT NULL DEFAULT 0,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  viewed_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ
);

CREATE TABLE lead_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  opportunity_id UUID REFERENCES lead_opportunities(id) ON DELETE SET NULL,
  actor_type TEXT NOT NULL CHECK (actor_type IN ('system', 'client', 'provider', 'admin')),
  actor_id UUID,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  opportunity_id UUID NOT NULL REFERENCES lead_opportunities(id) ON DELETE CASCADE,
  amount INTEGER,
  currency TEXT NOT NULL DEFAULT 'COP',
  estimated_delivery_time TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'accepted', 'rejected', 'expired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title TEXT,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'flagged')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE wallet_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('credit', 'debit', 'refund', 'adjustment')),
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'COP',
  reason TEXT NOT NULL,
  lead_opportunity_id UUID REFERENCES lead_opportunities(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_provider_services_lookup ON provider_services(service_id, location_id, active);
CREATE INDEX idx_lead_opportunities_provider_status ON lead_opportunities(provider_id, status);
CREATE INDEX idx_leads_city_service ON leads(city_id, primary_service_id);
CREATE INDEX idx_reviews_provider_status ON reviews(provider_id, status);
CREATE INDEX idx_service_relations_source ON service_relations(source_service_id, active);
