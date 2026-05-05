---
id: ADMIN_12
title: Admin contract
type: module
status: active
priority: high
version: 1.0.0
applies_to:
  - frontend
  - backend
depends_on:
  - API_06
  - SECURITY_15
related: []
agent_read_policy: when_related
---
# 12 â€” Admin Contract

## Objetivo

Permitir operaciÃ³n manual controlada para mantener el MVP simple.

## MÃ³dulos

### Proveedores

- listar,
- aprobar,
- suspender,
- editar,
- ver completitud,
- ver leads.

### Servicios

- crear,
- editar,
- activar/desactivar,
- definir precio base de lead.

### Relaciones de servicios

- source_service,
- target_service,
- tipo,
- peso,
- texto sugerido,
- activo/inactivo.

### Leads

- listar,
- ver detalle,
- reasignar,
- marcar invÃ¡lido,
- crear evento interno,
- resolver disputa.

### Reviews

- aprobar,
- rechazar,
- marcar sospechosa,
- responder internamente.

### MÃ©tricas

- leads por categorÃ­a,
- leads por ciudad,
- proveedores activos,
- tiempo de respuesta,
- ingresos estimados,
- tasa de invalidez.

## OperaciÃ³n manual permitida en V1

- Validar leads dudosos.
- Reasignar oportunidades.
- Ajustar relaciÃ³n entre servicios.
- Ajustar precio por lead.
- Confirmar cierre manualmente.

