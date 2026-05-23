---
id: WALLET_IMPL_45
title: Wallet y billing — implementacion V1.5
type: module
status: active
priority: high
version: 1.0.0
applies_to:
  - backend
  - frontend
  - database
depends_on:
  - LEADS_BILLING_08
  - MONETIZATION_09
  - PAYMENTS_FUTURE_14
  - API_06
  - AUTH_RBAC_28
related:
  - STATE_MACHINE_29
  - DTO_BOUNDARY_30
  - MIGRATIONS_31
agent_read_policy: always_when_touching_module
---

# 45 — Wallet y Billing: implementacion

## Objetivo

Activar cobro por lead valido usando la tabla `wallet_transactions` existente, sin procesamiento de pagos reales (MercadoPago queda para V2).

## Endpoints nuevos

### Provider wallet

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| `GET` | `/api/provider/wallet` | Saldo actual, ultimas transacciones |
| `POST` | `/api/provider/wallet/topup` | Simular carga de saldo (V1.5: manual/admin) |

### Admin billing

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| `GET` | `/api/admin/billing/ledger` | Libro mayor: todas las transacciones |
| `POST` | `/api/admin/billing/charge/:opportunityId` | Debitar provider por lead valido |
| `POST` | `/api/admin/billing/refund/:opportunityId` | Reembolsar provider por lead invalido |

## Reglas de negocio

### Cobro
- Solo se cobra cuando `lead_opportunities.valid_for_billing = true`
- El monto es `lead_opportunities.lead_price`
- El debito crea un row en `wallet_transactions` con `type = 'debit'`
- Si el saldo del provider es insuficiente, el cobro se registra como pendiente (no se bloquea el lead)

### Precio del lead
Usar `packages/core/src/pricing.ts`:
- `base_lead_price` del servicio
- Multiplicador por lead compuesto (2+ servicios: x1.3, 4+: x1.6)
- Multiplicador por presupuesto alto: x1.1
- Multiplicador por urgencia: x1.2

### Reembolso
- Admin puede reembolsar un lead marcado como invalido
- Crea `wallet_transactions` con `type = 'refund'`
- Solo si existe un debito previo para esa oportunidad

## UI

### Panel provider
- Seccion "Wallet" en dashboard: saldo actual, ultimas 5 transacciones
- Boton "Cargar saldo" (simula topup, en V1.5 es manual)

### Admin
- Tab "Billing" en admin: libro mayor con filtros (provider, fecha, tipo)
- Boton "Cobrar" en detalle de lead (cuando `valid_for_billing = true`)
- Boton "Reembolsar" en oportunidades invalidas con debito previo

## DTO boundary

| Endpoint | Perfil DTO |
|----------|-----------|
| `GET /api/provider/wallet` | `provider_private` |
| `GET /api/admin/billing/ledger` | `admin_private` |
| `POST /api/admin/billing/charge` | `admin_private` |

## Tests requeridos

- `IT-wallet-balance`: saldo calculado correctamente
- `IT-billing-charge`: debito crea transaccion y reduce saldo
- `IT-billing-refund`: reembolso restaura saldo
- `IT-billing-insufficient`: saldo insuficiente no bloquea
- `IT-wallet-authz`: provider solo ve su wallet, admin ve todo

## No incluir (out of scope)

- Integracion MercadoPago
- Pagos reales con tarjeta
- Split de pagos
- Comision por cierre (V2)
- Facturacion electronica
