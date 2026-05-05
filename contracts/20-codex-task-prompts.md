---
id: CODEX_TASKS_20
title: Codex task prompts
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
# 20 - Prompts de tareas para Codex (alineados al roadmap)

## Prompt Fase -1 - Alineacion contractual

```txt
Objetivo:
Cerrar desalineaciones antes de construir nuevas features.

Tareas:
- Crear matriz contrato -> entidad -> endpoint -> pantalla -> test.
- Listar contradicciones entre contracts/01..17 y el scaffold real.
- Clasificar desalineaciones por severidad: critica/alta/media/baja.
- Proponer resolucion concreta por cada desalineacion critica/alta.

Salida esperada:
- reporte de gaps,
- backlog bloqueante,
- contratos actualizados si aplica.
```

## Prompt Fase 0 - Plataforma base y calidad minima

```txt
Objetivo:
Dejar monorepo reproducible, verificable y con control minimo de calidad.

Tareas:
- Unificar tsconfig en apps y packages.
- Validar variables de entorno en arranque.
- Agregar scripts reales de typecheck/test/smoke.
- Configurar CI minima (typecheck + tests core + smoke API).

Criterios:
- pnpm install funciona.
- pnpm dev levanta web/api.
- docker compose levanta Postgres.
- pipeline minimo verde.
```

## Prompt Fase 1 - Dominio y datos canonicos

```txt
Objetivo:
Alinear reglas de negocio con schema y seed para evitar deuda temprana.

Tareas:
- Reconciliar domain model con schema SQL.
- Completar seed para QA (servicios/ciudades/proveedores/reviews/leads demo).
- Implementar tests unitarios de core:
  - validateLeadInput,
  - getRelatedServices,
  - matchProvidersForLead,
  - calculateLeadPrice,
  - transiciones de estado.

Criterios:
- invariantes de negocio representados en DB y core.
- seed suficiente para demo y pruebas.
```

## Prompt Fase 2 - Directorio publico SEO

```txt
Objetivo:
Publicar rutas utiles y indexables sin paginas vacias.

Rutas:
- /
- /servicios
- /servicios/[service]
- /[city]/[service]
- /proveedores/[provider-slug]

Tareas:
- metadata + canonical + enlazado interno.
- provider/service cards reutilizables.
- no exponer datos privados.

Criterios:
- contenido util por ruta.
- CTA principal visible sin JS pesado.
```

## Prompt Fase 3 - Leads compuestos end-to-end

```txt
Objetivo:
Implementar flujo completo de lead con persistencia y auditoria.

API:
- POST /api/leads
- GET /api/services/:slug/related

Core:
- validateLeadInput
- getRelatedServices
- createLeadOpportunities
- deduplicacion inicial

Persistencia:
- leads
- lead_requested_services
- lead_opportunities
- lead_events

Criterios:
- respuesta con lead_public_code estable.
- errores consistentes.
- test de integracion para creacion de lead.
```

## Prompt Fase 4 - Panel proveedor

```txt
Objetivo:
Permitir gestion de oportunidades con autorizacion estricta.

UI:
- /panel
- /panel/perfil
- /panel/leads
- /panel/leads/[id]

API:
- GET/PATCH /api/provider/me
- GET /api/provider/leads
- POST /api/provider/leads/:id/status
- POST /api/provider/leads/:id/quote

Criterios:
- proveedor solo accede a sus oportunidades.
- estados validos y cotizacion auditada.
```

## Prompt Fase 5 - Admin minimo

```txt
Objetivo:
Habilitar operacion manual controlada del marketplace.

UI/API:
- proveedores: aprobar/suspender
- servicios: CRUD
- relaciones de servicios: CRUD
- leads: listar/ver/reasignar/invalidar
- reviews: moderar

Criterios:
- toda accion admin deja evento.
- no sobre-disenar; foco en operabilidad.
```

## Prompt Fase 6 - Monetizacion V1.5

```txt
Objetivo:
Activar cobro por oportunidad valida con wallet, sin pagos de servicios.

Tareas:
- creditos/debitos/refunds en wallet_transactions.
- regla: debitar solo cuando valid_for_billing=true.
- disputa basica con estados y resolucion.

Criterios:
- ledger consistente por oportunidad.
- no integrar pasarela de pago de servicios.
```

## Prompt Fase 7 - Cierre y reputacion

```txt
Objetivo:
Medir cierres y calidad de proveedores.

Tareas:
- estados de cierre reportado/confirmado.
- eventos y metricas de cierre.
- score de confianza inicial y badges V1.

Criterios:
- cierres auditables.
- score explicable por datos disponibles.
```

## Prompt Fase 8 - Hardening pre-produccion

```txt
Objetivo:
Reducir riesgo antes de escalar trafico y onboarding de proveedores.

Tareas:
- cerrar gaps de seguridad y observabilidad.
- suite minima de QA completa.
- runbooks de incidentes y backup/restore.

Criterios:
- checklist pre-produccion aprobado.
```

## Prompt Fase 9 - Go-live controlado

```txt
Objetivo:
Lanzar un solo micromercado con aprendizaje rapido y control de calidad.

Tareas:
- rollout limitado (Bogota + vertical grafico).
- tablero semanal de conversiones.
- ajustes de matching y pricing con evidencia.

Criterios:
- cumplir umbrales de viabilidad antes de expandir.
```
