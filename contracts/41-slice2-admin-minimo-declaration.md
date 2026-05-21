---
id: SLICE2_41
title: Slice 2 declaration — Admin minimo operable
type: governance
status: active
priority: high
version: 1.0.0
applies_to:
  - engineering
  - frontend
  - backend
  - product
depends_on:
  - SLICE1_36
  - PLAN_SLICE1_37
  - PR_BREAKDOWN_38
  - ADMIN_12
  - API_06
  - AUTH_RBAC_28
related:
  - DOD_21
  - TRAZABILIDAD_24
  - TESTING_QA_17
  - RUTA_MAESTRA_39
  - HANDOFF_SLICE1_40
agent_read_policy: always_when_touching_module
---

# 41 — Slice 2: Admin minimo operable

## Purpose

Declarar el segundo slice de implementacion tras el cierre exitoso de `S1-LEAD-COMPUESTO-CORE`. Este slice cubre la Fase 5 del roadmap: modulo admin con UI funcional, persistencia real de eventos, y metrica basica operativa.

## Slice Scope

Slice ID: `S2-ADMIN-MINIMO-OPERABLE`

### In scope (7 items)

1. **Panel admin UI**: paginas de dashboard, leads, providers, services, reviews (Astro SSR, protegidas por auth).
2. **`GET /api/admin/events` real**: reemplazar stub por query a `admin_events` con filtros (fecha, actor, tipo) y paginacion.
3. **`GET /api/admin/metrics`**: endpoint nuevo con agregados (leads por categoria/ciudad, providers activos, tasa de respuesta, ingresos estimados).
4. **Provider management API**: `GET /api/admin/providers` (listar con filtros), `POST /api/admin/providers/:id/approve`, `POST /api/admin/providers/:id/suspend`.
5. **Lead management API**: `GET /api/admin/leads` (listar con filtros), `POST /api/admin/leads/:id/reassign`, `POST /api/admin/leads/:id/mark-invalid`.
6. **Service relations management**: `POST /api/admin/service-relations`, `PATCH /api/admin/service-relations/:id`, `DELETE /api/admin/service-relations/:id`.
7. **DTO boundary enforcement** en todos los endpoints admin nuevos.

### Out of scope (4 exclusions)

1. Wallet / pagos / cobro por lead (Fase 6).
2. Disputas automatizadas.
3. Confirmacion de cierre (Fase 7).
4. Chat interno o notificaciones push.

## What Already Exists (Pre-Slice 2 Baseline)

Endpoints admin ya funcionales sobre DB real:
- `POST /api/admin/services` y `GET /api/admin/services` (CRUD servicios con audit events).
- `PATCH /api/admin/services/:id` (actualizacion de servicio con audit).
- `POST /api/admin/reviews/:id/moderate` (aprobacion/rechazo/flag de reviews con audit).

Endpoints que son stubs y necesitan implementacion real:
- `GET /api/admin/events` → devuelve hardcoded, no consulta `admin_events`.

Endpoints no existentes (hay que crearlos):
- `GET /api/admin/providers` (listado admin de providers).
- `POST /api/admin/providers/:id/approve` y `suspend`.
- `GET /api/admin/leads` (listado admin con filtros).
- `POST /api/admin/leads/:id/reassign` y `mark-invalid`.
- `POST|PATCH|DELETE /api/admin/service-relations`.
- `GET /api/admin/metrics`.

Frontend admin: **no existe**. Hay que crear las paginas Astro desde cero.

## Batches

### Batch 0 — Preflight (sin feature code)
- Generar contexto con `contract-rag context "slice 2 admin minimo" --pack sprint1-readiness`
- Confirmar declaracion de contratos consultados/afectados
- Confirmar migration risk class
- Exit gate: `contract-rag validate` verde, contexto `high`

### Batch 1 — API admin endpoints faltantes
- `GET /api/admin/events` real (query a `admin_events`, filtros, paginacion).
- `GET /api/admin/providers` con filtros (status, ciudad, servicio).
- `POST /api/admin/providers/:id/approve` y `suspend` (transiciones con audit).
- `GET /api/admin/leads` con filtros (status, ciudad, fecha).
- `POST /api/admin/leads/:id/reassign` (reasignar a otro provider, audit).
- `POST /api/admin/leads/:id/mark-invalid` (transicion a invalid, audit).
- Service relations CRUD completo.
- `GET /api/admin/metrics` con agregados desde DB.
- Exit gate: tests de integracion para cada endpoint nuevo.

### Batch 2 — Admin UI (Astro)
- Layout admin protegido (auth check, redireccion si no es admin).
- Dashboard: metricas en tarjetas + graficos simples (leads/dia, providers activos, tasa conversion).
- Leads: tabla con filtros, detalle, acciones (reasignar, invalidar).
- Providers: tabla con filtros, detalle, acciones (aprobar, suspender).
- Services: listado, creacion, edicion (ya tiene API, falta UI).
- Reviews: cola de moderacion, acciones (aprobar, rechazar).
- Service relations: UI de creacion/edicion.
- Exit gate: E2E tests para flujos admin criticos.

### Batch 3 — DTO boundary y hardening
- Verificar que todos los endpoints admin usen DTO `admin_private` (sin leaks de datos sensibles de provider).
- Verificar RBAC: solo rol `admin` accede a estas rutas.
- Rate limiting especifico para rutas admin.
- Exit gate: tests de autorizacion (non-admin rechazado con 403/401).

### Batch 4 — Cierre contractual
- Actualizar `API_06` con nuevos endpoints.
- Actualizar `ADMIN_12` si cambia comportamiento.
- Actualizar `TRAZABILIDAD_24` con evidencia de tests.
- Regenerar contexto.
- Exit gate: `contract-rag validate` verde, contexto `high`.

## Contracts Consulted

- `SLICE1_36`, `PLAN_SLICE1_37`, `PR_BREAKDOWN_38` (patron de slice anterior).
- `ADMIN_12` (modulos admin requeridos).
- `API_06` (endpoints, DTO profiles, error shapes).
- `AUTH_RBAC_28` (roles, ownership, admin-only access).
- `STATE_MACHINE_29` (transiciones admin: approve, suspend, mark-invalid).
- `DTO_BOUNDARY_30` (admin_private DTO profile).
- `MIGRATIONS_31` (si hay cambios de esquema).
- `RUTA_MAESTRA_39` (anti-omission, anti-hardcode, PR contract).

## Contracts Affected

- `API_06` (nuevos endpoints, request/response examples).
- `ADMIN_12` (refinamiento de modulos implementados).
- `STATE_MACHINE_29` (transiciones admin nuevas si aplica).
- `DTO_BOUNDARY_30` (mapeo de endpoints admin).
- `TRAZABILIDAD_24` (nuevos rows de trazabilidad).

## Migration Impact

- **Bajo**: no se esperan nuevas migraciones de esquema en este slice.
- Los endpoints admin operan sobre tablas ya existentes (`admin_events`, `providers`, `leads`, `lead_opportunities`, `services`, `reviews`).
- Si se requiere alguna migracion (ej. indice para queries de metricas), debe ser aditiva con rollback documentado.

## Test Scope

- `IT-admin-events-query` (eventos reales desde DB con filtros).
- `IT-admin-providers-crud` (listar, aprobar, suspender).
- `IT-admin-leads-actions` (reasignar, invalidar).
- `IT-admin-metrics` (agregados correctos).
- `IT-admin-service-relations` (CRUD completo).
- `IT-admin-authz` (non-admin rechazado en todas las rutas).
- `IT-admin-dto-privacy` (datos sensibles no expuestos).
- `E2E-admin-dashboard` (carga, metricas visibles).
- `E2E-admin-leads-flow` (listar → ver → invalidar).
- `E2E-admin-providers-flow` (listar → aprobar → suspender).

## Risks

- **UI-only sin diseno**: si no hay mockups previos, riesgo de retrabajo visual. Mitigacion: usar estilos del panel provider como base.
- **Metricas incorrectas**: queries de agregacion complejos pueden dar datos erroneos. Mitigacion: validar contra queries manuales en seed data conocida.
- **Scope creep**: facil querer meter features de Fase 6 (wallet) al ver datos de leads. Mitigacion: el DOD bloquea cualquier feature fuera de scope declarado.

## Exit Criteria

- Panel admin funcional con todos los modulos del `ADMIN_12`.
- Endpoints admin responden con datos reales de DB (no stubs).
- Tests de integracion y E2E verdes para todos los flujos admin.
- `contract-rag validate` verde.
- Trazabilidad actualizada con evidencia de tests.
