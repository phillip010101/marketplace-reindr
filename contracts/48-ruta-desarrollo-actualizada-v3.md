---
id: RUTA_ACTUALIZADA_48
title: Ruta de desarrollo maestra — Mayo 2026 (post-auditoria)
type: governance
status: active
priority: critical
version: 3.0.0
applies_to:
  - engineering
  - product
  - qa
depends_on:
  - RUTA_DESARROLLO_42
  - CONTRACT_TO_CODE_44
  - ONBOARDING_FLOW_43
related:
  - DOD_21
  - TRAZABILIDAD_24
agent_read_policy: always_when_touching_module
---

# 48 — Ruta de desarrollo maestra (actualizada)

## Mapa de contratos a implementacion

```
CONTRATO                    →   IMPLEMENTACION              ESTADO
────────────────────────────────────────────────────────────────
00-contexto-proyecto        →   README + vision             ✅
01-product-contract         →   Funcionalidades core         ✅ (90%)
02-mvp-scope                →   Alcance MVP                  ✅ (85%)
03-architecture-contract    →   Stack Astro+Hono+Postgres    ✅
04-domain-model-contract    →   schema.sql + types           ✅
05-data-contract            →   Migraciones + seed           ✅
06-api-contract             →   Endpoints REST               ✅ (90%)
07-seo-local-contract        →   Rutas publicas + metadata    ✅ (80%)
08-leads-billing-rules       →   pricing.ts + valid_for_bill  ✅ (logica)
09-monetization-contract     →   (falta implementar)         🔲
10-ui-ux-contract            →   Paginas Astro                ✅ (80%)
11-provider-panel-contract   →   Panel proveedor              ✅
12-admin-contract            →   Admin API + UI               ✅
13-reviews-trust-contract    →   Reviews moderation           ✅
14-payments-future-contract  →   (V2, no implementar)        ⏸️
15-security-compliance       →   DTO + RBAC + rate limit     ✅
16-analytics-observability   →   (futuro)                    🔲
17-testing-qa-contract       →   36 tests pasando            ✅ (parcial)
18-phases-roadmap            →   10 fases definidas           ✅
21-definition-of-done        →   Criterios DOD               📋
24-matriz-trazabilidad       →   Trazabilidad fase 1         ✅ (parcial)
28-auth-rbac-contract        →   JWT + roles + ownership     ✅
29-state-machine-contract    →   Transiciones validadas      ✅
30-public-private-dto        →   DTO profiles                ✅
31-migrations-versioning     →   5 migraciones               ✅
44-contract-to-code-guide    →   **ESTE DOCUMENTO**          🆕
45-wallet-billing-impl       →   Wallet endpoints            🔲
46-content-seo-impl          →   Blog posts + SEO            🔲
47-locations-disputes-images →   CRUD ubicaciones + disputas 🔲
```

## Slices pendientes

### Slice 3: Wallet y Billing (Fase 6)
**Contrato**: `45-wallet-billing-implementation.md`

| Batch | Contenido |
|-------|-----------|
| B1 | Indices en wallet_transactions |
| B2 | 5 endpoints (wallet provider + billing admin) |
| B3 | UI: wallet en panel provider, billing tab en admin |
| B4 | DTO + tests |

### Slice 4: Contenido SEO (Fase 2.5)
**Contrato**: `46-content-seo-implementation.md`

| Batch | Contenido |
|-------|-----------|
| B1 | Content collection config |
| B2 | 5 posts iniciales + /publicaciones + /publicaciones/[slug] |
| B3 | Schema JSON-LD, sitemap, robots.txt |
| B4 | SEO checks (meta, canonical, noindex) |

### Slice 5: Ubicaciones + Disputas + Imagenes (Fase 5.5)
**Contrato**: `47-locations-disputes-images.md`

| Batch | Contenido |
|-------|-----------|
| B1 | POST/PATCH /api/admin/locations |
| B2 | Dispute endpoints (provider + admin) |
| B3 | UI: admin ubicaciones, dispute resolution |
| B4 | DTO + tests |

## Metodo de trabajo (de ahora en adelante)

```
1. Elegir slice del mapa de arriba
2. Leer contrato correspondiente
3. Ejecutar preflight (validate + context)
4. Implementar batch por batch (schema → API → UI → hardening)
5. Verificar (typecheck + test + validate)
6. Cerrar (trazabilidad + commit + push)
```

## Estado general

| Fase | Nombre | Estado |
|------|--------|--------|
| -1 | Alineacion contractual | ✅ |
| 0 | Plataforma base | ✅ |
| 1 | Dominio canonico | ✅ |
| 2 | Directorio publico SEO | ✅ (80%) |
| 3 | Leads compuestos | ✅ |
| 4 | Panel proveedor | ✅ |
| 5 | Admin minimo | ✅ |
| 6 | Monetizacion V1.5 | 🔲 Slice 3 |
| 7 | Cierre y reputacion | 🔲 |
| 8 | Hardening pre-prod | 🔲 |
| 9 | Escalamiento | 🔲 |

### Proxima sesion: Slice 3 (Wallet y Billing)
```
Batch 1: indices wallet_transactions
Batch 2: GET/POST /api/provider/wallet, GET/POST /api/admin/billing/*
Batch 3: UI wallet en panel provider, billing tab en admin
Batch 4: DTO boundary + tests
```
