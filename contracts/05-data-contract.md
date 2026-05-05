---
id: DATA_05
title: Data contract
type: data
status: active
priority: high
version: 1.0.0
applies_to:
  - database
  - backend
depends_on:
  - DOMAIN_04
related: []
agent_read_policy: when_related
---
# 05 â€” Data Contract

## Base

Postgres.

## Convenciones

- IDs UUID.
- `created_at`, `updated_at` en tablas principales.
- Slugs Ãºnicos por entidad cuando aplique.
- Estados como `text` con checks o enums controlados.
- Eventos importantes en `lead_events`.
- No borrar fÃ­sicamente datos sensibles salvo polÃ­tica de privacidad; usar soft delete donde aplique.

## BÃºsqueda V1

Usar Postgres con:

- Ã­ndices btree en slugs,
- Ã­ndices por foreign keys,
- Ã­ndices compuestos para ciudad+servicio,
- full text search opcional con `to_tsvector` en espaÃ±ol,
- `jsonb` para payloads de eventos.

## BÃºsqueda V1.5

Evaluar Meilisearch o Typesense si:

- hay mÃ¡s de 5k perfiles,
- filtros crecen,
- relevancia importa mucho,
- Postgres FTS se vuelve insuficiente.

## Datos pÃºblicos vs privados

### PÃºblicos

- nombre proveedor,
- descripciÃ³n,
- servicios,
- zonas,
- reviews aprobadas,
- mÃ©tricas agregadas visibles,
- portfolio pÃºblico si existe.

### Privados

- email del cliente,
- telÃ©fono del cliente,
- detalles sensibles del lead,
- notas internas,
- precio de lead,
- eventos de billing,
- disputas.

## Reglas de privacidad

- El telÃ©fono/email del cliente solo se entrega a proveedores asignados.
- Cada acceso a datos sensibles debe quedar registrado como evento.
- Los perfiles pÃºblicos no deben mostrar datos privados por accidente.
- Reviews deben pasar moderaciÃ³n.

## Seed mÃ­nimo

Servicios iniciales sugeridos:

```txt
cajas-personalizadas
troqueles
impresion
serigrafia-screen
etiquetas
diseno-empaque
fotografia-producto
landing-page
ecommerce
```

Ubicaciones iniciales:

```txt
colombia
bogota
medellin
cali
barranquilla
```

