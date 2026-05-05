---
id: CIERRE_PREDEV_34
title: Plan de cierre pre-desarrollo
type: governance
status: active
priority: high
version: 1.0.0
applies_to:
  - engineering
  - product
  - qa
depends_on:
  - ANALISIS_33
  - NEXT_STEP_32
  - REPORTE_DESALINEACIONES_25
  - DOD_21
related:
  - TRAZABILIDAD_24
  - AUTH_RBAC_28
  - STATE_MACHINE_29
  - DTO_BOUNDARY_30
  - MIGRATIONS_31
agent_read_policy: always_when_touching_module
---

# 34 - Plan de cierre pre-desarrollo

## Purpose

Convertir el analisis contractual en una secuencia ejecutable de cierre de desalineaciones antes de iniciar desarrollo funcional.

## Non-Negotiable Rules

- No iniciar features mientras exista un item P0 abierto de este contrato.
- Cada cierre debe dejar evidencia en contrato o decision log, no solo en chat.
- Si una regla cambia comportamiento de negocio, el contrato afectado se actualiza primero.

## Estado Consolidado

- Validacion contractual: verde.
- RAG operativo: verde en local-cache.
- Riesgo residual principal: ambiguedades operativas y items pendientes de trazabilidad fase -1.
- Cierre P0 contractual (documentacion): completado el 2026-05-01.

## Backlog de Cierre por Prioridad

### P0 - Debe cerrarse antes de Sprint 1

1. Canonicalizacion final de payload lead compuesto:
   - Fuente: `AUDITORIA_V2_27`, `API_06`, `LEADS_BILLING_08`
   - Cierre esperado: ejemplos de request/response y alias policy en contrato API.
2. Matriz de transiciones con ownership por rol:
   - Fuente: `STATE_MACHINE_29`, `AUTH_RBAC_28`, `PROVIDER_PANEL_11`, `ADMIN_12`
   - Cierre esperado: quien puede disparar cada transicion y desde que estado.
3. Frontera DTO publica/privada cerrada por endpoint:
   - Fuente: `DTO_BOUNDARY_30`, `SEO_07`, `API_06`
   - Cierre esperado: tabla endpoint -> perfil DTO (`public`, `provider_private`, `admin_private`).
4. Plan de migraciones y rollback para cambios de esquema de fase 0:
   - Fuente: `MIGRATIONS_31`, `DATA_05`, `DOD_21`
   - Cierre esperado: orden de migraciones, riesgos, rollback notes.

### Estado P0 (Contractual)

- P0.1 Payload canonico lead compuesto: cerrado en `API_06` y `LEADS_BILLING_08`.
- P0.2 Matriz rol/transicion: cerrado en `STATE_MACHINE_29`.
- P0.3 Mapeo endpoint -> perfil DTO: cerrado en `API_06` y `DTO_BOUNDARY_30`.
- P0.4 Plan migraciones + rollback: cerrado en `MIGRATIONS_31`.

### P1 - Cerrar durante preparacion de Sprint 1

1. Cerrar pendientes de `TRAZABILIDAD_24` para items fase 0 (owner + status + evidencia).
2. Definir criterios QA minimos por caso critico (`TESTING_QA_17`).
3. Ajustar decisiones activas si aparece nueva regla no documentada.

### P2 - Preparacion de escalamiento

1. Activar modo DB para Contract RAG (`DATABASE_URL` + `migrate`).
2. Incorporar semantic retrieval real con embeddings remotos cuando haya key.
3. Revisar contratos "future" para separarlos de alcance inmediato.

## Ruta de Ejecucion Recomendada (Sin Desarrollo Funcional)

1. Ejecutar `contract-rag context` con pack `pre-development-audit-v3`.
2. Abrir lista de huecos P0 y convertir cada uno en amendment contractual.
3. Re-ejecutar `validate`, `index` y `context` por cada amendment.
4. Cuando P0 = 0, emitir decision de readiness para iniciar Sprint 1.

## Evidencia Minima de Cierre

- Diff de contrato actualizado.
- Relacion grafo actualizada si cambia dependencia.
- Bundle de contexto regenerado con confianza `high`.
- Registro en decision log cuando aplique.

## Exit Criteria

- No quedan items P0 abiertos.
- `contract-rag validate` permanece en verde.
- `next-step-execution` y `pre-development-audit-v3` generan contexto consistente.
- Equipo puede declarar inicio de Sprint 1 sin contradicciones contractuales activas.
