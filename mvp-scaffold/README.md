# MVP Scaffold — Astro + Hono + Postgres

Este scaffold es una base inicial, no una app completa final.

## Estructura

```txt
apps/web       Astro público
apps/api       Hono API
packages/db    SQL schema + seed
packages/core  reglas puras
packages/ui    componentes futuros
```

## Setup sugerido

```bash
pnpm install
docker compose up -d
pnpm db:migrate
pnpm dev
```

Si no vas a usar DB de inmediato, puedes avanzar con el flujo contractual/RAG en local-cache:

```bash
pnpm contract-rag:ensure
pnpm typecheck
pnpm test
```

`contract-rag:ensure` corre en modo `full` por defecto (init + validate + index + context).
Para modo rapido (solo init), define:

```bash
CONTRACT_RAG_ENSURE_MODE=baseline
```

## Variables

Copiar `.env.example` a `.env`.

## Orden de implementación

1. DB schema + seed.
2. API health.
3. Servicios y proveedores públicos.
4. Lead form.
5. Panel proveedor.
6. Admin.
