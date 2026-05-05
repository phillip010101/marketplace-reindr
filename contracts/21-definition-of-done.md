---
id: DOD_21
title: Definition of done
type: governance
status: active
priority: high
version: 1.0.0
applies_to:
  - engineering
  - qa
depends_on:
  - ROADMAP_18
  - TESTING_QA_17
related: []
agent_read_policy: when_related
---
# 21 - Definition of Done (alineado al roadmap)

## Reglas generales (aplican a toda fase)

Una fase esta completa solo si:

- compila,
- typecheck pasa,
- tests de la fase pasan,
- hay forma de prueba manual documentada,
- no rompe contratos previos,
- no expone datos privados,
- no agrega complejidad fuera del alcance de fase,
- tiene owner operativo y tecnico.

## Gate de desalineacion transversal

Antes de cerrar fase:

- no hay desalineaciones criticas abiertas,
- las desalineaciones altas tienen plan y fecha,
- rutas/API/UI/DB/test del alcance estan trazadas,
- contratos actualizados reflejan la implementacion real.

---

## Fase -1: Alineacion contractual

- Existe matriz contrato -> entidad -> endpoint -> pantalla -> test.
- Existe matriz de desalineaciones por severidad.
- Cero desalineaciones criticas abiertas.
- Bloqueantes de arranque priorizados.

## Fase 0: Plataforma base y calidad minima

- Monorepo estable (web + api + db + core).
- Docker Compose levanta Postgres.
- Env example completo y validado en runtime.
- Scripts reales de typecheck/test/smoke.
- CI minima ejecutando controles base.

## Fase 1: Dominio y datos canonicos

- Domain model y schema reconciliados.
- Seed apto para QA:
  - >=5 servicios,
  - >=3 ciudades,
  - >=5 proveedores,
  - relaciones de servicios,
  - >=3 reviews aprobadas,
  - >=2 leads demo.
- Reglas core criticas con unit tests.

## Fase 2: Directorio publico SEO

- Home visible.
- Rutas SEO minimas implementadas:
  - `/servicios`,
  - `/servicios/[service]`,
  - `/[city]/[service]`,
  - `/proveedores/[provider-slug]`.
- Metadata basica + canonical.
- Paginas utiles, sin thin content intencional.
- No depende de JS pesado para flujo principal.

## Fase 3: Leads compuestos

- `POST /api/leads` funciona con validacion server-side.
- `GET /api/services/:slug/related` funciona.
- Se crean registros en:
  - `leads`,
  - `lead_requested_services`,
  - `lead_opportunities`,
  - `lead_events`.
- Errores consistentes segun contrato API.

## Fase 4: Panel proveedor

- Proveedor ve sus oportunidades asignadas.
- Proveedor no puede ver oportunidades ajenas.
- Puede cambiar estado con transiciones validas.
- Puede enviar cotizacion asociada a oportunidad.

## Fase 5: Admin minimo

- Admin puede aprobar/suspender proveedores.
- Admin puede crear/editar servicios.
- Admin puede gestionar relaciones entre servicios.
- Admin puede ver/reasignar/invalidar leads.
- Admin puede moderar reviews.
- Acciones admin dejan eventos auditables.

## Fase 6: Monetizacion V1.5

- Wallet registra creditos/debitos/refunds.
- Debito solo para oportunidad valida y auditable.
- Disputa basica puede terminar en refund.
- No hay pasarela de pagos de servicios todavia.

## Fase 7: Cierre y reputacion

- Cierre reportado funciona.
- Confirmacion de cierre queda auditada.
- Metricas basicas de cierre visibles.
- Score de confianza inicial trazable a datos.

## Fase 8: Hardening pre-produccion

- Suite minima QA (unit + integration + E2E critica) en verde.
- Reglas de seguridad base aplicadas.
- Observabilidad tecnica minima activa.
- Runbook de incidentes y restore de backup verificado.

## Fase 9: Go-live controlado

- Rollout limitado por micromercado activo.
- Tablero semanal de metricas de negocio y operacion.
- Criterios de expansion documentados y medibles.
