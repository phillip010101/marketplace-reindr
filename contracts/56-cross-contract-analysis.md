---
id: CROSS_CONTRACT_56
title: "Analisis cruzado de contratos — inconsistencias y reconciliacion final"
type: governance
status: active
priority: critical
version: 1.0.0
applies_to:
  - engineering
  - product
  - architecture
depends_on:
  - AUDIT_FINAL_53
  - GAPS_TRACKER_54
---

# 56 — Analisis cruzado de contratos

**Fecha:** 1 junio 2026
**Objetivo:** Encontrar contradicciones, incompatibilidades, duplicaciones y eslabones perdidos entre los 50+ contratos.

---

## Contradicciones encontradas: 6

| # | Contradiccion | Contratos | Severidad | Realidad en codigo |
|---|--------------|-----------|-----------|-------------------|
| C1 | Cierre de lead: `won` unico vs multi-stage confirmation | 04/29 vs 08 | Alta | El codigo tiene `won` simple. El billing multi-stage no esta implementado |
| C2 | Disputas: provider self-service vs admin-only | 08 vs 45 | Alta | El codigo tiene ambos: provider disputa + admin resuelve |
| C3 | Free plan CTA limitado: existe en 09, desaparece en 50 | 09 vs 50 | Media | No implementado en ningun lado |
| C4 | Pricing: lead proyecto binario vs multiplicadores stackeables | 08 vs 45 | Alta | Codigo usa multiplicadores stackeables (pricing.ts) |
| C5 | Wallet topup path: `/api/wallet` vs `/api/provider/wallet` | 06 vs 45 | Baja | Implementado en `/api/provider/wallet/topup` |
| C6 | Plans table: "ya existe" vs "CREATE TABLE" | 51 vs 50 | Media | La tabla existe (migracion 0009) |

---

## Incompatibilidades: 7

| # | Incompatibilidad | Contratos | Realidad en codigo |
|---|-----------------|-----------|-------------------|
| I1 | `valid_for_billing` sin mecanismo de activacion | 04, 08, 45 | **Ya implementado**: se activa automaticamente en status update (provider.ts) |
| I2 | Lead matching engine indefinido en contratos | 00, 01, 06, 50 | **Ya implementado**: create-lead.ts línea 141-169 |
| I3 | Reassign sin endpoint en API contract | 00, 12 | **Ya implementado**: POST /api/admin/leads/:id/reassign |
| I4 | Provider registration sin endpoint en API contract | 00, 01, 02, 11, 50 | **Ya implementado**: POST /api/auth/register |
| I5 | Review submission sin endpoint publico | 02, 13 | **No implementado** - solo existe moderacion admin |
| I6 | SEO static vs SSR vs CMS dynamic - conflicto arquitectonico | 03, 07, 51 | **Implementado como SSR** con fallback a static |
| I7 | Plans dependency entre migraciones | 51, 50 | **Resuelto**: migracion 0009 crea plans antes que CMS los use |

---

## Duplicaciones: 6

| # | Que se duplica | Contratos | Accion |
|---|---------------|-----------|--------|
| D1 | Estados de LeadOpportunity (8 estados) | 04, 29, 11 | 29 debe ser la fuente unica |
| D2 | `requested_service_slugs` deprecation policy | 06, 08 | Mantener solo en 06 |
| D3 | Planes: 09 vs 50 (definiciones diferentes) | 09, 50 | 50 reemplaza a 09 |
| D4 | Variables de precio de lead | 04, 08, 09, 45 | Consolidar en 45 |
| D5 | Campos de provider profile | 04, 11, 06 | 04 es la fuente de verdad |
| D6 | Reglas de promesas/messaging | 01, 08 | Mantener en 01 |

---

## Eslabones perdidos (contratos faltantes): 11

| # | Contrato faltante | Referenciado por | Implementado en codigo? |
|---|-------------------|-----------------|------------------------|
| M1 | Lead matching/dispatching engine | 00, 01, 02, 04, 06, 50 | ✅ create-lead.ts |
| M2 | Public provider profile endpoint | 01, 07, 52 | ✅ GET /api/providers/:slug |
| M3 | Public review submission endpoint | 01, 02, 13 | ❌ No implementado |
| M4 | Provider registration endpoint | 00, 01, 02, 11, 50 | ✅ POST /api/auth/register |
| M5 | Email notification system | 02 | ❌ Requiere SMTP |
| M6 | WhatsApp notification system | 02 | ❌ Requiere API |
| M7 | Search implementation spec | 02, 06 | ⚠️ Client-side JS only |
| M8 | Provider approval workflow | 00, 01, 02, 12 | ✅ admin.ts approve endpoint |
| M9 | Rate limiting specification | 06, 03 | ✅ rate-limit.ts |
| M10 | Provider analytics / page views | 52, 50 | ⚠️ page_views table created, no dashboard |
| M11 | Portfolio / gallery system | 52, 07, 11 | ⚠️ API exists, no UI |

---

## Proposito principal vs realidad

### La vision (00-contexto-proyecto)

> "Crear una red donde los proveedores tengan perfiles indexables y los clientes puedan generar solicitudes multi-servicio que se convierten en multiples oportunidades conectadas."

### Verificacion

| Capacidad core | Contratos | Codigo | Status |
|---------------|-----------|--------|--------|
| Perfiles indexables de proveedores | ✅ | ✅ | Funcionando |
| Solicitudes multi-servicio | ✅ | ✅ | Funcionando |
| Conversion a multiples oportunidades | ❌ sin contrato | ✅ create-lead.ts | Funcionando pero no documentado |
| Monetizacion por lead | ✅ | ✅ | Funcionando (auto-debit) |
| Panel proveedor | ✅ | ✅ | Funcionando |
| Panel admin | ✅ | ✅ | Funcionando |
| Reviews y confianza | ✅ | ❌ sin submit endpoint | No funcional |
| Registro de proveedores | ❌ sin contrato | ✅ | Funcionando pero no documentado |
| Planes freemium | ✅ | ✅ | Funcionando |
| Contenido SEO | ✅ | ✅ | Funcionando |

---

## Conclusion

### Lo que los contratos dicen que falta pero YA EXISTE en codigo

Estos son gaps de **documentacion**, no de implementacion:

1. `POST /api/auth/register` — funciona, no esta en API contract
2. Lead matching engine — funciona en create-lead.ts, no tiene contrato
3. `GET /api/providers/:slug` — funciona, mencionado pero sin spec formal
4. `POST /api/admin/leads/:id/reassign` — funciona, no esta en API contract
5. Auto-debit en `valid_for_billing` — funciona, contratos dicen que es manual
6. Provider portfolio endpoints — funcionan, sin contrato formal

### Lo que REALMENTE falta (no implementado)

1. **Client review submission** — sin endpoint publico para crear reviews
2. **Emails transaccionales** — requiere SMTP externo
3. **Pagos reales** — requiere MercadoPago
4. **WhatsApp notifications** — requiere API externa
5. **Search server-side** — solo hay busqueda client-side en home

### Plan de reconciliacion

1. Actualizar `06-api-contract.md` con los endpoints que existen pero no estan documentados
2. Crear contrato para lead matching engine
3. Consolidar contratos duplicados (D1-D6)
4. Marcar contradicciones como resueltas (C1-C6) con la decision tomada
