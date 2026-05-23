---
id: CONTRACT_TO_CODE_44
title: "Guia: de contrato a codigo funcional"
type: governance
status: active
priority: critical
version: 1.0.0
applies_to:
  - engineering
  - product
  - qa
depends_on:
  - DOD_21
  - RUTA_MAESTRA_39
related:
  - TRAZABILIDAD_24
  - SLICE2_41
agent_read_policy: always_when_touching_module
---

# 44 — Guia: de contrato a codigo funcional

## Proposito

Definir el metodo sistematico para convertir cualquier contrato del proyecto en codigo implementado, verificable y trazable. Todo desarrollo nuevo debe seguir este metodo.

## El metodo: 6 pasos

### Paso 1 — Leer el contrato

Abrir el contrato relevante (ej. `08-leads-billing-rules.md`). Extraer:

- **Entidades** mencionadas (tablas, tipos, campos)
- **Reglas de negocio** explicitas (validaciones, condiciones, invariantes)
- **Endpoints implicados** (si es un contrato de API)
- **DTOs o perfiles de datos** (publico, provider_private, admin_private)
- **Criterios de aceptacion** (que debe pasar para considerar el contrato cumplido)

### Paso 2 — Declarar el slice

Crear o referenciar un slice declaration (ej. `41-slice2-admin-minimo-declaration.md`) que contenga:

```yaml
Slice ID: S3-WALLET-BILLING
In scope: [lista concreta de endpoints, paginas, reglas]
Out of scope: [lo que explicitamente NO se hace]
Batches: [secuencia de PRs]
Test scope: [tests requeridos]
Contracts consulted: [IDs de contratos]
Contracts affected: [IDs que se modifican]
```

### Paso 3 — Batch 0: Preflight

Antes de escribir codigo:

```bash
pnpm contract-rag validate          # Validar integridad contractual
pnpm contract-rag context "tarea" --pack <pack>  # Generar contexto
```

Verificar:
- Context confidence = high
- No contradicciones activas entre contratos
- Migration risk class declarada

### Paso 4 — Implementar por batch

Cada batch = 1 PR. Orden recomendado:

| Batch | Que contiene |
|-------|-------------|
| B1 | Schema/migrations (si aplica) |
| B2 | Endpoints API + validaciones + DTOs |
| B3 | UI (paginas Astro) |
| B4 | DTO boundary + hardening + tests |

Reglas por batch:
- No mezclar schema + UI en el mismo PR
- Cada PR declara: contratos consultados, contratos afectados, migration impact, rollback risk, tests esperados
- Si el comportamiento cambia vs el contrato, actualizar el contrato en el mismo PR

### Paso 5 — Verificar

```bash
pnpm typecheck       # Tipo seguro
pnpm test            # Tests unitarios e integracion
pnpm contract-rag validate  # Sin conflictos contractuales
```

### Paso 6 — Cerrar

- Actualizar `TRAZABILIDAD_24` con: owner, test ID, evidencia (PR/check run), fecha
- Regenerar contexto: `pnpm contract-rag context "..." --pack ...`
- Marcar slice como completado en el contrato de ruta de desarrollo

## Mapa de contratos a packs de contexto

| Contrato | Pack RAG | Para tareas de |
|----------|----------|----------------|
| `API_06` | `sprint1-slice-execution-plan` | Endpoints, DTOs, error shapes |
| `LEADS_BILLING_08` | `lead-compuesto` | Leads, billing, precios |
| `STATE_MACHINE_29` | `sprint1-slice-execution-plan` | Transiciones de estado |
| `AUTH_RBAC_28` | `provider-identity-authz` | Auth, roles, ownership |
| `DTO_BOUNDARY_30` | `provider-identity-authz` | DTO public/private |
| `MIGRATIONS_31` | `migration-safety` | Schema, rollbacks |
| `ADMIN_12` | `sprint1-readiness` | Admin modules |
| `MONETIZATION_09` | (crear `wallet-billing`) | Wallet, cobros |
| `SEO_07` | (crear `content-seo`) | Contenido, SEO |

## Ejemplo concreto: implementar wallet billing

```
1. Contrato: 08-leads-billing-rules.md + 09-monetization-contract.md
2. Slice: S3-WALLET-BILLING (nuevo archivo 45-*.md)
3. Preflight: validate + context --pack wallet-billing
4. B1: agregar indice en wallet_transactions, migration
5. B2: POST /api/provider/wallet/topup, GET /api/provider/wallet/balance,
        POST /api/admin/leads/:oppId/charge, GET /api/admin/billing/ledger
6. B3: UI wallet en panel provider, UI billing en admin
7. B4: DTO boundary, validar precios, tests
8. Verificar: typecheck + test + validate
9. Cerrar: actualizar trazabilidad, regenerar contexto
```

## Regla de oro

**Nunca escribir codigo sin contrato. Si el contrato no existe, crearlo primero.**
