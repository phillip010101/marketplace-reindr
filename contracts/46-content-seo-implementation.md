---
id: CONTENT_SEO_46
title: Contenido SEO y blog — implementacion
type: module
status: active
priority: medium
version: 1.0.0
applies_to:
  - frontend
  - content
depends_on:
  - SEO_07
  - UIUX_10
related:
  - API_06
agent_read_policy: when_related
---

# 46 — Contenido SEO y Blog

## Objetivo

Poblar el directorio `content/posts/` (actualmente vacio) con contenido editorial util para SEO local. Activar Astro content collections para publicaciones.

## Estructura de contenido

```
content/posts/
  guia-precios-cajas-personalizadas-bogota.md
  como-elegir-proveedor-troqueles.md
  errores-frecuentes-impresion-empaques.md
  servicios-complementarios-diseno-empaque.md
  comparativa-impresion-digital-vs-offset.md
```

Cada post debe tener frontmatter:

```yaml
---
title: string
description: string (meta description)
date: ISO date
city: string (slug de ciudad, opcional)
service: string (slug de servicio, opcional)
type: 'guia' | 'comparativa' | 'tutorial' | 'caso'
---
```

## Paginas nuevas

| Ruta | Contenido |
|------|-----------|
| `/publicaciones` | Listado de todos los posts |
| `/publicaciones/[slug]` | Post individual con breadcrumbs |

## Paginas existentes a enriquecer

| Ruta | Accion |
|------|--------|
| `/bogota/[service]` | Agregar seccion "Guias relacionadas" abajo de los proveedores |
| `/proveedores/[slug]` | Agregar schema `LocalBusiness` JSON-LD |
| `/servicios/[service]` | Agregar seccion "Publicaciones sobre este servicio" |

## SEO tecnico

- [ ] Sitemap.xml automatico (Astro puede generarlo)
- [ ] robots.txt (no index: /panel, /admin, /confirmacion)
- [ ] Schema JSON-LD en paginas clave (LocalBusiness, Service, FAQPage, BreadcrumbList)
- [ ] Canonical en todas las paginas (ya implementado)
- [ ] Meta description unico por pagina (ya implementado)

## Contenido inicial sugerido (5 posts)

1. "Guia de precios: cajas personalizadas en Bogota 2026"
2. "Como elegir un proveedor de troqueles para tu empaque"
3. "5 errores frecuentes al mandar a hacer empaques impresos"
4. "Diseno de empaque + impresion: por que pedirlos juntos"
5. "Impresion digital vs offset: cual te conviene segun tu tiraje"

## No incluir

- Sistema de CMS completo
- Autorizacion multi-autor
- Programacion de publicaciones
- Comentarios en posts
