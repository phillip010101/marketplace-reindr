---
id: TESTING_QA_17
title: Testing QA contract
type: qa
status: active
priority: high
version: 1.0.0
applies_to:
  - frontend
  - backend
  - database
depends_on:
  - API_06
  - DOMAIN_04
related: []
agent_read_policy: when_related
---
# 17 â€” Testing & QA Contract

## Objetivo

Evitar que Codex avance rompiendo flujos crÃ­ticos.

## Tests mÃ­nimos

### Unit tests

- validar lead,
- sugerir servicios relacionados,
- asignar proveedores,
- calcular precio por lead,
- transiciÃ³n de estado.

### Integration tests

- POST /api/leads crea lead,
- asigna oportunidades,
- no asigna proveedores suspendidos,
- permite actualizar estado,
- permite crear cotizaciÃ³n,
- evita acceso a leads de otro proveedor.

### Suite minima obligatoria para readiness Sprint 1

- Lead compuesto:
  - `IT-leads-create` valida persistencia de `requested_service_slugs`.
  - `E2E-lead-flow-3-steps` valida flujo web -> API -> confirmacion.
- Authz ownership:
  - `IT-provider-ownership` valida que proveedor no accede oportunidades ajenas.
  - `IT-provider-leads-authz` valida guards de rutas privadas de proveedor.
- DTO privacidad:
  - `E2E-no-pii-public-pages` valida ausencia de PII en paginas publicas.
  - `IT-api-error-shape` valida shape consistente sin leak de detalles internos.

### E2E tests

Flujo cliente:

1. abre pÃ¡gina ciudad+servicio,
2. envÃ­a solicitud,
3. selecciona servicios relacionados,
4. ve confirmaciÃ³n.

Flujo proveedor:

1. login,
2. ve lead,
3. marca contactado,
4. envÃ­a cotizaciÃ³n.

Flujo admin:

1. aprueba proveedor,
2. modera review,
3. edita relaciÃ³n de servicio.

## Criterios de aceptaciÃ³n

- No hay errores TypeScript.
- Lint pasa.
- Tests core pasan.
- API devuelve errores consistentes.
- No datos privados en pÃ¡ginas pÃºblicas.
- SEO bÃ¡sico en rutas pÃºblicas.
- Seed permite demo local.

## Datos demo

Debe existir seed con:

- 5 servicios,
- 3 ciudades,
- 5 proveedores,
- relaciones de servicios,
- 3 reviews aprobadas,
- 2 leads demo.

