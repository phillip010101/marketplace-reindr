---
id: ROADMAP_18
title: Phases roadmap
type: governance
status: active
priority: high
version: 1.0.0
applies_to:
  - product
  - engineering
depends_on:
  - SCOPE_02
related: []
agent_read_policy: when_related
---
# 18 - Roadmap por fases (alineado y endurecido)

## Objetivo de este roadmap

Definir una secuencia de construccion que reduzca retrabajo y deje trazabilidad entre:

- vision de producto,
- contratos funcionales,
- modelo de datos,
- API,
- UI,
- operacion,
- seguridad,
- monetizacion.

Cada fase incluye:

- entregables,
- ruta de analisis de desalineaciones,
- aristas de riesgo,
- criterio de salida.

---

## Fase -1: Alineacion contractual y baseline tecnico

### Objetivo

Cerrar contradicciones entre contratos antes de construir features.

### Entregables

- Matriz de trazabilidad contrato -> entidad -> endpoint -> pantalla -> test.
- Matriz de desalineaciones con severidad: critica, alta, media, baja.
- Lista de decisiones abiertas y owner por decision.
- Backlog de "must before code" (bloqueantes).

### Ruta de analisis de desalineaciones

1. Producto vs alcance:
- `01-product-contract.md` vs `02-mvp-scope.md`.
2. Alcance vs arquitectura:
- `02` vs `03-architecture-contract.md`.
3. Dominio vs datos:
- `04-domain-model-contract.md` vs `05-data-contract.md` vs `packages/db/schema.sql`.
4. Dominio/API:
- `04` vs `06-api-contract.md` vs `apps/api/src`.
5. SEO/UI:
- `07-seo-local-contract.md` + `10-ui-ux-contract.md` vs `apps/web/src/pages`.
6. Operacion/admin/proveedor:
- `11`, `12`, `13` vs rutas API reales y seed.
7. Seguridad/analytics/testing:
- `15`, `16`, `17` vs scripts y cobertura real.
8. Roadmap/prompts/DoD:
- `18`, `20`, `21`, `22` consistentes entre si.

### Aristas a cubrir

- naming inconsistente (`provider` vs `providers`),
- estados duplicados o no controlados,
- rutas prometidas sin ownership,
- tablas existentes sin uso,
- datos privados expuestos por error,
- criterios de testing no implementables con el seed actual.

### Criterio de salida

- Cero desalineaciones criticas abiertas.
- Todas las altas con fecha y owner.
- Fases 0+ desbloqueadas formalmente.

---

## Fase 0: Plataforma base y calidad minima

### Objetivo

Tener monorepo ejecutable y auditable desde el dia 1.

### Entregables

- `pnpm install`, `pnpm dev`, `docker compose up` funcionando.
- Config TS consistente en todo el monorepo.
- `.env.example` completo y validacion de env en arranque.
- Scripts base: typecheck, test, smoke.
- CI minima (typecheck + tests core + smoke API).

### Ruta de desalineacion

- `03` vs estructura real del repo.
- `17` vs scripts reales (`test` no placeholder).
- `15` vs manejo de secretos y logs.

### Aristas

- drift de versiones `latest`,
- falta de tsconfig compartido,
- arranque local no deterministico,
- Docker inicializa DB pero API no consume DB.

### Criterio de salida

- Entorno reproducible en maquina limpia.
- Pipeline minimo verde.

---

## Fase 1: Dominio canonico y datos confiables

### Objetivo

Asegurar que el modelo de dominio y SQL representen exactamente el negocio V1.

### Entregables

- Reconciliacion final `04` <-> `schema.sql`.
- Seed minimo alineado con QA:
  - >=5 servicios,
  - >=3 ciudades,
  - >=5 proveedores,
  - relaciones de servicios,
  - reviews moderadas,
  - leads demo.
- Reglas core iniciales con tests unitarios:
  - validacion lead,
  - servicios relacionados,
  - matching proveedor,
  - pricing lead,
  - transiciones de estado.

### Ruta de desalineacion

- Invariantes de `04` vs constraints SQL.
- `08-leads-billing-rules.md` vs campos existentes.
- `17` vs datos demo reales.

### Aristas

- estado de lead sin state machine,
- duplicados sin ventana configurable,
- provider suspendido aun matcheable,
- pricing sin versionado de reglas.

### Criterio de salida

- Dominio testeado y seed util para demo/E2E.

---

## Fase 2: Directorio publico SEO util (no vacio)

### Objetivo

Publicar rutas indexables con valor real por ciudad+servicio.

### Entregables

- Rutas publicas minimas:
  - `/`,
  - `/servicios`,
  - `/servicios/[service]`,
  - `/[city]/[service]`,
  - `/proveedores/[provider-slug]`.
- Metadatos, canonical, enlaces internos y contenido util.
- Regla anti-paginas vacias aplicada.

### Ruta de desalineacion

- `07` y `10` vs paginas reales.
- `05` datos publicos/privados vs payload renderizado.

### Aristas

- thin pages,
- canibalizacion SEO por slugs pobres,
- datos demo irreales en paginas indexables,
- dependencia excesiva de JS para CTA principal.

### Criterio de salida

- Paginas utiles, indexables, y sin exposicion de datos sensibles.

---

## Fase 3: Leads compuestos end-to-end

### Objetivo

Implementar flujo completo de solicitud -> oportunidades -> auditoria.

### Entregables

- API:
  - `POST /api/leads`,
  - `GET /api/services/:slug/related`.
- Persistencia completa:
  - `leads`,
  - `lead_requested_services`,
  - `lead_opportunities`,
  - `lead_events`.
- Validaciones de negocio y deduplicacion inicial.
- Confirmacion con `lead_public_code` estable.

### Ruta de desalineacion

- `06` body/errores vs implementacion real.
- `08` validez/duplicado/cobro vs reglas core.
- `15` logging/auditoria de datos sensibles.

### Aristas

- spam y abuso de formulario,
- leads sin proveedores elegibles,
- race conditions en alta concurrencia,
- mismatch de slugs (servicio/ciudad inexistentes).

### Criterio de salida

- Flujo de lead probado con tests de integracion y smoke manual.

---

## Fase 4: Panel proveedor minimo operable

### Objetivo

Permitir que proveedor gestione perfil y oportunidades sin ver datos ajenos.

### Entregables

- UI panel:
  - `/panel`,
  - `/panel/perfil`,
  - `/panel/leads`,
  - `/panel/leads/[id]`.
- API proveedor:
  - `GET/PATCH /api/provider/me`,
  - `GET /api/provider/leads`,
  - `POST /api/provider/leads/:id/status`,
  - `POST /api/provider/leads/:id/quote`.
- Autorizacion por ownership de oportunidad.

### Ruta de desalineacion

- `11` vs endpoints reales.
- `06` prefijos/rutas (`provider` singular) vs codigo.
- `15` roles/permisos vs middleware real.

### Aristas

- IDOR (acceso a leads de otro proveedor),
- transiciones de estado invalidas,
- cotizaciones sin contexto de oportunidad.

### Criterio de salida

- Proveedor solo opera sobre sus datos y deja trazabilidad.

---

## Fase 5: Admin minimo y confianza operativa

### Objetivo

Habilitar operacion manual controlada para mantener calidad de marketplace.

### Entregables

- Modulos admin:
  - proveedores (aprobar/suspender),
  - servicios,
  - relaciones,
  - leads (ver/reasignar/invalidar),
  - reviews (aprobar/rechazar/flag).
- Eventos auditables para acciones admin.

### Ruta de desalineacion

- `12` y `13` vs modelo de datos y API.
- `16` eventos admin vs instrumentacion real.

### Aristas

- moderacion inconsistente,
- invalidez de leads sin evidencia,
- cambios de pricing sin historial.

### Criterio de salida

- Operacion admin reproducible con politicas claras.

---

## Fase 6: Monetizacion V1.5 (wallet y cobro por oportunidad)

### Objetivo

Pasar de "precio registrado" a "debito controlado" sin pagos de servicio.

### Entregables

- Creditos/debitos/refunds sobre `wallet_transactions`.
- Marcado de `valid_for_billing` con reglas auditables.
- Flujo de disputa basico con estados y resolucion.

### Ruta de desalineacion

- `08` y `09` vs implementacion de billing.
- `14` frontera clara: sin split ni escrow en esta fase.

### Aristas

- cobros duplicados,
- refunds sin correlacion,
- falta de evidencia para disputa.

### Criterio de salida

- Ledger consistente y explicable por oportunidad.

---

## Fase 7: Cierre, reputacion y score

### Objetivo

Medir calidad del matching y no solo volumen de leads.

### Entregables

- Estados de cierre reportado y confirmado.
- Eventos de cierre y panel de metricas de conversion.
- Score de confianza inicial (perfil + respuesta + reviews + verificacion).

### Ruta de desalineacion

- `13` score/badges vs datos disponibles.
- `16` metricas de cierre vs eventos realmente emitidos.

### Aristas

- cierres autodeclarados sin control,
- sesgo por pocos datos,
- gaming de badges.

### Criterio de salida

- Señales de confianza utiles y auditables.

---

## Fase 8: Hardening pre-produccion

### Objetivo

Reducir riesgo tecnico/operativo antes de escalar captacion.

### Entregables

- QA funcional completa (unit + integration + E2E minima).
- Seguridad base cerrada (rate limit, sanitizacion, politicas).
- Observabilidad minima (request/error/slow query).
- Runbooks de incidente y respaldo DB.

### Ruta de desalineacion

- `15`, `16`, `17` vs estado real del sistema.

### Aristas

- cuellos de botella en DB,
- falta de backup restore probado,
- alertas inexistentes o ruidosas.

### Criterio de salida

- Checklist de produccion aprobado.

---

## Fase 9: Go-live controlado por micromercado

### Objetivo

Lanzar Bogota + vertical grafico con control de calidad comercial.

### Entregables

- rollout limitado por ciudad/servicios,
- tablero de metricas semanales,
- bucle de aprendizaje para ajustar matching y pricing,
- criterio de expansion a nueva ciudad/vertical.

### Ruta de desalineacion

- `02` criterios de viabilidad vs metricas reales.
- `22` objetivos iniciales vs evidencia de mercado.

### Aristas

- oferta insuficiente de proveedores,
- leads de baja calidad,
- baja respuesta inicial.

### Criterio de salida

- Cumplir umbrales de viabilidad antes de expandir.

---

## Gate transversal (aplica en todas las fases)

No se avanza de fase si falla alguno:

- contrato vigente contradice implementacion,
- datos privados expuestos,
- tests criticos en rojo,
- no hay plan de rollback de cambios sensibles,
- ownership de modulo sin responsable.
