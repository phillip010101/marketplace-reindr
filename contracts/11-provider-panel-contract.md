---
id: PROVIDER_PANEL_11
title: Provider panel contract
type: module
status: active
priority: high
version: 1.1.0
applies_to:
  - frontend
  - backend
depends_on:
  - API_06
  - SECURITY_15
related:
  - AUTH_RBAC_28
  - STATE_MACHINE_29
agent_read_policy: when_related
---
# 11 - Provider Panel Contract

## Objetivo

Permitir que proveedores gestionen perfil y oportunidades con un flujo simple, seguro y trazable.

## Modulos

### Perfil

Campos:

- nombre comercial,
- descripcion,
- logo,
- imagen portada,
- telefono,
- WhatsApp,
- web,
- redes opcionales,
- servicios,
- zonas,
- portfolio basico.

### Leads

Lista:

- new,
- viewed,
- contacted,
- quoted,
- won,
- lost,
- rejected,
- invalid.

### Cotizaciones

Crear cotizacion con:

- monto,
- moneda,
- tiempo estimado,
- mensaje,
- adjuntos futuros.

### Metricas

V1:

- leads recibidos,
- leads contactados,
- cotizaciones enviadas,
- cierres reportados.

V1.5:

- tasa de respuesta,
- tiempo de respuesta,
- costo por lead,
- saldo,
- ROI reportado.

## Rutas minimas V1

UI:

- `/panel/login`
- `/panel`
- `/panel/perfil`
- `/panel/leads`
- `/panel/leads/[id]`

API privada:

- `GET /api/provider/me`
- `PATCH /api/provider/me`
- `GET /api/provider/leads`
- `GET /api/provider/metrics`
- `GET /api/provider/leads/:opportunityId`
- `POST /api/provider/leads/:opportunityId/status`
- `POST /api/provider/leads/:opportunityId/quote`

## Reglas

- Proveedor suspendido no accede a nuevos leads.
- Proveedor inactivo no aparece destacado.
- Proveedor sin servicios no puede recibir leads.
- Proveedor debe aceptar terminos antes de recibir leads cobrables.
- Toda ruta privada usa autenticacion bearer y rol `provider`.
- Toda accion sobre oportunidad exige ownership (`opportunity.provider_id == provider.id`).
- Si no existe sesion valida provider, la UI privada redirige a `/panel/login`.
