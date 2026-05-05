---
id: TRAZABILIDAD_24
title: Matriz de trazabilidad fase 1
type: governance
status: active
priority: high
version: 1.0.0
applies_to:
  - engineering
  - qa
depends_on:
  - DESALINEACIONES_23
related: []
agent_read_policy: when_related
---
# 24 - Matriz de trazabilidad (Fase -1 inicial)

## Estado

Baseline inicial construida sobre el estado actual del repo al 2026-04-28.

## Matriz

| contract_id | requirement_id | db_table_or_core_rule | api_endpoint | ui_route_or_component | test_case | owner | status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 01 | PBL-LEAD-01 crear solicitud multi-servicio | `leads`, `lead_requested_services`, `createLeadOpportunities` | `POST /api/leads` | `/[city]/[service]` LeadForm | `IT-leads-create` | backend | hecho |
| 01 | PBL-REL-01 sugerir servicios relacionados | `service_relations`, `getRelatedServices` | `GET /api/services/:slug/related` | RelatedServicesSelector | `UT-core-related-services` | backend | hecho |
| 01 | PBL-PROV-01 perfil publico proveedor | `providers`, `provider_services`, `reviews` | `GET /api/providers/:slug` | `/proveedores/[provider-slug]` | `E2E-public-provider-page` | fullstack | hecho |
| 02 | MVP-PUBLIC-01 rutas publicas base | n/a | n/a | `/`, `/servicios`, `/servicios/[service]`, `/[city]/[service]` | `E2E-public-routes` | frontend | hecho |
| 02 | MVP-PROVIDER-01 bandeja de leads proveedor | `lead_opportunities`, `quotes` | `/api/provider/leads*` | `/panel/leads` | `IT-provider-leads-authz` | backend | hecho |
| 02 | MVP-ADMIN-01 moderacion reviews | `reviews` | `/api/admin/reviews/:id/moderate` | `/admin/reviews` | `IT-admin-review-moderation` | backend | hecho |
| 03 | ARC-CORE-01 reglas en `packages/core` | `validateLeadInput`, `matchProvidersForLead`, `calculateLeadPrice` | consumidas por API | n/a | `UT-core-*` | backend | hecho |
| 04 | DOM-INV-01 proveedor suspendido no recibe leads | `providers.status`, `lead_opportunities` | `POST /api/leads` | n/a | `IT-no-assign-suspended-provider` | backend | hecho |
| 05 | DAT-PRIV-01 no exponer PII fuera de contexto | n/a | endpoints publicos | paginas publicas | `E2E-no-pii-public-pages` | fullstack | hecho |
| 06 | API-ERR-01 formato uniforme de error | reglas validacion | endpoints API | formularios | `IT-api-error-shape` | backend | hecho |
| 07 | SEO-ROUTES-01 rutas indexables utiles | datos publicos seed | n/a | rutas SEO del contrato | `E2E-seo-route-content` | frontend | hecho |
| 08 | BILL-VALID-01 cobrar por oportunidad valida | `lead_opportunities.valid_for_billing`, `wallet_transactions` | endpoints V1.5 | panel/admin | `IT-billing-valid-opportunity` | backend | hecho |
| 10 | UI-LEAD-01 flujo de formulario en 3 pasos | reglas lead + related | `POST /api/leads` | LeadForm | `E2E-lead-flow-3-steps` | frontend | hecho |
| 10 | UI-TPL-01 template provider deterministico por catalogo | `PROVIDER_TEMPLATES`, `resolveProviderTemplate` | n/a | `/proveedores/[provider-slug]` | `IT-provider-template-skins` | frontend | hecho |
| 11 | PRV-AUTH-01 proveedor solo ve lo suyo | ownership de oportunidad | `/api/provider/leads/:id` | `/panel/leads/[id]` | `IT-provider-ownership` | backend | hecho |
| 11 | PRV-PROFILE-01 proveedor gestiona su perfil propio | `providers`, `provider_services` | `/api/provider/me` | `/panel/perfil` | `IT-provider-me` | backend | hecho |
| 11 | PRV-QUOTE-01 proveedor crea cotizacion sobre oportunidad propia | `quotes`, `lead_opportunities`, `lead_events` | `/api/provider/leads/:id/quote` | `/panel/leads/[id]` | `IT-provider-quote` | backend | hecho |
| 11 | PRV-PANEL-UI-01 panel provider minimo operable | ownership + DTO provider_private | `/api/provider/me`, `/api/provider/leads*` | `/panel`, `/panel/perfil`, `/panel/leads`, `/panel/leads/[id]` | `IT-provider-panel-routes`, `IT-provider-panel-content` | fullstack | hecho |
| 11 | PRV-METRICS-01 resumen operativo de bandeja provider | `lead_opportunities` agregadas por estado | `/api/provider/metrics` | `/panel` | `IT-provider-metrics` | backend | hecho |
| 11 | PRV-SESSION-UI-01 acceso provider con login y guardas de sesion | `accounts.role`, bearer token | `/api/auth/login`, `/api/auth/me` | `/panel/login` + redirect en rutas privadas panel | `IT-provider-panel-routes`, `IT-provider-panel-content` | fullstack | hecho |
| 12 | ADM-SVC-01 CRUD servicios | `services` | `/api/admin/services*` | `/admin/servicios` | `IT-admin-services-crud` | backend | hecho |
| 13 | REV-MOD-01 reviews moderadas antes de publicar | `reviews.status` | endpoints admin reviews | ProviderProfile reviews block | `IT-reviews-pending-not-public` | fullstack | hecho |
| 15 | SEC-RATE-01 rate limit formulario publico | n/a | `POST /api/leads` | LeadForm | `IT-rate-limit-leads` | backend | hecho |
| 16 | OBS-EVT-01 eventos de negocio criticos | `lead_events` | API leads/provider/admin | paneles | `IT-lead-events-emitted` | backend | hecho |
| 17 | QA-MIN-01 suite minima por fase | n/a | n/a | n/a | `CI-typecheck-test-smoke` | platform | hecho |
| 31 | MIG-BASE-01 pipeline de migraciones versionadas | `schema_migrations`, `packages/db/migrations/*.sql` | n/a | n/a | `db:migrate` + `db:migrate:check` | backend | hecho |

## Notas de lectura

- `status` usa: `pendiente`, `parcial`, `hecho`.
- Esta matriz es semilla y debe actualizarse al cerrar cada fase.

## Evidencia Gate B (Readiness Sprint 1)

Revision: 2026-05-01

- Owner nombrado en filas fase 0:
  - `PBL-LEAD-01`: backend
  - `MVP-PROVIDER-01`: backend
  - `DOM-INV-01`: backend
  - `API-ERR-01`: backend
  - `PRV-AUTH-01`: backend
  - `SEC-RATE-01`: backend
  - `OBS-EVT-01`: backend
  - `QA-MIN-01`: platform
- Test id objetivo definido en filas fase 0:
  - `PBL-LEAD-01` -> `IT-leads-create`
  - `MVP-PROVIDER-01` -> `IT-provider-leads-authz`
  - `DOM-INV-01` -> `IT-no-assign-suspended-provider`
  - `API-ERR-01` -> `IT-api-error-shape`
  - `PRV-AUTH-01` -> `IT-provider-ownership`
  - `SEC-RATE-01` -> `IT-rate-limit-leads`
  - `OBS-EVT-01` -> `IT-lead-events-emitted`
  - `QA-MIN-01` -> `CI-typecheck-test-smoke`
- Estado gate:
  - `owner`: verde
  - `test_id`: verde
  - `implementacion`: pendiente (no iniciar desarrollo en esta fase)

## Evidencia PR-001 (Batch 1 baseline)

Revision: 2026-05-02

- Migracion baseline creada:
  - `mvp-scaffold/packages/db/migrations/0001_slice1_schema_baseline.sql`
- Runner de migraciones versionadas:
  - `mvp-scaffold/apps/api/src/scripts/migrate.ts`
  - scripts: `db:migrate`, `db:migrate:check`
- Estado:
  - typecheck workspace: verde
  - `db:migrate:check`: bloqueado por DB no disponible en este entorno (`ECONNREFUSED`)

## Evidencia PR-002 (Batch 2 lead create path) - avance parcial

Revision: 2026-05-02

- `POST /api/leads` ahora ejecuta:
  - normalizacion canonica (`requested_service_slugs` con alias deprecado),
  - persistencia transaccional de lead + requested services + opportunities + lead events,
  - dedup de lead por ventana configurable.
- Archivos clave:
  - `mvp-scaffold/apps/api/src/routes/leads.ts`
  - `mvp-scaffold/apps/api/src/services/create-lead.ts`
  - `mvp-scaffold/apps/api/src/lib/db.ts`
  - `mvp-scaffold/apps/api/src/lib/api-errors.ts`
- Estado:
  - typecheck API/workspace: verde
  - pruebas de integracion de DB: pendientes por falta de Postgres en entorno actual

## Evidencia Batch 3 (Provider ownership-safe reads) - avance parcial

Revision: 2026-05-02

- Nuevas rutas privadas provider:
  - `GET /api/provider/leads`
  - `GET /api/provider/leads/:opportunityId`
- Guardas aplicadas:
  - autenticacion requerida en rutas privadas (headers actor en entorno actual),
  - rol `provider` obligatorio,
  - ownership por `providers.account_id -> provider_id -> lead_opportunities.provider_id`.
- Archivos clave:
  - `mvp-scaffold/apps/api/src/lib/request-actor.ts`
  - `mvp-scaffold/apps/api/src/routes/provider.ts`
  - `mvp-scaffold/apps/api/src/index.ts`
- Estado:
  - typecheck API/workspace: verde
  - pruebas de integracion DB/auth: pendientes por falta de Postgres y capa auth final

## Evidencia Batch 4 (State transition validator path) - avance parcial

Revision: 2026-05-02

- Ruta implementada:
  - `POST /api/provider/leads/:opportunityId/status`
- Reglas aplicadas:
  - ownership de oportunidad por provider autenticado,
  - validacion de transicion via modulo core compartido,
  - evento auditable `opportunity_status_changed` en `lead_events`.
- Archivos clave:
  - `mvp-scaffold/packages/core/src/opportunity-state.ts`
  - `mvp-scaffold/apps/api/src/routes/provider.ts`
- Estado:
  - typecheck API/workspace: verde
  - pruebas de integracion DB/transiciones: pendientes por falta de Postgres en entorno actual

## Evidencia Batch 5 (DTO boundary enforcement) - avance parcial

Revision: 2026-05-02

- Mapeadores DTO centralizados por perfil:
  - public: `toPublicProviderCard`, `toLeadCreatedPublicResponse`
  - provider_private: `toProviderOpportunitySummary`, `toProviderOpportunityDetail`
- Rutas adaptadas para usar mapeadores (evita duplicacion y leaks por payload ad-hoc):
  - `GET /api/providers`
  - `POST /api/leads`
  - `GET /api/provider/leads`
  - `GET /api/provider/leads/:opportunityId`
- Tests unitarios DTO agregados y en verde:
  - `mvp-scaffold/apps/api/src/lib/dto.test.ts`
- Estado:
  - typecheck API/workspace: verde
  - tests unitarios DTO: verde
  - pruebas E2E privacy completas: pendientes por entorno DB/E2E

## Evidencia Batch 6 (Contract preflight automation) - avance parcial

Revision: 2026-05-02

- `contract-rag:ensure` actualizado para ejecutar preflight completo por defecto:
  - `init`
  - `validate`
  - `index`
  - `context`
- Soporte de modo rapido agregado por variable:
  - `CONTRACT_RAG_ENSURE_MODE=baseline`
- Documentacion y `.env.example` actualizados para uso en otro PC sin DB.
- Archivos clave:
  - `mvp-scaffold/scripts/contract-rag-ensure.cjs`
  - `mvp-scaffold/.env.example`
  - `tools/contract-rag/README.md`
  - `mvp-scaffold/README.md`
  - `README.md`
- Estado:
  - typecheck/test workspace: verde
  - `contract-rag validate/index/context`: verde en modo local-cache

## Evidencia Batch 7 (Related services endpoint + core test) - avance parcial

Revision: 2026-05-02

- Endpoint publico implementado:
  - `GET /api/services/:slug/related`
  - query `limit` (1..20)
  - respuesta canonica con `source_service_slug` y `related_service_slugs`.
- Reuso de regla core:
  - `getRelatedServices` (orden por peso y filtro de relaciones activas).
- Fallback sin DB:
  - catalogo local centralizado para no bloquear entorno sin Postgres.
- Tests agregados:
  - `UT-core-related-services` -> `mvp-scaffold/packages/core/src/lead-routing.test.ts`
  - test fallback API -> `mvp-scaffold/apps/api/src/lib/service-relations.test.ts`
- Archivos clave:
  - `mvp-scaffold/apps/api/src/routes/services.ts`
  - `mvp-scaffold/apps/api/src/lib/service-relations.ts`
  - `mvp-scaffold/packages/core/src/service-relations-catalog.ts`
  - `mvp-scaffold/packages/core/src/lead-routing.test.ts`
- Estado:
  - typecheck workspace: verde
  - tests unitarios core/api: verde
  - validacion integracion DB (`service_relations` real): pendiente por entorno sin Postgres

## Evidencia Batch 8 (API error shape + provider authz/ownership tests) - avance parcial

Revision: 2026-05-02

- Tests de contrato API agregados (sin DB real, con pool mock):
  - `IT-api-error-shape`:
    - `POST /api/leads` invalido retorna shape canonico `{ ok:false, error:{ code,message,fields } }`.
  - `IT-provider-leads-authz`:
    - `GET /api/provider/leads` sin auth -> `401 UNAUTHORIZED`.
    - `GET /api/provider/leads` con rol no-provider -> `403 FORBIDDEN`.
  - `IT-provider-ownership`:
    - cuenta sin perfil provider -> `403 FORBIDDEN`.
    - acceso a oportunidad no perteneciente -> `404 NOT_FOUND`.
- Refactor para testabilidad:
  - `createApp()` separado de `index.ts` (evita levantar server en tests).
  - override de pool en tests via `setPoolForTests`.
- Archivos clave:
  - `mvp-scaffold/apps/api/src/app.ts`
  - `mvp-scaffold/apps/api/src/index.ts`
  - `mvp-scaffold/apps/api/src/lib/db.ts`
  - `mvp-scaffold/apps/api/src/routes/api-contract.test.ts`
- Estado:
  - typecheck API: verde
  - tests API: verde
  - integracion auth/ownership con DB real: pendiente por entorno sin Postgres

## Evidencia Batch 9 (Rate limit publico en leads) - avance parcial

Revision: 2026-05-02

- Rate limit implementado en `POST /api/leads`:
  - key por client address (`x-forwarded-for`/`cf-connecting-ip`, fallback `anonymous`),
  - ventana y maximo configurables por env:
    - `LEADS_RATE_LIMIT_MAX`
    - `LEADS_RATE_LIMIT_WINDOW_MS`
  - rechazo con `429`, `error.code=RATE_LIMITED`, header `Retry-After`.
- Test agregado:
  - `IT-rate-limit-leads` valida bloqueo en requests repetidos del mismo cliente.
- Archivos clave:
  - `mvp-scaffold/apps/api/src/lib/rate-limit.ts`
  - `mvp-scaffold/apps/api/src/routes/leads.ts`
  - `mvp-scaffold/apps/api/src/routes/api-contract.test.ts`
  - `mvp-scaffold/.env.example`
- Estado:
  - typecheck API/workspace: verde
  - tests API/workspace: verde
  - validacion en despliegue multi-instancia (rate limit distribuido): pendiente

## Evidencia Batch 10 (Rutas SEO publicas base) - avance parcial

Revision: 2026-05-02

- Rutas publicas agregadas:
  - `/servicios`
  - `/servicios/[service]`
  - `/proveedores/[providerSlug]`
- Refactor anti-duplicacion:
  - catalogo compartido para servicios/proveedores/relaciones en `apps/web/src/data/catalog.ts`.
  - `index` y `[city]/[service]` reutilizan el mismo catalogo.
- SEO base:
  - `title`, `description` y `canonical` en nuevas rutas publicas.
- Archivos clave:
  - `mvp-scaffold/apps/web/src/data/catalog.ts`
  - `mvp-scaffold/apps/web/src/pages/index.astro`
  - `mvp-scaffold/apps/web/src/pages/servicios/index.astro`
  - `mvp-scaffold/apps/web/src/pages/servicios/[service].astro`
  - `mvp-scaffold/apps/web/src/pages/[city]/[service].astro`
  - `mvp-scaffold/apps/web/src/pages/proveedores/[providerSlug].astro`
- Estado:
  - typecheck web: verde
  - E2E-public-routes: pendiente
  - E2E-public-provider-page: pendiente

## Evidencia Batch 11 (DOM-INV base rule coverage) - avance parcial

Revision: 2026-05-02

- Cobertura de regla en dominio (`core`):
  - `matchProvidersForLead` excluye proveedores inactivos/suspendidos y fuera de ciudad.
- Test agregado:
  - `matchProvidersForLead excludes inactive providers and city mismatch`.
- Archivo clave:
  - `mvp-scaffold/packages/core/src/lead-routing.test.ts`
- Estado:
  - tests core: verde
  - validacion integracion transaccional con DB (`IT-no-assign-suspended-provider`): pendiente por entorno sin Postgres

## Evidencia Batch 12 (E2E rutas publicas y perfil provider) - avance parcial

Revision: 2026-05-02

- Suite web agregada sin dependencias pesadas:
  - `E2E-public-routes`
  - `E2E-public-provider-page`
- Estrategia:
  - build estatico de Astro en test,
  - aserciones sobre HTML generado en `dist`.
- Cobertura lograda:
  - rutas MVP publicas base generadas (`/`, `/servicios`, `/servicios/[service]`, `/[city]/[service]`),
  - perfil provider publico generado y enlazado a servicio/ciudad.
- Ajuste tecnico requerido:
  - `apps/web/astro.config.mjs` cambiado a `output: static` para permitir build sin adapter.
- Archivos clave:
  - `mvp-scaffold/apps/web/test/public-routes.e2e.test.mjs`
  - `mvp-scaffold/apps/web/package.json`
  - `mvp-scaffold/apps/web/astro.config.mjs`
- Estado:
  - tests web: verde
  - tests workspace: verde
  - `GET /api/providers/:slug` (datos reales backend): pendiente

## Evidencia Batch 13 (API perfil publico provider) - avance parcial

Revision: 2026-05-02

- Endpoint implementado:
  - `GET /api/providers/:slug`
- Comportamiento:
  - perfil publico con DTO `public` (sin PII),
  - estrategia DB-first,
  - fallback local sin DB (catalogo compartido en `packages/core`).
- Refactor anti-duplicacion:
  - catalogo publico movido a `packages/core/src/public-catalog.ts`,
  - `web` y `api` reutilizan misma fuente.
- Test agregado:
  - `E2E-public-provider-page-api` valida respuesta publica sin `client_email`/`client_phone`.
- Archivos clave:
  - `mvp-scaffold/apps/api/src/routes/providers.ts`
  - `mvp-scaffold/apps/api/src/lib/public-provider.ts`
  - `mvp-scaffold/apps/api/src/lib/dto.ts`
  - `mvp-scaffold/apps/api/src/routes/api-contract.test.ts`
  - `mvp-scaffold/packages/core/src/public-catalog.ts`
- Estado:
  - typecheck workspace: verde
  - tests workspace: verde
  - perfil con datos/reviews reales de DB: pendiente por entorno sin Postgres

## Evidencia Batch 14 (No-PII public surfaces) - cierre contractual

Revision: 2026-05-02

- `E2E-no-pii-public-pages` implementado en web:
  - escaneo de HTML generado en rutas publicas contra valores privados seeded conocidos.
- `E2E-no-pii-public-pages` implementado en api:
  - `GET /api/providers`
  - `GET /api/providers/:slug`
  - asercion explicita de ausencia de `client_email` y `client_phone`.
- Archivos clave:
  - `mvp-scaffold/apps/web/test/public-routes.e2e.test.mjs`
  - `mvp-scaffold/apps/api/src/routes/api-contract.test.ts`
- Estado:
  - tests web/api: verde
  - requirement `DAT-PRIV-01`: actualizado a `hecho`

## Evidencia Batch 15 (Admin moderation + services CRUD) - avance parcial

Revision: 2026-05-02

- Rutas admin agregadas:
  - `POST /api/admin/reviews/:id/moderate`
  - `GET /api/admin/services`
  - `POST /api/admin/services`
  - `PATCH /api/admin/services/:id`
- Guardas de seguridad:
  - rol `admin` obligatorio en rutas `/api/admin/*`.
- Cobertura de pruebas:
  - `IT-admin-review-moderation`
  - `IT-admin-services-crud`
  - authz negativa para no-admin en rutas admin.
- Observabilidad base:
  - eventos admin en memoria (`review_moderated`, `service_created`, `service_updated`) para entorno sin DB.
- Archivos clave:
  - `mvp-scaffold/apps/api/src/routes/admin.ts`
  - `mvp-scaffold/apps/api/src/lib/request-actor.ts`
  - `mvp-scaffold/apps/api/src/lib/admin-memory-store.ts`
  - `mvp-scaffold/apps/api/src/routes/api-contract.test.ts`
- Estado:
  - tests API: verde
  - persistencia y auditoria real en DB (`lead_events` + tablas reales): pendiente por entorno sin Postgres

## Evidencia Batch 16 (Lead form 3-step flow) - avance parcial

Revision: 2026-05-02

- Formulario de lead en `/[city]/[service]` actualizado a 3 pasos:
  - Paso 1: necesidad base
  - Paso 2: servicios relacionados
  - Paso 3: contacto + urgencia + presupuesto + consentimiento
- Mantiene endpoint contractual `POST /api/leads` con payload canónico.
- Cobertura de prueba:
  - `E2E-lead-flow-3-steps` validando estructura y campos esperados en HTML generado.
- Archivos clave:
  - `mvp-scaffold/apps/web/src/pages/[city]/[service].astro`
  - `mvp-scaffold/apps/web/test/public-routes.e2e.test.mjs`
- Estado:
  - tests web: verde
  - validacion de conversion UX real con backend DB: pendiente por entorno sin Postgres

## Evidencia Batch 17 (Billing validity rule baseline) - avance parcial

Revision: 2026-05-02

- Regla de facturacion movida a `core`:
  - oportunidad facturable cuando estado entra en `contacted`, `quoted` o `won`.
- Integracion en transición provider:
  - `POST /api/provider/leads/:opportunityId/status` ahora marca `valid_for_billing=true` cuando aplica.
- Tests agregados:
  - `isBillableOpportunityStatus` (unit tests core).
- Archivos clave:
  - `mvp-scaffold/packages/core/src/billing.ts`
  - `mvp-scaffold/packages/core/src/billing.test.ts`
  - `mvp-scaffold/apps/api/src/routes/provider.ts`
- Estado:
  - tests core: verde
  - `wallet_transactions` y débito real V1.5: pendiente por alcance/DB

## Evidencia Batch 18 (Cierre de parciales sin DB) - cierre contractual operativo

Revision: 2026-05-02

- Cobertura backend agregada:
  - `IT-leads-create`
  - `IT-lead-events-emitted`
  - `IT-billing-valid-opportunity`
  - `IT-no-assign-suspended-provider`
- Cobertura core agregada:
  - `UT-core-validateLeadInput`
  - `UT-core-calculateLeadPrice`
  - `UT-core-related-services` (etiquetado contractual en test)
- Cobertura frontend/fullstack agregada:
  - `E2E-seo-route-content`
  - `IT-reviews-pending-not-public`
- QA minima operacional:
  - script workspace `CI-typecheck-test-smoke` agregado en `mvp-scaffold/package.json`.
  - ejecucion validada: `contract-rag validate` + `typecheck` + `test` en verde.
- Archivos clave:
  - `mvp-scaffold/apps/api/src/services/create-lead.test.ts`
  - `mvp-scaffold/apps/api/src/routes/api-contract.test.ts`
  - `mvp-scaffold/packages/core/src/lead-routing.test.ts`
  - `mvp-scaffold/packages/core/src/pricing.test.ts`
  - `mvp-scaffold/packages/core/src/public-catalog.ts`
  - `mvp-scaffold/apps/web/src/pages/proveedores/[providerSlug].astro`
  - `mvp-scaffold/apps/web/test/public-routes.e2e.test.mjs`
  - `mvp-scaffold/package.json`
- Estado final de matriz fase 1:
  - `hecho`: 19
  - `parcial`: 1 (`MIG-BASE-01`, bloqueado por validacion con Postgres real `db:migrate:check`)

## Evidencia Batch 19 (Cierre con Postgres VPS y tunel local) - cierre final fase 1

Revision: 2026-05-04

- Integracion real DB completada contra VPS mediante tunel SSH local (`localhost:55432 -> 127.0.0.1:5432`).
- Bootstrap schema idempotente y seed aplicados en DB remota.
- Pipeline de migraciones versionadas validado sobre DB real:
  - `pnpm db:migrate`
  - `pnpm db:migrate:check`
- Contract RAG DB migration ejecutada tras habilitar `pgvector` en VPS:
  - `pnpm contract-rag migrate` -> `Applied migration: 001_init.sql`.
- Gate integral de calidad ejecutado en contexto DB conectado:
  - `pnpm run CI-typecheck-test-smoke` verde.
- Estado:
  - `MIG-BASE-01` actualizado a `hecho`.
  - Matriz fase 1 cerrada sin filas `parcial`.

## Evidencia Batch 20 (Admin DB persistence sin fallback) - fortalecimiento post-cierre

Revision: 2026-05-04

- Rutas admin movidas a persistencia real en Postgres:
  - `POST /api/admin/reviews/:id/moderate` actualiza `reviews.status`.
  - `GET /api/admin/services` lista desde `services`.
  - `POST /api/admin/services` crea en `services` con control de conflicto por `slug`.
  - `PATCH /api/admin/services/:id` actualiza por `id` o `slug`.
- Auditoria admin persistente:
  - nueva tabla `admin_events` en migracion `0002_admin_events_audit.sql`.
  - eventos `review_moderated`, `service_created`, `service_updated`.
- Pruebas de contrato agregadas:
  - `IT-admin-services-conflict-duplicate-slug`
  - `IT-admin-review-not-found`
- Cleanup:
  - eliminado fallback `admin-memory-store`.
- Estado:
  - typecheck API: verde
  - tests API: verde

## Evidencia Batch 21 (Auth JWT real en rutas privadas) - hardening de acceso

Revision: 2026-05-04

- Guardas privadas migradas a bearer token:
  - `requireActor` valida `Authorization: Bearer <token>`.
  - token invalido/expirado responde `401 UNAUTHORIZED`.
- Headers legacy (`x-account-id`, `x-user-role`) removidos del path de autenticacion.
- Cobertura de pruebas ampliada:
  - `IT-provider-leads-authz: invalid bearer token returns unauthorized`
  - `IT-provider-leads-authz: expired bearer token returns unauthorized`
  - suites provider/admin actualizadas para usar token firmado de prueba.
- Archivos clave:
  - `mvp-scaffold/apps/api/src/lib/auth-token.ts`
  - `mvp-scaffold/apps/api/src/lib/request-actor.ts`
  - `mvp-scaffold/apps/api/src/routes/api-contract.test.ts`
- Estado:
  - typecheck API: verde
  - tests API: verde (25/25)

## Evidencia Batch 22 (Auth token issuance endpoint) - habilitador frontend

Revision: 2026-05-04

- Endpoint de login agregado:
  - `POST /api/auth/login` (email/password -> bearer token + actor claims).
- Endpoint de introspeccion minima:
  - `GET /api/auth/me` (actor desde token).
- Hashing de password:
  - esquema `scrypt$v1$<salt>$<hash>` validado en backend.
  - migracion `0003_seed_account_password_hashes.sql` para cuentas seed MVP.
- Tests agregados:
  - `IT-auth-login-success`
  - `IT-auth-login-invalid-credentials`
  - `IT-auth-me`
- Estado:
  - typecheck API: verde
  - tests API: verde (28/28)

## Evidencia Batch 23 (Provider panel baseline: profile + quote endpoints)

Revision: 2026-05-05

- Endpoints provider completados segun `API_06`:
  - `GET /api/provider/me`
  - `PATCH /api/provider/me`
  - `POST /api/provider/leads/:opportunityId/quote`
- Guardas y reglas aplicadas:
  - autenticacion bearer + rol `provider`,
  - ownership por `providers.account_id -> provider_id -> lead_opportunities.provider_id`,
  - transicion valida obligatoria hacia `quoted` antes de registrar cotizacion,
  - evento auditable `quote_submitted` en `lead_events`.
- Tests agregados:
  - `IT-provider-me: provider can read own profile`
  - `IT-provider-me: PATCH /api/provider/me updates editable profile fields`
  - `IT-provider-me: PATCH /api/provider/me rejects empty body`
  - `IT-provider-quote: creates quote and transitions opportunity to quoted`
  - `IT-provider-quote: rejects invalid transition to quoted`
- Archivos clave:
  - `mvp-scaffold/apps/api/src/routes/provider.ts`
  - `mvp-scaffold/apps/api/src/routes/api-contract.test.ts`
- Estado:
  - typecheck API: verde
  - tests API: verde (33/33)

## Evidencia Batch 24 (Provider panel UI baseline)

Revision: 2026-05-05

- Rutas UI provider agregadas:
  - `/panel`
  - `/panel/perfil`
  - `/panel/leads`
  - `/panel/leads/[opportunityId]` (path estatico base `demo-opportunity` + query `opportunity_id`).
- Integracion cliente:
  - login provider via `POST /api/auth/login`,
  - token bearer guardado en `localStorage`,
  - consumo de `/api/provider/me`,
  - consumo de `/api/provider/leads`,
  - detalle/update-status/quote sobre `/api/provider/leads/:opportunityId/*`.
- Tests web agregados:
  - `IT-provider-panel-routes`
  - `IT-provider-panel-content`
- Archivos clave:
  - `mvp-scaffold/apps/web/src/pages/panel/index.astro`
  - `mvp-scaffold/apps/web/src/pages/panel/perfil/index.astro`
  - `mvp-scaffold/apps/web/src/pages/panel/leads/index.astro`
  - `mvp-scaffold/apps/web/src/pages/panel/leads/[opportunityId].astro`
  - `mvp-scaffold/apps/web/src/scripts/provider-panel-client.ts`
  - `mvp-scaffold/apps/web/test/public-routes.e2e.test.mjs`
- Estado:
  - typecheck web: verde
  - tests web: verde (10/10)

## Evidencia Batch 25 (Provider template catalog baseline)

Revision: 2026-05-05

- Catalogo de templates provider agregado en core compartido:
  - `PROVIDER_TEMPLATES`
  - `resolveProviderTemplate`
  - `templateId` por provider.
- Perfil publico provider ahora aplica template deterministico:
  - tokens de color/fuente/borde por template,
  - marcador verificable `data-provider-template`.
- Test agregado:
  - `IT-provider-template-skins`.
- Archivos clave:
  - `mvp-scaffold/packages/core/src/public-catalog.ts`
  - `mvp-scaffold/apps/web/src/data/catalog.ts`
  - `mvp-scaffold/apps/web/src/pages/proveedores/[providerSlug].astro`
  - `mvp-scaffold/apps/web/test/public-routes.e2e.test.mjs`
- Estado:
  - typecheck web: verde
  - tests web: verde (11/11)

## Evidencia Batch 26 (Provider metrics endpoint + dashboard integration)

Revision: 2026-05-05

- Endpoint agregado:
  - `GET /api/provider/metrics` retorna `total/new/contacted/quoted/closed`.
- Dashboard provider consume endpoint dedicado (sin recomputar metricas desde listado completo).
- Tests agregados:
  - `IT-provider-metrics-authz`
  - `IT-provider-metrics`
- Archivos clave:
  - `mvp-scaffold/apps/api/src/routes/provider.ts`
  - `mvp-scaffold/apps/api/src/routes/api-contract.test.ts`
  - `mvp-scaffold/apps/web/src/pages/panel/index.astro`
- Estado:
  - typecheck api/web: verde
  - tests api/web: verde

## Evidencia Batch 27 (Provider login route + session guards in panel UI)

Revision: 2026-05-05

- Ruta de acceso agregada:
  - `/panel/login`
- Guardas de sesion agregadas en rutas privadas del panel:
  - `/panel`
  - `/panel/perfil`
  - `/panel/leads`
  - `/panel/leads/[id]`
- Comportamiento:
  - si falta token o `auth/me` no valida rol `provider`, la UI redirige a `/panel/login`.
  - sesion invalida limpia token local.
- Archivos clave:
  - `mvp-scaffold/apps/web/src/scripts/provider-panel-client.ts`
  - `mvp-scaffold/apps/web/src/pages/panel/login/index.astro`
  - `mvp-scaffold/apps/web/src/pages/panel/index.astro`
  - `mvp-scaffold/apps/web/src/pages/panel/perfil/index.astro`
  - `mvp-scaffold/apps/web/src/pages/panel/leads/index.astro`
  - `mvp-scaffold/apps/web/src/pages/panel/leads/[opportunityId].astro`
- Estado:
  - typecheck web: verde
  - tests web: verde (11/11)

## Evidencia Batch 28 (Session hardening: token expiry precheck + logout uniforme)

Revision: 2026-05-05

- Hardening client-side de sesion provider:
  - precheck de expiracion JWT (`exp`) antes de consumir API privada,
  - limpieza automatica de token vencido/invalido,
  - redirect consistente a `/panel/login` cuando falla sesion,
  - boton de cierre de sesion disponible en todas las vistas privadas del panel.
- Archivos clave:
  - `mvp-scaffold/apps/web/src/scripts/provider-panel-client.ts`
  - `mvp-scaffold/apps/web/src/pages/panel/index.astro`
  - `mvp-scaffold/apps/web/src/pages/panel/perfil/index.astro`
  - `mvp-scaffold/apps/web/src/pages/panel/leads/index.astro`
  - `mvp-scaffold/apps/web/src/pages/panel/leads/[opportunityId].astro`
  - `mvp-scaffold/apps/web/src/pages/panel/login/index.astro`
- Estado:
  - typecheck web: verde
  - tests web: verde (11/11)

