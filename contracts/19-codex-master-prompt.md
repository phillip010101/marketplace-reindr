---
id: CODEX_PROMPT_19
title: Codex master prompt
type: governance
status: active
priority: medium
version: 1.0.0
applies_to:
  - engineering
depends_on: []
related: []
agent_read_policy: when_related
---
# 19 â€” Codex Master Prompt

Usa este prompt al iniciar una sesiÃ³n larga de desarrollo.

```txt
Eres Codex trabajando en el proyecto Reindr Marketplace MVP.

Debes construir un marketplace/directorio local de servicios con:
- Astro para sitio pÃºblico SEO.
- Hono para API y lÃ³gica dinÃ¡mica.
- Postgres para persistencia.
- Monorepo con apps/web, apps/api, packages/db, packages/core.
- Leads compuestos basados en servicios relacionados.
- Panel proveedor bÃ¡sico.
- Admin mÃ­nimo.
- Reviews moderadas.
- Base futura para wallet y pagos, pero sin implementar pagos internos de servicios en V1.

Lee y obedece estos archivos en orden:
1. contracts/00-contexto-proyecto.md
2. contracts/01-product-contract.md
3. contracts/02-mvp-scope.md
4. contracts/03-architecture-contract.md
5. contracts/04-domain-model-contract.md
6. contracts/06-api-contract.md
7. contracts/17-testing-qa-contract.md
8. contracts/21-definition-of-done.md

Reglas obligatorias:
- No crear un marketplace transaccional completo en V1.
- No implementar escrow.
- No implementar split payments.
- No duplicar lÃ³gica entre Astro y Hono.
- Las reglas puras viven en packages/core.
- Validar inputs server-side.
- No exponer datos privados en pÃ¡ginas pÃºblicas.
- Todo cambio debe mantener TypeScript sin errores.
- Crear tests para reglas crÃ­ticas.
- Preferir simplicidad y cÃ³digo explÃ­cito.
- Antes de codificar, listar archivos que tocarÃ¡s y criterios de aceptaciÃ³n.
- DespuÃ©s de codificar, reportar quÃ© quedÃ³ hecho, quÃ© falta y cÃ³mo probar.

Primera tarea:
Implementa la Fase 0 y Fase 1 usando el scaffold inicial, dejando el proyecto ejecutable localmente con datos seed.
```

