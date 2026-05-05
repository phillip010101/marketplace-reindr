---
id: DOMAIN_04
title: Domain model contract
type: domain
status: active
priority: high
version: 1.0.0
applies_to:
  - backend
  - database
depends_on:
  - ARCH_03
related: []
agent_read_policy: when_related
---
# 04 â€” Domain Model Contract

## Entidades principales

### Account

Representa una cuenta de usuario.

Campos:
- id
- email
- password_hash o provider auth
- role: client | provider | admin
- status: active | suspended | pending
- created_at
- updated_at

### Provider

Perfil comercial asociado a una cuenta.

Campos:
- id
- account_id
- display_name
- slug
- description
- phone
- whatsapp
- website_url
- logo_url
- cover_url
- status: draft | pending_review | active | suspended
- verified_at
- created_at
- updated_at

### Service

Servicio vendible o buscable.

Campos:
- id
- name
- slug
- description
- parent_id opcional
- status
- base_lead_price
- created_at
- updated_at

### Location

Ciudad, zona o barrio.

Campos:
- id
- name
- slug
- type: country | region | city | zone
- parent_id
- created_at
- updated_at

### ProviderService

RelaciÃ³n entre proveedor, servicio y ubicaciÃ³n.

Campos:
- id
- provider_id
- service_id
- location_id
- service_description
- min_budget
- max_budget
- active
- created_at
- updated_at

### ServiceRelation

RelaciÃ³n entre un servicio principal y servicios complementarios.

Campos:
- id
- source_service_id
- target_service_id
- relation_type: complement | prerequisite | upsell | alternative
- weight
- prompt_label
- active

Ejemplo:

```txt
source: cajas personalizadas
target: troquel
type: complement
label: Â¿TambiÃ©n necesitas troquel?
```

### Lead

Solicitud central del cliente.

Campos:
- id
- public_code
- client_name
- client_email
- client_phone
- city_id
- primary_service_id
- description
- budget_range
- urgency
- source
- status
- consent_at
- created_at
- updated_at

### LeadRequestedService

Servicios solicitados dentro de un lead.

Campos:
- id
- lead_id
- service_id
- is_primary
- notes

### LeadOpportunity

Oportunidad enviada a un proveedor.

Campos:
- id
- lead_id
- provider_id
- service_id
- status: new | viewed | contacted | quoted | won | lost | rejected | invalid
- valid_for_billing
- lead_price
- assigned_at
- viewed_at
- closed_at

### LeadEvent

AuditorÃ­a de eventos.

Campos:
- id
- lead_id
- opportunity_id opcional
- actor_type: system | client | provider | admin
- actor_id opcional
- event_type
- payload jsonb
- created_at

### Quote

CotizaciÃ³n enviada por proveedor.

Campos:
- id
- opportunity_id
- amount
- currency
- estimated_delivery_time
- message
- status: sent | accepted | rejected | expired
- created_at

### Review

ReseÃ±a de cliente hacia proveedor.

Campos:
- id
- provider_id
- lead_id opcional
- rating
- title
- body
- status: pending | approved | rejected
- created_at

### WalletTransaction

Para V1.5.

Campos:
- id
- provider_id
- type: credit | debit | refund | adjustment
- amount
- currency
- reason
- lead_opportunity_id opcional
- created_at

## Estados de Lead

Lead general:

```txt
new
qualified
assigned
in_progress
closed
archived
invalid
```

Oportunidad por proveedor:

```txt
new
viewed
contacted
quoted
won
lost
rejected
invalid
```

## Transiciones vÃ¡lidas

```txt
new -> viewed
viewed -> contacted
contacted -> quoted
quoted -> won
quoted -> lost
new -> rejected
any -> invalid por admin
```

## Invariantes

- Un `Lead` puede tener mÃºltiples `LeadRequestedService`.
- Un `Lead` puede generar mÃºltiples `LeadOpportunity`.
- Una `LeadOpportunity` pertenece a un proveedor y a un servicio.
- El cobro no se hace por `Lead`, se hace por `LeadOpportunity` vÃ¡lida.
- Una review no se publica sin moderaciÃ³n.
- Un proveedor suspendido no recibe leads.

