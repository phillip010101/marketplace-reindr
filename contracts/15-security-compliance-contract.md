---
id: SECURITY_15
title: Security compliance contract
type: security
status: active
priority: critical
version: 1.0.0
applies_to:
  - frontend
  - backend
  - database
depends_on:
  - ARCH_03
  - DOMAIN_04
related: []
agent_read_policy: when_related
---
# 15 â€” Security & Compliance Contract

## Objetivo

Proteger datos de clientes, proveedores y operaciÃ³n.

## Datos sensibles

- telÃ©fono,
- email,
- direcciÃ³n,
- notas privadas,
- conversaciones,
- detalles de lead,
- pagos futuros.

## Reglas mÃ­nimas

- HTTPS.
- Hash de contraseÃ±as con algoritmo moderno.
- Variables secretas fuera del repo.
- ValidaciÃ³n server-side.
- Rate limit en formularios.
- SanitizaciÃ³n.
- Logs sin secretos.
- No exponer tokens.
- Backups de DB.
- Roles y permisos.

## Roles

```txt
client
provider
admin
```

## Permisos

### PÃºblico

- ver perfiles activos,
- ver pÃ¡ginas pÃºblicas,
- crear lead.

### Proveedor

- editar su perfil,
- ver sus oportunidades,
- cotizar sus oportunidades,
- actualizar sus estados.

### Admin

- ver todo,
- moderar,
- aprobar,
- reasignar,
- marcar invÃ¡lido,
- configurar servicios.

## AuditorÃ­a

Registrar eventos:

- lead creado,
- lead asignado,
- lead visto,
- estado cambiado,
- cotizaciÃ³n creada,
- review creada,
- review moderada,
- proveedor aprobado,
- lead marcado invÃ¡lido.

## PolÃ­ticas visibles

- tÃ©rminos de proveedores,
- polÃ­tica de privacidad,
- polÃ­tica de leads,
- polÃ­tica de reviews,
- polÃ­tica futura de pagos.

