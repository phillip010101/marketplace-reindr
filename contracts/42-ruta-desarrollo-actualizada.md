---
id: RUTA_DESARROLLO_42
title: Ruta de desarrollo actualizada — post Slice 1, pre Slice 2
type: governance
status: active
priority: critical
version: 2.0.0
applies_to:
  - engineering
  - product
  - qa
  - architecture
depends_on:
  - RUTA_MAESTRA_39
  - ROADMAP_18
  - HANDOFF_SLICE1_40
  - SLICE2_41
related:
  - DOD_21
  - TRAZABILIDAD_24
  - API_06
  - ADMIN_12
agent_read_policy: always_when_touching_module
---

# 42 — Ruta de desarrollo actualizada (Mayo 2026)

## Mapa general de fases y slices

```
Fase -1: Alineacion contractual ───────── ✅ COMPLETADO
Fase 0:  Plataforma base (monorepo, CI) ─ ✅ COMPLETADO
Fase 1:  Dominio canonico y datos ─────── ✅ COMPLETADO
Fase 2:  Directorio publico SEO ───────── ✅ COMPLETADO
Fase 3:  Leads compuestos E2E ─────────── ✅ COMPLETADO (Slice 1)
Fase 4:  Panel proveedor operable ─────── ✅ COMPLETADO (hardening post-Slice 1)
─────────────────────────────────────────────────────────────
Fase 5:  Admin minimo y confianza ─────── 🔲 EN PROGRESO (Slice 2)
Fase 6:  Monetizacion V1.5 (wallet) ──── 🔲 PENDIENTE (Slice 3)
Fase 7:  Cierre, reputacion y score ──── 🔲 PENDIENTE (Slice 4)
Fase 8:  Hardening pre-produccion ─────── 🔲 PENDIENTE (Slice 5)
Fase 9:  Escalamiento ────────────────── 🔲 FUTURO
```

## Estado actual (2026-05-22)

### Infraestructura produccion

| Componente | Estado |
|-----------|--------|
| VPS | Ubuntu 24.04, 96GB disk (38GB free), 11GB RAM, 6 CPUs, IP 154.38.184.61 |
| PostgreSQL 16 | `reindr_marketplace` DB, 20 tablas, 5 migraciones, seed data |
| LiteSpeed | Reverse proxy puertos 80/443, SSL Let's Encrypt |
| reindr.org | Sitio principal agencia (Astro + PHP analyzer puerto 3002) |
| apps.reindr.org | Marketplace (Astro web puerto 4321 + Hono API puerto 8787) |
| Systemd | `reindr-marketplace-api.service` + `reindr-marketplace-web.service` enabled |
| Git | `https://github.com/phillip010101/marketplace-reindr.git` branch `main` |

### Lo que ya funciona (Slice 1 + hardening)

- **14 endpoints API**: auth, leads, providers, provider panel, admin services/reviews, health
- **13 rutas publicas Astro**: landing, servicios, proveedores, city/service, lead form 3-pasos
- **Panel proveedor**: dashboard, leads inbox, perfil editor, detalle con transiciones y quotes
- **DTO privacy**: endpoints publicos nunca exponen email/telefono
- **State machine**: 8 estados con transiciones validadas por rol
- **Rate limiting**: in-memory token bucket por IP
- **Deduplicacion de leads**: ventana de 30 dias por email/phone + city + service
- **Precios multi-tier**: 4 niveles de multiplicador por lead compuesto
- **14 archivos de test**: unitarios, integracion y E2E — todos verdes

### Deuda tecnica inmediata

1. **Git push bloqueado**: no hay credenciales configuradas para `https://github.com/phillip010101/marketplace-reindr.git`. Los commits de produccion (20 archivos) estan solo locales. Se necesita SSH key o token.
2. **API puerto expuesto**: Hono escucha en `0.0.0.0:8787`. En prod se accede via LiteSpeed proxy (`127.0.0.1:8787`), pero el bind directo deberia limitarse a localhost.
3. **Contract RAG sin DB mode**: opera en local-cache. Para trazabilidad historica hay que activar `DATABASE_URL` en el tool y correr `migrate` + `index`.
4. **Sin backups de DB**: no hay cron/pg_dump configurado.

## Proximos slices

### Slice 2: Admin minimo operable (Fase 5)

**Archivo**: `contracts/41-slice2-admin-minimo-declaration.md`

**Objetivo**: Darle al equipo operativo herramientas para gestionar el marketplace sin tocar SQL directo.

**Alcance**:
- Panel admin UI (dashboard, leads, providers, services, reviews, service relations)
- `GET /api/admin/events` real (hoy es stub)
- `GET /api/admin/providers` + approve/suspend
- `GET /api/admin/leads` + reassign/mark-invalid
- `GET /api/admin/metrics` (agregados)
- Service relations CRUD

**Batches**: 4 (preflight → API endpoints → Admin UI → DTO/hardening)

**Lo que NO incluye**: wallet, pagos, disputas, cierre de leads.

### Slice 3: Monetizacion V1.5 — Wallet y billing (Fase 6)

**Estado**: solo definido a alto nivel. Se detallara al cerrar Slice 2.

**Objetivo**: pasar de "precio registrado" a "debito controlado" por lead valido, sin tocar pagos de servicios.

**Alcance tentativo**:
- Wallet provider (credits/debits/refunds en `wallet_transactions`)
- Marcado `valid_for_billing` automatico
- Cobro por lead oportunidad
- Disputa basica (provider marca lead como invalido)
- Panel de wallet en provider dashboard

### Slice 4: Cierre, reputacion y score (Fase 7)

**Estado**: solo definido a alto nivel.

**Objetivo**: medir calidad de matching, no solo volumen de leads.

**Alcance tentativo**:
- Estados de cierre (reported/confirmed)
- Panel de conversion (metricas de cierre)
- Trust score (perfil + respuesta + reviews + verificacion)
- Reviews visibles con moderation completa

### Slice 5: Hardening pre-produccion (Fase 8)

**Estado**: solo definido a alto nivel.

**Objetivo**: reducir riesgo tecnico/operativo antes de escalar.

**Alcance tentativo**:
- QA completa
- Security baseline cerrado
- Rate limiting avanzado
- Migraciones auditadas
- Backup strategy
- Monitoreo/metricas de produccion

## Como trabajar en este proyecto (reglas operativas)

### Flujo de trabajo diario

```bash
# 1. Entrar al VPS
ssh root@154.38.184.61

# 2. Ir al codigo desplegado
cd /home/reindr.org/apps/marketplace-reindr

# 3. Pull latest (cuando haya credenciales github)
git pull origin main

# 4. Instalar dependencias si cambiaron
cd mvp-scaffold && pnpm install

# 5. Correr validacion contractual
pnpm contract-rag validate

# 6. Correr tests
pnpm test

# 7. Si todo verde, rebuild web
pnpm --filter @reindr/web build

# 8. Restart services
systemctl restart reindr-marketplace-api reindr-marketplace-web

# 9. Verificar health
curl -s http://localhost:8787/health
curl -s -I https://apps.reindr.org
```

### Reglas de desarrollo (del contrato 39)

- **Anti-hardcode**: no valores quemados de servicio/ciudad/rol/status en handlers o UI. Usar `packages/core` como fuente unica.
- **Anti-duplicacion**: buscar codigo existente antes de crear nuevo. Reusar > Extender > Crear.
- **PR contract**: todo PR debe declarar contratos consultados, afectados, migration impact, rollback risk, tests esperados.
- **RAG trace loop**: context → declare → trace → risk → verify → close.

### Packs de contexto por tarea

| Tarea | Pack |
|-------|------|
| Planear slice | `sprint1-readiness` |
| Ejecutar slice | `sprint1-slice-execution-plan` |
| Auditar entre fases | `pre-development-audit-v3` |
| Handoff a otra maquina | `slice1-handoff` |

## Pendientes inmediatos (esta sesion)

- [x] Sincronizar repos local y desplegado
- [x] Commitear cambios de produccion
- [x] Declarar Slice 2
- [x] Documentar ruta de desarrollo actualizada
- [ ] Configurar credenciales git para push a origin
- [ ] Activar Contract RAG DB mode
- [ ] Configurar backup de base de datos
- [ ] Limitar bind de API a localhost
- [ ] Iniciar Batch 0 de Slice 2 (preflight)

## Criterio de exito

- Ruta unica de ejecucion predecible
- Sin expansion silenciosa de scope
- Sin logica de negocio hardcodeada
- Sin duplicacion sin justificacion explicita
- Todo cambio de comportamiento trazable a contrato + test + evidencia
