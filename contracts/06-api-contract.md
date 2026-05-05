---
id: API_06
title: API contract
type: api
status: active
priority: high
version: 1.0.0
applies_to:
  - backend
  - frontend
depends_on:
  - DOMAIN_04
  - DATA_05
related: []
agent_read_policy: when_related
---
# 06 - API Contract

## Estilo

API REST simple en Hono.

## Reglas

- Todas las respuestas JSON.
- Errores con estructura consistente.
- Validacion con Zod u otra libreria equivalente.
- Autenticacion para rutas privadas.
- Rate limiting para formularios publicos.
- Logs minimos por request.
- No exponer stack traces en produccion.

## Formato de error

```json
{
  "ok": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Datos invalidos",
    "fields": {
      "email": "Email requerido"
    }
  }
}
```

Para limites de abuso (rate limit), la API responde con:

- HTTP `429`
- `error.code = "RATE_LIMITED"`
- header `Retry-After` en segundos.

## Formato de exito

```json
{
  "ok": true,
  "data": {}
}
```

## Convencion canonica de payload (lead compuesto)

Campo canonico:

- `requested_service_slugs: string[]`

Compatibilidad temporal (deprecado):

- `related_services: string[]`

Regla de migracion:

- durante una ventana de transicion, la API puede aceptar ambos campos,
- internamente siempre debe normalizar a `requested_service_slugs`,
- al cerrar la ventana se elimina `related_services`.

### Politica de normalizacion obligatoria

- Si llegan ambos campos (`requested_service_slugs` y `related_services`), se prioriza `requested_service_slugs`.
- Si solo llega `related_services`, el backend debe mapearlo a `requested_service_slugs` y emitir warning interno.
- Ningun flujo interno (dominio, DB, eventos, analytics) puede persistir el alias `related_services`.
- Respuestas de API para leads deben devolver solo `requested_service_slugs`.

## Rutas publicas

### POST /api/auth/login

Emite token de acceso para rutas privadas.

Body:

```json
{
  "email": "admin@reindr.test",
  "password": "Admin123!"
}
```

Respuesta:

```json
{
  "ok": true,
  "data": {
    "access_token": "<jwt>",
    "token_type": "Bearer",
    "expires_in": 3600,
    "actor": {
      "account_id": "uuid",
      "role": "admin"
    }
  }
}
```

### GET /api/auth/me

Requiere `Authorization: Bearer <token>`.
Devuelve actor resuelto del token.

### GET /api/search

Query:
- q
- city
- service

Respuesta:
- servicios
- proveedores
- ubicaciones

### GET /api/services/:slug/related

Devuelve servicios relacionados.

Query opcional:
- `limit` (1..20, default 8)

Respuesta:

```json
{
  "ok": true,
  "data": {
    "source_service_slug": "cajas-personalizadas",
    "related_service_slugs": ["troqueles", "impresion", "serigrafia-screen"]
  }
}
```

### POST /api/leads

Crea un lead.

Body minimo:

```json
{
  "client_name": "Nombre",
  "client_email": "email@example.com",
  "client_phone": "+57...",
  "city_slug": "bogota",
  "primary_service_slug": "cajas-personalizadas",
  "requested_service_slugs": ["troqueles", "impresion"],
  "description": "Necesito 500 cajas...",
  "budget_range": "500k-1m",
  "urgency": "this_week",
  "consent": true
}
```

Respuesta:

```json
{
  "ok": true,
  "data": {
    "lead_public_code": "LD-2026-0001",
    "requested_service_slugs": ["troqueles", "impresion"],
    "opportunities_count": 3,
    "message": "Solicitud recibida"
  }
}
```

## Rutas proveedor

### GET /api/provider/me

Obtiene perfil propio del provider autenticado.

Respuesta:

```json
{
  "ok": true,
  "data": {
    "id": "uuid",
    "slug": "cajas-acme",
    "display_name": "Cajas Acme",
    "description": "Proveedor ...",
    "phone": "+57...",
    "whatsapp": "+57...",
    "website_url": "https://...",
    "logo_url": "https://...",
    "cover_url": "https://...",
    "status": "active",
    "verified_at": "2026-05-01T00:00:00.000Z",
    "services": ["cajas-personalizadas", "diseno-empaque"]
  }
}
```

### PATCH /api/provider/me

Actualiza perfil propio (campos editables: `display_name`, `description`, `phone`, `whatsapp`, `website_url`, `logo_url`, `cover_url`).

Reglas:

- Requiere al menos un campo editable.
- No permite actualizar perfil de otro provider.

### GET /api/provider/leads

Lista oportunidades asignadas.

### GET /api/provider/metrics

Resumen agregado de oportunidades del provider autenticado.

Respuesta:

```json
{
  "ok": true,
  "data": {
    "total": 12,
    "new": 4,
    "contacted": 3,
    "quoted": 2,
    "closed": 3
  }
}
```

### GET /api/provider/leads/:opportunityId

Detalle de oportunidad.

### POST /api/provider/leads/:opportunityId/status

Actualiza estado.

Body:

```json
{
  "status": "contacted",
  "note": "Contactado por WhatsApp"
}
```

### POST /api/provider/leads/:opportunityId/quote

Crea cotizacion.

Body:

```json
{
  "amount": 700000,
  "currency": "COP",
  "estimated_delivery_time": "7 dias habiles",
  "message": "Incluye diseno basico y entrega local."
}
```

Reglas:

- Solo provider propietario de la oportunidad puede cotizar.
- Debe pasar validacion de transicion a `quoted` (`STATE_MACHINE_29`).
- Si la transicion es valida:
  - inserta fila en `quotes`,
  - actualiza `lead_opportunities.status = quoted`,
  - emite `lead_event` con `event_type = quote_submitted`.

## Rutas admin

### GET /api/admin/leads
### GET /api/admin/providers
### POST /api/admin/services
### PATCH /api/admin/services/:id
### POST /api/admin/service-relations
### PATCH /api/admin/service-relations/:id
### POST /api/admin/providers/:id/approve
### POST /api/admin/reviews/:id/moderate

## Rutas futuras

### POST /api/wallet/topup
### POST /api/payments/mercadopago/webhook
### POST /api/leads/:id/close-confirmation

## Matriz minima endpoint -> perfil DTO

- `GET /api/search` -> `public`
- `GET /api/services/:slug/related` -> `public`
- `POST /api/leads` -> `public` (respuesta sin PII)
- `GET /api/provider/me` -> `provider_private`
- `PATCH /api/provider/me` -> `provider_private`
- `GET /api/provider/leads` -> `provider_private`
- `GET /api/provider/metrics` -> `provider_private`
- `GET /api/provider/leads/:opportunityId` -> `provider_private`
- `POST /api/provider/leads/:opportunityId/status` -> `provider_private`
- `POST /api/provider/leads/:opportunityId/quote` -> `provider_private`
- `GET /api/admin/leads` -> `admin_private`
- `GET /api/admin/providers` -> `admin_private`
- `POST /api/admin/services` -> `admin_private`
- `PATCH /api/admin/services/:id` -> `admin_private`
- `POST /api/admin/service-relations` -> `admin_private`
- `PATCH /api/admin/service-relations/:id` -> `admin_private`
- `POST /api/admin/providers/:id/approve` -> `admin_private`
- `POST /api/admin/reviews/:id/moderate` -> `admin_private`

