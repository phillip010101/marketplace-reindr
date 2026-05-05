---
id: ANALYTICS_16
title: Analytics observability contract
type: analytics
status: active
priority: medium
version: 1.0.0
applies_to:
  - frontend
  - backend
  - admin
depends_on: []
related: []
agent_read_policy: when_related
---
# 16 â€” Analytics & Observability Contract

## Objetivo

Medir el flujo completo sin sobrecargar el sitio.

## Eventos de producto

### Cliente

- page_view
- search_submitted
- provider_viewed
- lead_form_started
- related_service_selected
- lead_submitted
- confirmation_viewed

### Proveedor

- provider_signup
- profile_completed
- lead_viewed
- lead_contacted
- quote_sent
- lead_won_reported
- lead_lost_reported

### Admin

- provider_approved
- review_approved
- lead_invalidated
- lead_reassigned

## Eventos de negocio

- valid_lead_created
- billable_opportunity_created
- wallet_debited futuro
- dispute_opened futuro
- dispute_resolved futuro
- close_confirmed futuro

## MÃ©tricas

- conversiÃ³n visita -> lead,
- conversiÃ³n formulario iniciado -> enviado,
- servicios relacionados seleccionados por lead,
- leads por fuente,
- leads por ciudad,
- leads por servicio,
- tasa de respuesta,
- tiempo de respuesta,
- tasa de cotizaciÃ³n,
- tasa de cierre reportado,
- tasa de invalidez.

## Observabilidad tÃ©cnica

- request logs,
- error logs,
- slow queries,
- job failures,
- webhook failures futuros.

## Performance

- No cargar scripts pesados en pÃ¡ginas pÃºblicas.
- Tracking mÃ­nimo y diferido.
- Server-side event capture para eventos crÃ­ticos.
- Evitar session replay en V1 si afecta rendimiento o privacidad.

