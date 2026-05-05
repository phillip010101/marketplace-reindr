---
id: ANALISIS_33
title: Analisis integral de siguiente paso V3
type: governance
status: active
priority: high
version: 1.0.0
applies_to:
  - engineering
  - product
  - architecture
depends_on:
  - AUDITORIA_V2_27
  - NEXT_STEP_32
  - DOD_21
related:
  - AUTH_RBAC_28
  - STATE_MACHINE_29
  - DTO_BOUNDARY_30
  - MIGRATIONS_31
agent_read_policy: always_when_touching_module
---

# 33 - Analisis integral de siguiente paso V3

## Purpose

Definir el siguiente paso ejecutable sin iniciar desarrollo, cerrando desalineaciones operativas entre contratos y Contract RAG.

## Non-Negotiable Rules

- No iniciar implementacion funcional hasta cerrar los gates de este contrato.
- Si una decision operativa cambia el orden de ejecucion, actualizar este contrato y `32-next-step-execution-contract.md`.
- El contexto generado por RAG debe incluir evidencia trazable a archivos y headings.

## Current Gaps Detected

### Gap A - Operacion del CLI desde la raiz

- Riesgo: friccion al ejecutar comandos si el agente esta en la raiz del repo.
- Estado: mitigado con script puente en `package.json` de raiz.
- Criterio de cierre: `pnpm contract-rag validate` funciona desde raiz.

### Gap B - Cobertura de contratos requeridos en context bundle

- Riesgo: pack seleccionado pero extractos concentrados en un solo contrato.
- Estado: mitigado con boost y cobertura minima por `preferredContractIds`.
- Criterio de cierre: al usar `--pack`, el top de extractos incluye contratos requeridos disponibles.

### Gap C - Semantica de "used contracts"

- Riesgo: lectura incompleta del output y decisiones con contexto parcial.
- Estado: mitigado incluyendo requeridos/relacionados en `usedContractIds`.
- Criterio de cierre: salida de `context` reporta contratos del pack y no solo extractos.

### Gap D - Infraestructura DB para modo completo

- Riesgo: no hay trazabilidad historica de consultas ni vector search real en Postgres.
- Estado: pendiente.
- Criterio de cierre: `DATABASE_URL` + `migrate` operativos.

## Ordered Next Steps (Pre-Development)

1. Confirmar baseline operativo:
   - `pnpm contract-rag:ensure`
   - `pnpm contract-rag validate`
   - `pnpm contract-rag index`
2. Ejecutar bundle con packs criticos:
   - `next-step-execution`
   - `lead-compuesto`
   - `provider-identity-authz`
   - `migration-safety`
3. Registrar vacios detectados:
   - reglas ambiguas,
   - campos sin dueno en DTO,
   - transiciones sin responsable de rol,
   - migraciones sin rollback.
4. Actualizar contratos afectados antes de cualquier PR de features.

## Gate Checklist

- Gate 0 (Contract baseline): `validate` en verde y sin referencias huerfanas.
- Gate 1 (Context quality): cada pack critico produce contexto con confianza `high`.
- Gate 2 (Determinismo): decisiones activas y reglas criticas aparecen en bundle.
- Gate 3 (Readiness): backlog de implementacion sale de contratos, no de supuestos.

## Exit Criteria

- Existe una secuencia unica de ejecucion entre contratos 27, 32 y 33.
- No hay contradicciones abiertas entre RBAC, state machine, DTO y migraciones.
- El equipo puede iniciar Sprint 1 con criterios de entrada/salida verificables.
