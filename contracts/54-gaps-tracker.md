---
id: GAPS_TRACKER_54
title: "Gaps tracker — todos los pendientes ordenados por prioridad"
type: governance
status: active
priority: critical
version: 1.0.0
applies_to:
  - engineering
  - product
  - qa
depends_on:
  - AUDIT_FINAL_53
---

# 54 — Gaps Tracker

**Fecha:** 31 mayo 2026
**Fuente:** Auditoria integral (contrato 53)
**Total gaps encontrados:** 45 (8 cerrados, 37 abiertos)

---

## P0 — Criticos (deben cerrarse antes de produccion)

| # | Gap | Contrato | Evidencia | Estado |
|---|-----|----------|-----------|--------|
| P0-1 | Cobro de lead manual → debe ser automatico | LEADS_BILLING_08 §6 | `provider.ts:968-976` | ✅ Cerrado |
| P0-2 | Sin limite de leads gratis por plan (free=10/mes) | MONETIZATION_09 §7 | `create-lead.ts:152-165` | ✅ Cerrado |
| P0-3 | Schema.org JSON-LD ausente en todas las paginas | SEO_07 §23 | `proveedores/[slug].astro` | ✅ Cerrado |
| P0-4 | Sitemap hardcodeado → debe ser dinamico | SEO_07 §26 | `sitemap.xml.astro` | ✅ Cerrado |
| P0-5 | Portfolio de proveedor no existe | PROVIDER_PANEL_11 §1 | `portfolio_images` table | ✅ Cerrado |
| P0-6 | Confirmacion de cierre (won/lost) no implementada | LEADS_BILLING_08 §14 | `provider.ts` close endpoint | ✅ Cerrado |
| P0-7 | Seed data incompleto (pocos providers, reviews, leads) | TESTING_QA_17 §23 | `seed.sql` | ✅ Cerrado |
| P0-8 | Proveedor suspendido podia acceder al panel | AUTH_RBAC_28 | `provider.ts:130-136` | ✅ Cerrado |

---

## P1 — Importantes (deben cerrarse en esta fase)

### Monetizacion y billing

| # | Gap | Contrato | Accion |
|---|-----|----------|--------|
| P1-1 | Wallet topup es fake (sin pasarela de pago) | MONETIZATION_09 | Integrar MercadoPago/PSE para cargar saldo real |
| P1-2 | Sin renovacion automatica de planes | PLANS_50 | Cobro recurrente mensual/anual |
| P1-3 | Sin facturacion/recibos para providers | PLANS_50 | Generar comprobantes de debito |
| P1-4 | Sin badge "Verificado" en perfil publico | MONETIZATION_09 §8 | Mostrar badge en provider profile |
| P1-5 | Sin prioridad en busquedas para Pro | MONETIZATION_09 §8 | Boost providers con plan Pro |
| P1-6 | Plan free no tiene limite de leads | MONETIZATION_09 §7 | Verificar enforcement en todos los paths |

### SEO y contenido

| # | Gap | Contrato | Accion |
|---|-----|----------|--------|
| P1-7 | Sin pagina de ciudad sola (`/[city]`) | SEO_07 §4 | Crear pagina con listado de servicios por ciudad |
| P1-8 | Sin filtros en pagina ciudad+servicio | UIUX_10 §10 | Agregar filtros por rating, zona, precio |
| P1-9 | Sin breadcrumbs en paginas publicas | SEO_07 §18 | Agregar breadcrumb navigation |
| P1-10 | Sin FAQs en pagina ciudad+servicio | SEO_07 §17 | Agregar seccion FAQ por servicio |
| P1-11 | Sitemap no incluye todas las ciudades | SEO_07 §26 | Agregar ciudades activas dinamicamente |
| P1-12 | Sin `/[city]/[service]/[zone]` | SEO_07 §6 | Rutas con zonas/barrios |
| P1-13 | Sin `/guias/[slug]` ni `/comparativas/[slug]` | SEO_07 §9-10 | Crear paginas de contenido adicional |

### UX y panel

| # | Gap | Contrato | Accion |
|---|-----|----------|--------|
| P1-14 | Sin preview mobile en editor de perfil | PROVIDER_CMS_52 | Toggle desktop/mobile en preview |
| P1-15 | Sin portada (cover_url) visible en perfil publico | SEO_07 §19 | Renderizar cover_url cuando existe |
| P1-16 | Sin tiempo de respuesta en perfil publico | SEO_07 §21 | Mostrar avg response time |
| P1-17 | Sin portfolio visible en perfil publico | SEO_07 §19 | Renderizar gallery de portfolio_images |
| P1-18 | SEO settings del provider (meta title/desc) no existen | PROVIDER_CMS_52 | Campos meta_title, meta_description en providers |

### Emails y notificaciones

| # | Gap | Contrato | Accion |
|---|-----|----------|--------|
| P1-19 | Sin emails transaccionales | SCOPE_02 §35 | Nuevo lead, bienvenida, recuperacion |
| P1-20 | Sin notificaciones WhatsApp | SCOPE_02 §36 | Integrar WhatsApp Business API |
| P1-21 | Recuperacion de contrasena sin envio real | AUTH_RBAC_28 | Implementar envio de email con token |

### Admin

| # | Gap | Contrato | Accion |
|---|-----|----------|--------|
| P1-22 | Admin no puede ver cotizaciones (listado de quotes) | PRODUCT_01 §25 | GET /api/admin/quotes |
| P1-23 | Admin no puede ver completitud de perfil de provider | ADMIN_12 | Agregar % de completitud en tabla providers |
| P1-24 | Admin no puede editar un provider existente | ADMIN_12 | PATCH /api/admin/providers/:id |
| P1-25 | Sin admin UI para planes (solo API) | PLANS_50 | Pagina /admin/planes para editar precios |
| P1-26 | Sin admin UI para portfolio (solo API) | PROVIDER_PANEL_11 | Moderar imagenes de portfolio |

### Datos y seed

| # | Gap | Contrato | Accion |
|---|-----|----------|--------|
| P1-27 | Seed sin leads demo | TESTING_QA_17 §23 | Crear 2-3 leads de ejemplo con oportunidades |
| P1-28 | Seed sin Barranquilla (creada via admin, no en seed.sql) | DATA_05 §19 | Agregar a seed.sql |
| P1-29 | Sin soft-delete (deleted_at) en tablas | DATA_05 §7 | Agregar deleted_at donde aplique |

---

## P2 — Calidad y operaciones (siguiente fase)

### Testing

| # | Gap | Contrato | Accion |
|---|-----|----------|--------|
| P2-1 | Sin integration tests de RBAC ownership | TESTING_QA_17 §13 | IT-provider-ownership, IT-provider-leads-authz |
| P2-2 | Sin E2E lead flow test | TESTING_QA_17 §15 | E2E-lead-flow-3-steps |
| P2-3 | Sin E2E no-PII test | TESTING_QA_17 §18 | E2E-no-pii-public-pages |
| P2-4 | Sin E2E flujo proveedor | TESTING_QA_17 §21 | E2E provider registration + lead management |
| P2-5 | Sin E2E flujo admin | TESTING_QA_17 §22 | E2E admin approval + moderation |

### Migraciones y versionado

| # | Gap | Contrato | Accion |
|---|-----|----------|--------|
| P2-6 | Migraciones 0002-0013 sin rollback notes | MIGRATIONS_31 §3 | Agregar seccion rollback en cada migration |
| P2-7 | Sin decision log para cambios de comportamiento | MIGRATIONS_31 §9 | Crear CHANGELOG o decision log |
| P2-8 | Sin CI/CD pipeline | ROADMAP_18 §4 | Configurar GitHub Actions para typecheck + test |

### Infraestructura

| # | Gap | Contrato | Accion |
|---|-----|----------|--------|
| P2-9 | Sin backup automatizado de DB | SECURITY_15 §9 | Configurar pg_dump cron |
| P2-10 | Sin monitoreo de errores | ANALYTICS_16 §8 | Agregar structured error logging |
| P2-11 | Sin health checks automatizados | ANALYTICS_16 | Endpoint /health ya existe, agregar alerting |

### Componentes UI

| # | Gap | Contrato | Accion |
|---|-----|----------|--------|
| P2-12 | Sin componentes reutilizables (ServiceCard, ProviderCard, etc.) | UIUX_10 §15 | Crear components/ en Astro |
| P2-13 | Sin BaseLayout aplicado a todas las paginas | UX_IMPROVEMENT_49 E1 | Migrar paginas a usar BaseLayout.astro |
| P2-14 | Design tokens no usados consistentemente | UX_IMPROVEMENT_49 E2 | Reemplazar colores hardcodeados por variables CSS |

### Analytics

| # | Gap | Contrato | Accion |
|---|-----|----------|--------|
| P2-15 | Sin tracking de page views en perfil provider | ANALYTICS_16 §1 | Contador de visitas por provider |
| P2-16 | Sin tracking de eventos en lead form | ANALYTICS_16 §1 | Eventos: form_start, step_complete, form_submit |
| P2-17 | Sin dashboard de analytics para provider | ANALYTICS_16 | GET /api/provider/analytics con visitas y conversion |

---

## Resumen por estado

| Estado | Cantidad | % |
|--------|----------|---|
| ✅ Cerrado | 8 | 18% |
| 🔲 Abierto P1 | 21 | 47% |
| 🔲 Abierto P2 | 16 | 35% |
| **Total** | **45** | **100%** |

---

## Proxima sesion sugerida

1. Cerrar P1-7 a P1-18 (SEO + UX): ~4 horas
2. Cerrar P1-19 a P1-21 (emails): ~2 horas
3. Cerrar P1-22 a P1-26 (admin): ~2 horas
4. Cerrar P1-27 a P1-29 (seed): ~30 min

Tiempo estimado P1: ~8.5 horas
