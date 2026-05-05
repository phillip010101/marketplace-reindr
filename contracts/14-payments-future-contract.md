---
id: PAYMENTS_FUTURE_14
title: Payments future contract
type: payments
status: active
priority: medium
version: 1.0.0
applies_to:
  - backend
  - database
  - product
depends_on: []
related: []
agent_read_policy: when_related
---
# 14 â€” Payments Future Contract

## Estado

No implementar pagos internos de servicios en V1.

## Objetivo futuro

Permitir pagos dentro de la plataforma para:

- reserva,
- pago completo,
- split con proveedor,
- comisiÃ³n,
- reembolsos,
- garantÃ­a limitada.

## Ruta recomendada

### V1

- Sin pagos de servicios.
- Registrar intenciÃ³n y estado.
- Cobro externo/manual si se requiere.
- Preparar IDs y eventos.

### V1.5

- Wallet para pagar leads.
- Topups.
- DÃ©bitos por leads vÃ¡lidos.
- Reembolsos por leads invÃ¡lidos.

### V2

- IntegraciÃ³n marketplace.
- OAuth de proveedores.
- Split payments.
- ComisiÃ³n.
- Webhooks.
- Estados de pago.

## No hacer

- No recibir dinero de clientes en cuenta personal para luego repartir manualmente.
- No prometer escrow si el proveedor de pagos y tÃ©rminos no lo soportan.
- No construir garantÃ­a sin reglas, soporte y polÃ­ticas.

## Entidades futuras

### PaymentOrder

- id
- lead_id
- client_id
- amount
- currency
- status
- provider_payment_reference
- marketplace_fee
- created_at

### PaymentSplit

- id
- payment_order_id
- provider_id
- amount
- status

### Refund

- id
- payment_order_id
- amount
- reason
- status

## Reglas futuras

- Pago confirmado antes de activar garantÃ­a.
- LiberaciÃ³n diferida solo si el proveedor de pagos lo soporta.
- ComisiÃ³n clara antes del pago.
- PolÃ­tica de reembolso visible.

