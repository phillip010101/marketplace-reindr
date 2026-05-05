---
id: PLAN_ALTAS_26
title: Plan resolucion altas
type: governance
status: active
priority: high
version: 1.0.0
applies_to:
  - engineering
  - product
depends_on:
  - REPORTE_DESALINEACIONES_25
related: []
agent_read_policy: when_related
---
# 26 - Plan de resolucion de desalineaciones altas

## Objetivo

Cerrar todas las desalineaciones altas identificadas en `25` con una secuencia ejecutable y verificable.

## Orden de ejecucion recomendado

1. Baseline de plataforma y calidad.
2. Contrato API y convenciones de rutas.
3. Persistencia end-to-end de leads.
4. SEO routes faltantes.
5. Seguridad minima y frontera PII.
6. Seed QA completo.

## Plan detallado

### A1 - Baseline TS + tests minimos

- Desalineaciones cubiertas: H4, H5.
- Entregables:
  - `tsconfig` raiz + referencias por paquete,
  - test runner definido en `core` y `api`,
  - scripts reales de `typecheck` y `test`.
- Dependencias: ninguna.
- Evidencia de cierre:
  - comandos documentados y ejecutables,
  - tests de ejemplo pasando.

### A2 - Normalizacion de prefijos API

- Desalineaciones cubiertas: H1.
- Entregables:
  - contrato y codigo alineados en `/api/provider/*`,
  - lista de rutas definitiva para fases 3-5.
- Dependencias: A1 recomendada.
- Evidencia de cierre:
  - tabla de rutas final en contrato API,
  - smoke requests exitosos en endpoints ajustados.

### A3 - Persistencia completa de `POST /api/leads`

- Desalineaciones cubiertas: H2.
- Entregables:
  - insercion en `leads`,
  - insercion en `lead_requested_services`,
  - creacion de `lead_opportunities`,
  - auditoria en `lead_events`.
- Dependencias: A2.
- Evidencia de cierre:
  - integration test verde,
  - verificacion SQL de registros creados.

### A4 - Completar rutas SEO faltantes

- Desalineaciones cubiertas: H3.
- Entregables:
  - `/servicios`,
  - `/servicios/[service]`,
  - `/proveedores/[provider-slug]`.
- Dependencias: A3 recomendada para datos reales.
- Evidencia de cierre:
  - paginas renderizan con contenido util,
  - metadata/canonical presentes.

### A5 - Seguridad minima y capa de salida por rol

- Desalineaciones cubiertas: H7, H8.
- Entregables:
  - rate limiting en `POST /api/leads`,
  - mapeo DTO por rol/publico,
  - checklist de no exposicion PII en rutas publicas.
- Dependencias: A3.
- Evidencia de cierre:
  - test anti-abuso,
  - test de no exposicion de campos sensibles.

### A6 - Seed QA completo

- Desalineaciones cubiertas: H6.
- Entregables:
  - seed con leads demo,
  - seed con cobertura minima del contrato QA.
- Dependencias: A3 y A4 recomendadas.
- Evidencia de cierre:
  - smoke demo end-to-end,
  - conteos minimos validados por script.

## Criterio de cierre global

- Todas las altas de `25` quedan en estado cerrado.
- Matriz de `24` actualizada a estado `parcial/hecho` por requerimiento.
- Gate de Fase `-1` cumplido segun `21`.

