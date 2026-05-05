---
id: REVIEWS_TRUST_13
title: Reviews and trust contract
type: module
status: active
priority: medium
version: 1.0.0
applies_to:
  - frontend
  - backend
  - admin
depends_on: []
related: []
agent_read_policy: when_related
---
# 13 â€” Reviews & Trust Contract

## Objetivo

Construir confianza sin abrir la puerta a spam o reseÃ±as falsas.

## Reglas de reviews

- Todas las reviews entran como pending.
- Solo reviews aprobadas se publican.
- No permitir review del propio proveedor.
- Asociar review a lead cuando sea posible.
- Mostrar fecha.
- Mostrar rating.
- Moderar lenguaje ofensivo/spam.
- Permitir respuesta del proveedor en V1.5.

## Estados

```txt
pending
approved
rejected
flagged
```

## Score de confianza

Inicialmente simple:

```txt
score = completitud_perfil + reviews + respuesta + verificaciÃ³n
```

Componentes:

- Perfil completo.
- TelÃ©fono validado.
- Email validado.
- Reviews aprobadas.
- Tiempo de respuesta.
- Cierres confirmados futuros.

## Badges

V1:

- Perfil verificado.
- Responde rÃ¡pido.
- Nuevo proveedor.

V1.5:

- Cierres confirmados.
- Top categorÃ­a.
- Alta satisfacciÃ³n.

## Anti-fraude bÃ¡sico

- Limitar reviews por email/telÃ©fono.
- Detectar duplicados.
- RevisiÃ³n manual si hay muchas reviews seguidas.
- No publicar AggregateRating si las reviews no son visibles y reales.

