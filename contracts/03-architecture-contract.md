---
id: ARCH_03
title: Architecture contract
type: architecture
status: active
priority: high
version: 1.0.0
applies_to:
  - architecture
  - frontend
  - backend
  - database
depends_on:
  - SCOPE_02
related: []
agent_read_policy: when_related
---
# 03 â€” Architecture Contract

## Stack

```txt
Astro + Hono + Postgres
```

## DivisiÃ³n de responsabilidades

### Astro

Responsable de:

- render pÃºblico,
- SEO,
- rutas indexables,
- perfiles pÃºblicos,
- pÃ¡ginas ciudad/servicio,
- contenido editorial,
- formularios pÃºblicos,
- islands ligeras si hace falta.

Astro no debe contener reglas complejas de negocio.

### Hono

Responsable de:

- API,
- auth,
- sesiones,
- proveedores,
- leads,
- cotizaciones,
- reviews,
- reglas de asignaciÃ³n,
- pricing,
- panel dinÃ¡mico,
- webhooks futuros.

### Postgres

Responsable de:

- entidades principales,
- relaciones entre servicios,
- estados,
- eventos,
- reporting,
- bÃºsqueda bÃ¡sica,
- integridad referencial.

### Core package

Responsable de reglas puras:

- validar lead,
- asignar lead,
- sugerir servicios relacionados,
- calcular precio por lead,
- calcular score de proveedor,
- controlar transiciÃ³n de estados.

## Monorepo sugerido

```txt
/apps/web       Astro
/apps/api       Hono
/packages/db    schema, migrations, seeds
/packages/core  reglas puras de dominio
/packages/ui    componentes compartidos opcionales
```

## Principios

1. Las reglas de negocio viven en `packages/core`.
2. La API llama al core.
3. Astro consume API o datos pÃºblicos generados.
4. Postgres es la fuente de verdad.
5. No duplicar lÃ³gica entre Astro y Hono.
6. No introducir microservicios en V1.
7. No introducir bÃºsqueda externa hasta que Postgres no alcance.

## Runtime recomendado

Para simplicidad inicial:

```txt
Node.js + pnpm + Docker Compose + Postgres
```

## Deploy recomendado

V1 simple:

```txt
Astro SSR/static en Node o output estÃ¡tico
Hono API en Node
Postgres administrado o VPS
Nginx/Caddy reverse proxy
```

## Estrategia de render

- PÃ¡ginas estÃ¡ticas para contenido base.
- PÃ¡ginas pÃºblicas dinÃ¡micas/cacheables para proveedor/listados si cambian mucho.
- API para formularios y panel.
- Server islands solo cuando una parte dinÃ¡mica no deba afectar el cachÃ© del resto.

## Regla SEO

Toda pÃ¡gina indexable debe tener:
- contenido Ãºnico,
- propÃ³sito claro,
- proveedores reales o explicaciÃ³n editorial real,
- enlaces internos,
- metadata,
- canonical,
- schema cuando aplique.

No crear miles de pÃ¡ginas vacÃ­as ciudad+servicio.

## Seguridad base

- ValidaciÃ³n server-side.
- Rate limiting en formularios.
- CSRF si se usan cookies.
- SanitizaciÃ³n de inputs.
- ModeraciÃ³n de reviews.
- No exponer datos privados del lead pÃºblicamente.

