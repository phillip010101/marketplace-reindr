---
id: REPORTE_DESALINEACIONES_25
title: Reporte desalineaciones fase 1
type: governance
status: active
priority: high
version: 1.0.0
applies_to:
  - engineering
  - product
depends_on:
  - TRAZABILIDAD_24
related: []
agent_read_policy: when_related
---
# 25 - Reporte de desalineaciones (Fase -1)

Fecha de corte: 2026-04-28

## Resumen ejecutivo

- Desalineaciones criticas: 0
- Desalineaciones altas: 8
- Desalineaciones medias: 6
- Desalineaciones bajas: 4
- Gate recomendado: no iniciar features de Fase 2+ hasta cerrar todas las altas.

## Desalineaciones altas

1. API de proveedor inconsistente con contrato.
- Evidencia: contrato define `/api/provider/*` y codigo actual expone `/api/providers/*`.
- Referencias: `contracts/06-api-contract.md`, `mvp-scaffold/apps/api/src/routes/providers.ts`.
- Riesgo: rompe integracion futura de panel y testing.
- Resolucion: normalizar a prefijo singular `/api/provider/*` en Fase 3.

2. Flujo de leads no persiste en DB.
- Evidencia: `POST /api/leads` valida pero no inserta en `leads`, `lead_requested_services`, `lead_opportunities`, `lead_events`.
- Referencias: `mvp-scaffold/apps/api/src/routes/leads.ts`, `mvp-scaffold/packages/db/schema.sql`.
- Riesgo: no existe trazabilidad operativa ni base de monetizacion.
- Resolucion: implementar persistencia completa en Fase 3.

3. Rutas SEO del MVP incompletas.
- Evidencia: faltan `/servicios`, `/servicios/[service]`, `/proveedores/[provider-slug]`.
- Referencias: `contracts/07-seo-local-contract.md`, `mvp-scaffold/apps/web/src/pages`.
- Riesgo: alcance de Fase 1 no cumplido y baja capacidad de indexacion util.
- Resolucion: completar rutas y contenido en Fase 2.

4. Capa de tests minima no existe.
- Evidencia: scripts `test` son placeholders en API/core.
- Referencias: `mvp-scaffold/apps/api/package.json`, `mvp-scaffold/packages/core/package.json`.
- Riesgo: regresiones sin deteccion temprana.
- Resolucion: suite minima en Fase 0-1.

5. Configuracion TypeScript transversal ausente.
- Evidencia: no hay `tsconfig` en monorepo.
- Referencias: repositorio `mvp-scaffold` actual.
- Riesgo: typecheck no confiable por paquete.
- Resolucion: baseline TS en Fase 0.

6. Seed no cumple criterios QA del contrato.
- Evidencia: no hay leads demo y cobertura insuficiente respecto a DoD QA.
- Referencias: `contracts/17-testing-qa-contract.md`, `mvp-scaffold/packages/db/seed.sql`.
- Riesgo: pruebas E2E/integracion poco representativas.
- Resolucion: ampliar seed en Fase 1.

7. Seguridad minima faltante en endpoint publico critico.
- Evidencia: no hay rate limiting ni controles anti-abuso en `POST /api/leads`.
- Referencias: `contracts/15-security-compliance-contract.md`, `mvp-scaffold/apps/api/src/routes/leads.ts`.
- Riesgo: spam, saturacion y degradacion de calidad de leads.
- Resolucion: agregar rate limit y politicas en Fase 3 (o antes).

8. Falta de frontera clara entre datos publicos y privados en endpoints futuros.
- Evidencia: no existe contrato tecnico implementado de serializacion/redaccion por rol.
- Referencias: `contracts/05-data-contract.md`, rutas API actuales.
- Riesgo: exposicion accidental de PII al crecer endpoints.
- Resolucion: crear capa de mapeo DTO por rol en Fase 3-4.

## Desalineaciones medias

1. Home y pagina ciudad/servicio dependen de datos mock.
- Riesgo: divergencia entre UX y datos reales.
- Fase objetivo: 2.

2. No hay endpoint publico de servicios relacionados.
- Riesgo: UX no puede consumir reglas del dominio de forma consistente.
- Fase objetivo: 3.

3. No hay contrato ejecutable de transicion de estados.
- Riesgo: cambios invalidos de `lead`/`opportunity`.
- Fase objetivo: 1.

4. Falta instrumentacion minima de eventos de producto y negocio.
- Riesgo: no se puede medir conversion ni calidad.
- Fase objetivo: 3-5.

5. No existe baseline de autenticacion/autorizacion.
- Riesgo: bloqueo de panel proveedor/admin.
- Fase objetivo: 4-5.

6. Falta politica de versionado de reglas de pricing.
- Riesgo: inconsistencias historicas de cobro por lead.
- Fase objetivo: 6.

## Desalineaciones bajas

1. Dependencias con version `latest`.
- Riesgo: builds no deterministicos.
- Fase objetivo: 0.

2. Ausencia de componentes UI compartidos definidos.
- Riesgo: duplicacion de codigo visual en fases siguientes.
- Fase objetivo: 2.

3. README del scaffold no refleja fase `-1`.
- Riesgo: flujo de trabajo incompleto para nuevos colaboradores.
- Fase objetivo: 0.

4. Falta checklist operacional post-deploy.
- Riesgo: ejecucion manual inconsistente.
- Fase objetivo: 8.

## Decisiones abiertas

1. Estrategia de auth en MVP.
- Opciones: sesion cookie server-side o JWT stateless.
- Owner sugerido: backend lead.
- Fecha sugerida: antes de Fase 4.

2. Estrategia de acceso DB.
- Opciones: `pg` directo o Drizzle.
- Owner sugerido: backend lead.
- Fecha sugerida: Fase 0.

3. Alcance de E2E en MVP.
- Opciones: solo journeys criticos o cobertura ampliada.
- Owner sugerido: QA/platform.
- Fecha sugerida: Fase 0.

## Backlog bloqueante (must before code de features)

1. Definir y aprobar prefijos finales de API.
2. Definir baseline TS + test runner.
3. Acordar estrategia auth.
4. Completar seed minimo QA.
5. Acordar formato de trazabilidad y actualizarlo por PR.

## Criterio de cierre de Fase -1

- 0 criticas abiertas.
- Altas con plan aprobado y fase objetivo asignada.
- Matriz de trazabilidad (`24`) adoptada como artefacto obligatorio.
