# Decision Log

## DEC-001  Contracts are source of truth

Date: 2026-04-28
Status: active

Decision:
Contracts in `/contracts` are the source of truth.

Reason:
Avoid agentic drift and undocumented architecture.

Impact:
Changes that modify business rules must update contracts.

## DEC-002 Canonical payload for related services

Date: 2026-05-01
Status: active

Decision:
Use `requested_service_slugs` as the canonical payload field for lead composed requests.

Reason:
Avoid drift between web form fields, API contracts, and domain matching logic.

Impact:
Legacy aliases may exist temporarily, but internal normalization must always resolve to `requested_service_slugs`.

## DEC-003 Provider identity ownership model

Date: 2026-05-01
Status: active

Decision:
Provider private authorization is based on `accounts` ownership of `providers` profile.

Reason:
Panel security requires a deterministic identity root and ownership checks.

Impact:
Provider routes must validate role + ownership before any data access.

## DEC-004 Public/private DTO boundary is mandatory

Date: 2026-05-01
Status: active

Decision:
API responses must be emitted through explicit DTO profiles (`public`, `provider_private`, `admin_private`).

Reason:
Prevent accidental PII leakage as API surface grows.

Impact:
Raw DB rows cannot be returned from route handlers.

## DEC-005 Migration-first schema evolution

Date: 2026-05-01
Status: active

Decision:
Schema changes must be migration-based with staged rollout for high-risk constraints.

Reason:
Keep production-safe evolution and reduce rollback risk.

Impact:
Breaking schema changes require backfill notes, rollback notes, and contract updates.

## DEC-006 Context pack required coverage in bundles

Date: 2026-05-01
Status: active

Decision:
When running `contract-rag context` with a selected pack, bundle retrieval must prioritize and include available chunks from pack `required_contracts`.

Reason:
Prevent partial context where one high-scoring contract hides mandatory constraints from other required contracts.

Impact:
Retrieval and bundle generation must apply deterministic preferred-contract boost and coverage rules.

## DEC-007 Pre-development gate policy

Date: 2026-05-01
Status: active

Decision:
No functional Sprint 1 implementation starts while any P0 item in `CIERRE_PREDEV_34` remains open.

Reason:
The project already has solid contracts and RAG context; the highest risk is starting with unresolved cross-contract ambiguities.

Impact:
All teams must close and document P0 contract amendments before writing feature code.

## DEC-008 P0 contractual hardening completed

Date: 2026-05-01
Status: active

Decision:
The contractual P0 hardening items are considered closed after updates to API payload canonicalization, role transition matrix, DTO endpoint mapping, and migration rollback policy.

Reason:
These were the critical ambiguities blocking safe start of Sprint 1 planning.

Impact:
Next pre-development focus moves to execution readiness checks, traceability updates, and DB-backed RAG infrastructure.

## DEC-009 Sprint 1 requires formal readiness gate

Date: 2026-05-01
Status: active

Decision:
Sprint 1 starts only after explicit readiness validation under `READINESS_35`.

Reason:
Contract baseline is now strong; the remaining risk is uncontrolled handoff from analysis to execution.

Impact:
Planning artifacts must include gate evidence, first slice declaration, and contract impact declaration before coding starts.

## DEC-010 Gate B documentary readiness completed

Date: 2026-05-01
Status: active

Decision:
Gate B documentary requirements are considered satisfied after traceability evidence update and QA minimum suite hardening.

Reason:
Owner/test-id readiness and QA baseline must be explicit before moving from analysis to implementation planning.

Impact:
Only Gate C authorization remains pending before feature coding can begin.

## DEC-011 Gate C declaration completed for first slice

Date: 2026-05-02
Status: active

Decision:
Gate C is considered documented through `SLICE1_36`, including first slice scope, affected contracts, rollback risk, and expected tests.

Reason:
The project needs a controlled and explicit handoff from analysis to execution planning.

Impact:
Sprint 1 implementation can begin only for `S1-LEAD-COMPUESTO-CORE` under declared contract boundaries.

## DEC-012 Batch-gated execution policy for first slice

Date: 2026-05-02
Status: active

Decision:
Execution of `S1-LEAD-COMPUESTO-CORE` follows ordered technical batches with mandatory exit gates defined in `PLAN_SLICE1_37`.

Reason:
A controlled sequence reduces drift, rollback risk, and hidden coupling between payload, state machine, authz, DTO, and migrations.

Impact:
Teams must treat batch gates as hard blockers and cannot skip directly to later implementation tasks.

## DEC-013 PR order lock for Batch 1 and Batch 2

Date: 2026-05-02
Status: active

Decision:
`S1-B1-PR001-schema-baseline` must merge before `S1-B2-PR002-leads-create-path`.

Reason:
Lead creation transactional flow depends on stable migration baseline and rollback-safe schema alignment.

Impact:
Implementation planning and execution must follow the declared PR sequence in `PR_BREAKDOWN_38`.

## DEC-014 Master route enforcement policy

Date: 2026-05-02
Status: active

Decision:
All development execution must follow `RUTA_MAESTRA_39` and its RAG Trace Loop.

Reason:
A single enforced route prevents omissions, hidden scope drift, duplicated logic, and hardcoded business rules.

Impact:
PRs that skip route steps or required declarations are blocked until compliance is restored.

## DEC-015 Migration runner baseline enabled

Date: 2026-05-02
Status: active

Decision:
Batch 1 starts with an ordered SQL migration pipeline (`packages/db/migrations`) and a version-tracked runner (`db:migrate`, `db:migrate:check`).

Reason:
Schema changes must be reproducible, auditable, and rollback-documented before transactional feature work.

Impact:
All further schema changes must ship as new migration files; editing applied migrations is not allowed.

## DEC-016 Provider status updates must use core transition validator

Date: 2026-05-02
Status: active

Decision:
Provider status changes on opportunities must pass through the shared core transition validator before DB update.

Reason:
Avoid transition drift between route handlers and contract-defined state machine.

Impact:
Direct status writes in provider handlers are not allowed without validator check and lead_event emission.

## DEC-017 DTO response mapping must be centralized

Date: 2026-05-02
Status: active

Decision:
API responses for public and provider/private profiles must be emitted through centralized DTO mappers.

Reason:
Centralized response mapping reduces duplication and lowers accidental PII leakage risk.

Impact:
New routes must define and use explicit DTO profile mappers instead of ad-hoc inline response shapes.

## DEC-018 Slice handoff continuity protocol required

Date: 2026-05-02
Status: active

Decision:
Any machine/team handoff during active slice execution must use `HANDOFF_SLICE1_40` checklist before resuming implementation.

Reason:
The current slice has partial completion with DB-dependent validations pending; a strict handoff protocol prevents omissions.

Impact:
No resume work should skip contract preflight, migration checks, or traceability evidence updates.

## DEC-019 Contract RAG ensure runs full preflight by default

Date: 2026-05-02
Status: active

Decision:
`contract-rag:ensure` runs `init + validate + index + context` by default (`CONTRACT_RAG_ENSURE_MODE=full`).

Reason:
The project needs contract context to be immediately available in every coding/test session, including environments without PostgreSQL.

Impact:
Repository lifecycle hooks now keep RAG artifacts refreshed automatically; `baseline` mode remains available for faster local loops when explicitly configured.

## DEC-020 Related services endpoint uses DB-first with local fallback

Date: 2026-05-02
Status: active

Decision:
`GET /api/services/:slug/related` resolves relations from DB when available and falls back to a centralized local catalog when DB is unavailable.

Reason:
Current slice must progress on environments without PostgreSQL while preserving domain behavior and avoiding hardcoded logic inside handlers.

Impact:
Route behavior remains available for frontend integration in no-DB sessions, and switches to DB-backed relations automatically when `DATABASE_URL` is configured.

## DEC-021 API testability baseline without DB is mandatory

Date: 2026-05-02
Status: active

Decision:
API contract/authz tests must run without PostgreSQL by using app factory isolation and controlled DB pool overrides.

Reason:
Current development flow prioritizes portability across machines and cannot block on local DB availability.

Impact:
`createApp()` is the canonical test entrypoint, and protected-route authz/ownership checks must keep coverage in no-DB CI/local loops.

## DEC-022 Public leads rate limiting uses env-configurable in-memory guard

Date: 2026-05-02
Status: active

Decision:
`POST /api/leads` enforces a minimal in-memory rate limiter with configurable window/max thresholds from env.

Reason:
Security contract requires anti-abuse controls even before distributed infra is available.

Impact:
No-DB local and CI environments enforce rate limiting now; future multi-instance deployments must replace or complement this with shared/distributed limiting.

## DEC-023 Web public routes use a shared catalog source

Date: 2026-05-02
Status: active

Decision:
Public SEO route pages (`/`, `/servicios`, `/servicios/[service]`, `/proveedores/[providerSlug]`, `/[city]/[service]`) consume a centralized local catalog module in web app.

Reason:
Avoid hardcoded duplicated service/provider lists across pages while DB-backed content APIs are not yet enabled.

Impact:
Future DB/API hydration can replace the catalog source in one place without rewriting route-level templates.

## DEC-024 Provider matching must reject inactive candidates at core level

Date: 2026-05-02
Status: active

Decision:
Provider matching logic in core must enforce `active=true` and city equality before assignment eligibility.

Reason:
Domain invariant `DOM-INV-01` must be protected independently of route/DB integration timing.

Impact:
Even with no-DB test loops, matching behavior stays aligned with the contract that suspended/inactive providers cannot receive opportunities.

## DEC-025 Web MVP public route validation uses static-build E2E smoke

Date: 2026-05-02
Status: active

Decision:
Web MVP public route acceptance is validated by static Astro build smoke tests over generated `dist` HTML.

Reason:
Current phase requires lightweight, portable E2E checks without introducing browser automation stack overhead.

Impact:
`apps/web` runs route-level E2E coverage in `pnpm test`; deeper interactive browser flows remain optional for later phases.

## DEC-026 Public catalog is centralized in core package

Date: 2026-05-02
Status: active

Decision:
Shared public service/provider catalog definitions live in `packages/core` and are consumed by both web and api.

Reason:
Prevent drift and duplication between public page generation, API fallback data, and related-services behavior during no-DB development.

Impact:
Catalog changes now propagate to both frontend and backend surfaces from one source module.

## DEC-027 No-PII checks are mandatory on public web and api surfaces

Date: 2026-05-02
Status: active

Decision:
Public routes/pages must have automated checks that assert absence of client contact fields and seeded private contact values.

Reason:
Privacy boundary must be enforced continuously as new public endpoints/pages are added.

Impact:
`E2E-no-pii-public-pages` is now part of routine web/api test coverage in the workspace.

## DEC-028 Admin fallback operations must enforce role-first guards

Date: 2026-05-02
Status: active

Decision:
Admin moderation and service-management routes run with strict `admin` role guard before any business action, including fallback memory mode.

Reason:
Security contract requires role isolation independent of DB availability and environment setup.

Impact:
`/api/admin/*` behavior is executable in no-DB loops without bypassing authorization boundaries.

## DEC-029 Lead form must preserve 3-step progressive disclosure

Date: 2026-05-02
Status: active

Decision:
Public lead submission UI for city/service routes follows a strict 3-step flow with progressive disclosure.

Reason:
UI/UX contract requires conversion-friendly input sequencing while preserving canonical payload compatibility.

Impact:
Changes to lead form UX must keep step semantics (`1/2/3`) and preserve `POST /api/leads` canonical fields.

## DEC-030 Billing validity is status-driven at domain level

Date: 2026-05-02
Status: active

Decision:
`valid_for_billing` eligibility is derived from opportunity status progression (`contacted`, `quoted`, `won`) in core domain logic.

Reason:
Billing contract requires charging only valid opportunities and avoids ad-hoc flag manipulation from handlers.

Impact:
Provider status updates can promote an opportunity to billable; wallet debit remains deferred to V1.5 flow.

## DEC-031 Public provider profile only shows approved reviews

Date: 2026-05-02
Status: active

Decision:
Provider public profile renders review content only when review status is `approved`.

Reason:
Trust contract requires moderation gate before publication and forbids exposing pending/flagged/rejected reviews.

Impact:
Any profile review rendering path (catalog fallback or DB-backed) must filter by status first.

## DEC-032 Phase smoke gate is contract-rag validate + typecheck + tests

Date: 2026-05-02
Status: active

Decision:
Phase-level smoke gate is standardized as `CI-typecheck-test-smoke` running `contract-rag validate`, workspace `typecheck`, and workspace `test`.

Reason:
Readiness gate needs one repeatable command to avoid omission across machines and keep contract/tooling checks coupled.

Impact:
Before promoting phase status or opening next development slice, this smoke gate must pass.

## DEC-033 Local-to-VPS DB workflow is tunnel-first and script-driven

Date: 2026-05-04
Status: active

Decision:
Local development uses SSH tunnel to VPS Postgres with project scripts (`sync-vps-db.ps1`, `keep-ssh-tunnel.ps1`) as the standard workflow.

Reason:
Keep setup minimal (no Docker), reproducible across PCs, and aligned with hardened VPS Postgres configuration on localhost.

Impact:
DB-dependent gates and migrations can be executed locally against VPS safely; tunnel health becomes a required precondition before DB checks.

## DEC-034 Admin moderation and service management are DB-authoritative

Date: 2026-05-04
Status: active

Decision:
Admin routes for review moderation and services CRUD use PostgreSQL as authoritative state; in-memory fallback is removed.

Reason:
Contract integrity requires auditable, persistent admin actions and consistent behavior across restarts/environments.

Impact:
Admin endpoints now depend on DB availability and write audit records to `admin_events`; tests validate conflict/not-found behavior explicitly.

## DEC-035 Private API auth is bearer JWT-based

Date: 2026-05-04
Status: active

Decision:
Private provider/admin routes authenticate request actor from bearer JWT token claims, replacing ad-hoc role/account headers.

Reason:
Header-injected identities are not a valid auth boundary; JWT-based actor resolution provides a real authentication primitive while preserving existing RBAC/ownership checks.

Impact:
Clients/tests must send `Authorization: Bearer <token>` for private routes; invalid or expired tokens now return `401` before role/ownership checks.

## DEC-036 Token issuance is handled by API auth login endpoint

Date: 2026-05-04
Status: active

Decision:
API exposes `POST /api/auth/login` to issue bearer tokens using account credentials, plus `GET /api/auth/me` for actor resolution checks.

Reason:
Frontend and integrators need a canonical token source; test-only token forging is not enough for application flows.

Impact:
Seed accounts require password hashes in DB migration path; private route consumers can now authenticate end-to-end with issued tokens.

## DEC-037 Provider profile and quote flows are contract-critical private endpoints

Date: 2026-05-05
Status: active

Decision:
`GET/PATCH /api/provider/me` and `POST /api/provider/leads/:opportunityId/quote` are mandatory private endpoints and must enforce bearer auth, provider ownership, and transition validation rules.

Reason:
`API_06` and `PROVIDER_PANEL_11` already define these flows; leaving them undefined in code creates contract drift and weakens provider panel operability.

Impact:
Provider quote creation now requires valid transition to `quoted`, persists quote data, updates opportunity status, and emits auditable `quote_submitted` event.

## DEC-038 Provider panel baseline routes are now mandatory in MVP

Date: 2026-05-05
Status: active

Decision:
Provider UI baseline must expose `/panel`, `/panel/perfil`, `/panel/leads`, and `/panel/leads/[id]` backed by existing private provider endpoints.

Reason:
`PROVIDER_PANEL_11` requires minimal operational flow for provider profile, lead triage, and quote submission; delaying UI while API exists creates product-level drift.

Impact:
Any future provider panel refactor must preserve these route intents and keep bearer auth + ownership behavior aligned with `API_06` and `STATE_MACHINE_29`.

## DEC-039 Provider public page uses deterministic template catalog

Date: 2026-05-05
Status: active

Decision:
Public provider pages resolve visual theme from a shared template catalog (`templateId` on provider + `resolveProviderTemplate`) instead of ad-hoc per-page styles.

Reason:
The project needs maintainable UI combinations (font/color/spacing identity) without duplicating style logic or hardcoding one-off variants per page.

Impact:
Provider profile rendering must keep template resolution deterministic and testable (`data-provider-template` marker).

## DEC-040 Provider dashboard metrics are API-owned aggregation

Date: 2026-05-05
Status: active

Decision:
Provider dashboard (`/panel`) reads counters from `GET /api/provider/metrics` instead of recomputing from full leads payload in frontend.

Reason:
Keep aggregation logic centralized, avoid duplicated status grouping rules, and reduce payload for dashboard-only views.

Impact:
Changes to metric semantics must be done in API contract/domain logic and reflected in the dashboard consumer.

## DEC-041 Provider panel private pages require client session guard

Date: 2026-05-05
Status: active

Decision:
All private provider panel pages perform session validation (`/api/auth/me`) and redirect to `/panel/login` when token is missing, invalid, expired, or not provider role.

Reason:
Avoid fragmented auth behavior across panel routes and prevent UI actions under stale/incorrect local tokens.

Impact:
Provider panel UX now has one canonical login entrypoint and deterministic redirect behavior for private routes.

## DEC-042 Provider client validates token expiration before private API calls

Date: 2026-05-05
Status: active

Decision:
Provider panel client performs local JWT expiration precheck (`exp`) and clears stale tokens before attempting private API calls.

Reason:
Avoid repeated unauthorized calls with expired tokens and keep session failure behavior fast and deterministic.

Impact:
Expired session now redirects directly to `/panel/login` without waiting for API rejection, while server-side auth remains authoritative.
