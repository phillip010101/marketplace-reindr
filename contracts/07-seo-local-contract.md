---
id: SEO_07
title: SEO local contract
type: seo
status: active
priority: medium
version: 1.0.0
applies_to:
  - frontend
  - content
depends_on: []
related: []
agent_read_policy: when_related
---
# 07 â€” SEO Local Contract

## Objetivo

Crear pÃ¡ginas indexables Ãºtiles que capturen intenciÃ³n local y de servicio sin caer en pÃ¡ginas repetitivas sin valor.

## Rutas pÃºblicas

```txt
/
/servicios
/servicios/[service]
/[city]
/[city]/[service]
/[city]/[service]/[zone]
/proveedores/[provider-slug]
/publicaciones/[slug]
/guias/[slug]
/comparativas/[slug]
```

## Regla anti-pÃ¡ginas vacÃ­as

No publicar una ruta ciudad+servicio si no tiene al menos uno de estos:

- proveedores reales,
- contenido editorial especÃ­fico,
- guÃ­a de precios,
- preguntas frecuentes locales,
- seÃ±ales de demanda,
- intenciÃ³n clara.

## PÃ¡gina ciudad + servicio

Debe incluir:

- H1: `[Servicio] en [Ciudad]`
- descripciÃ³n Ãºnica,
- proveedores activos,
- filtros,
- CTA de solicitud,
- servicios relacionados,
- FAQs,
- contenido local,
- enlaces a servicios complementarios,
- enlaces a ciudades cercanas,
- breadcrumbs.

## Perfil proveedor

Debe incluir:

- nombre,
- descripciÃ³n,
- servicios,
- zonas,
- fotos/portfolio,
- reviews aprobadas,
- CTA de contacto/solicitud,
- datos verificables,
- tiempo de respuesta si existe,
- schema apropiado.

## Contenido editorial

Tipos:

- guÃ­as de costo,
- comparativas,
- "cÃ³mo elegir proveedor",
- "errores frecuentes",
- "servicios complementarios",
- casos de uso.

## Schema sugerido

- LocalBusiness cuando aplique.
- Service.
- BreadcrumbList.
- FAQPage cuando haya FAQ real visible.
- Review/AggregateRating solo si reviews son visibles, reales y moderadas.

## Canonicals

- Cada pÃ¡gina debe tener canonical.
- Evitar duplicados por filtros.
- No indexar parÃ¡metros de bÃºsqueda.

## Sitemap

Generar sitemap con:

- servicios activos,
- ciudades activas,
- pÃ¡ginas ciudad+servicio publicables,
- perfiles activos,
- publicaciones.

## Robots

No indexar:

- paneles,
- resultados internos con filtros,
- pÃ¡ginas sin contenido suficiente,
- drafts,
- admin.

