---
id: LEADS_BILLING_08
title: Leads and billing rules
type: billing
status: active
priority: high
version: 1.0.0
applies_to:
  - backend
  - database
  - admin
depends_on:
  - DOMAIN_04
  - DATA_05
  - API_06
related: []
agent_read_policy: when_related
---
# 08 â€” Leads & Billing Rules Contract

## Principio

Se cobra por oportunidad vÃ¡lida, no por simple envÃ­o de formulario.

## Lead vÃ¡lido

Un lead es vÃ¡lido si:

- contiene nombre o identificador razonable,
- contiene canal de contacto funcional,
- corresponde a la categorÃ­a,
- corresponde a la zona del proveedor,
- no es duplicado reciente,
- no es spam evidente,
- aceptÃ³ consentimiento de contacto.

## Lead invÃ¡lido

Causas:

- telÃ©fono/email invÃ¡lido,
- duplicado reciente,
- servicio fuera de categorÃ­a,
- ubicaciÃ³n fuera de cobertura,
- spam,
- pruebas internas,
- cliente inexistente,
- solicitud claramente falsa.

## Duplicado

Un lead se considera duplicado si:

- mismo telÃ©fono/email,
- mismo servicio,
- misma ciudad,
- mismo proveedor,
- dentro de una ventana configurable.

Ventana inicial sugerida:

```txt
30 dÃ­as
```

## Cobro

V1 puede registrar precio sin descontar wallet.  
V1.5 descuenta saldo.

Regla:

```txt
Cuando LeadOpportunity pasa a valid_for_billing = true,
se crea dÃ©bito en wallet.
```

## Disputa

Proveedor puede disputar un lead dentro de una ventana.

Ventana sugerida:

```txt
3 a 7 dÃ­as
```

Estados de disputa:

```txt
none
opened
accepted
rejected
refunded
```

## Precio por lead

Variables:

- servicio,
- ciudad,
- presupuesto declarado,
- urgencia,
- nivel de competencia,
- lead simple vs compuesto.

## Lead compuesto

Un lead compuesto vale mÃ¡s porque representa mayor intenciÃ³n.

Payload canonico obligatorio:

- `requested_service_slugs: string[]`

Compatibilidad temporal:

- El alias `related_services` solo se acepta en entrada durante ventana de transicion.
- Ningun registro persistido o evento de negocio debe guardar `related_services`.

Ejemplo:

```txt
Lead simple: 1 servicio
Lead compuesto: 2+ servicios relacionados
Lead proyecto: 4+ servicios o presupuesto alto
```

## Cierre

V1 solo mide cierre reportado.

Estados:

```txt
reported_won
client_confirmed_won
admin_confirmed_won
unconfirmed
```

## Fee por cierre

No activar en V1.  
En V1.5 se puede probar en categorÃ­as piloto.

Regla recomendada:

- fee pequeÃ±o por cierre confirmado,
- solo en proveedores que aceptaron tÃ©rminos,
- evidencia mÃ­nima,
- revisiÃ³n manual si hay disputa.

## No prometer ventas

ComunicaciÃ³n permitida:

```txt
Recibe oportunidades calificadas.
```

Evitar:

```txt
Te garantizamos clientes.
```

