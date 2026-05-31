---
id: PROVIDER_CMS_52
title: "CMS del proveedor — analisis y ruta completa"
type: analysis
status: active
priority: critical
version: 1.0.0
applies_to:
  - product
  - engineering
  - frontend
  - ux
depends_on:
  - CMS_51
  - PROVIDER_PANEL_11
  - UIUX_10
---

# 52 — CMS del proveedor

## Diagnostico actual

El provider hoy tiene un panel con paginas separadas sin conexion visual entre ellas:

```
/panel           → Dashboard (metricas + checklist + wallet)
/panel/perfil    → Formulario largo (datos + template + servicios + ciudades)
/panel/leads     → Bandeja de leads
/panel/plan      → Plan actual + upgrade
/panel/login     → Login
/panel/registro  → Registro
```

**Problemas:**
- No hay link ni preview de "como se ve mi pagina publica"
- No hay URL visible de su perfil publico
- El editor de perfil es un formulario unico gigante sin secciones claras
- No hay analytics (cuantas visitas, de donde vienen)
- No hay portfolio/galeria de trabajos
- No hay SEO settings para su pagina
- La vista previa de template esta desconectada del resto
- El checklist de completitud esta en el dashboard, lejos del editor

## Vision: CMS del proveedor ideal

Un provider deberia poder gestionar TODO lo de su pagina publica desde UN SOLO LUGAR integrado, con preview en vivo.

```
┌─────────────────────────────────────────────────────────────┐
│  PANEL PROVEEDOR                          [Ver mi pagina ↗] │
│  https://apps.reindr.org/proveedores/cajas-acme             │
├──────────┬──────────────────────────────────────────────────┤
│          │                                                  │
│  NAV     │            AREA DE EDICION                       │
│          │                                                  │
│  📄 Pag  │  ┌────────────────────────────────────────────┐  │
│  🎨 Dise │  │  SECCION: Informacion del negocio          │  │
│  🛠 Serv │  │  Nombre [Cajas Acme_________________]      │  │
│  🖼 Port │  │  Descripcion [Fabricamos cajas______]      │  │
│  📍 Ciud │  │  Telefono [________]  WhatsApp [________]  │  │
│  🔍 SEO  │  │  Web [________]                            │  │
│  📊 Anal │  │  Logo [🖼 preview]                         │  │
│  ⚙️ Conf │  │                                            │  │
│          │  └────────────────────────────────────────────┘  │
│          │                                                  │
│          │  ┌────────────────────────────────────────────┐  │
│          │  │        PREVIEW EN VIVO                      │  │
│          │  │  ┌──────────────────────────────────────┐  │  │
│          │  │  │  ← Servicios                         │  │  │
│          │  │  │                                      │  │  │
│          │  │  │  [LOGO]                              │  │  │
│          │  │  │                                      │  │  │
│          │  │  │  Cajas Acme                          │  │  │
│          │  │  │  Fabricamos cajas personalizadas...  │  │  │
│          │  │  │                                      │  │  │
│          │  │  │  📞 +57 300 1234                     │  │  │
│          │  │  │  💬 WhatsApp                         │  │  │
│          │  │  │                                      │  │  │
│          │  │  │  Servicios                            │  │  │
│          │  │  │  • Cajas personalizadas              │  │  │
│          │  │  │  • Diseño de empaque                 │  │  │
│          │  │  └──────────────────────────────────────┘  │  │
│          │  └────────────────────────────────────────────┘  │
│          │                                                  │
└──────────┴──────────────────────────────────────────────────┘
```

### Secciones del CMS provider

| Seccion | Que contiene | Estado actual |
|---------|-------------|---------------|
| **📄 Pagina** | Info del negocio (nombre, desc, contacto, logo, cover) | Existe en /panel/perfil pero desorganizado |
| **🎨 Diseño** | Templates + custom styles + preview | Existe pero separado del resto |
| **🛠 Servicios** | Que servicios ofrece, en que ciudades | Existe |
| **🖼 Portfolio** | Galeria de imagenes de trabajos | ❌ No existe |
| **📍 Ciudades** | Zonas de cobertura | Existe |
| **🔍 SEO** | Meta title, description, keywords para su pagina | ❌ No existe |
| **📊 Analytics** | Visitas a su perfil, leads recibidos, conversion | ❌ No existe (solo metricas de leads) |
| **⚙️ Config** | URL publica, custom domain (Pro), visibilidad | ❌ Parcial (solo plan) |

## Lo que falta (gaps criticos)

### P0 — Bloquea la experiencia

| Gap | Solucion |
|-----|----------|
| **No hay link "Ver mi pagina"** | Boton visible con URL publica en el header del panel |
| **No hay preview integrado** | Panel derecho con preview en vivo que se actualiza al editar |
| **Editor fragmentado** | Unificar /panel/perfil en secciones con tabs/navegacion lateral |

### P1 — Importante para el CMS

| Gap | Solucion |
|-----|----------|
| **No hay SEO settings** | Agregar campos: meta_title, meta_description en providers |
| **No hay portfolio** | Tabla portfolio_images + seccion de upload/galeria |
| **No hay analytics de pagina** | Endpoint GET /api/provider/analytics (visitas, origen) |
| **URL publica oculta** | Mostrar Slug + URL completa + boton copiar |

### P2 — Nice to have

| Gap | Solucion |
|-----|----------|
| **No hay vista previa mobile** | Toggle desktop/mobile en el preview |
| **No hay historial de cambios** | Audit trail de ediciones del perfil |
| **No hay programacion** | Publicar/cambios programados (draft → published) |

## Plan de implementacion

### Fase 1: Unificar y previsualizar (2-3 horas)
- [ ] Redisenar /panel/perfil con layout de 2 columnas (editor | preview)
- [ ] Navegacion lateral con secciones (Pagina, Diseño, Servicios, SEO)
- [ ] Preview en vivo que se actualiza al escribir
- [ ] Boton "Ver mi pagina" visible con URL publica
- [ ] Mover checklist de completitud al editor

### Fase 2: SEO + Portfolio (2-3 horas)
- [ ] Migration: meta_title, meta_description en providers
- [ ] Migration: portfolio_images table
- [ ] API: PATCH provider SEO fields
- [ ] API: CRUD portfolio images
- [ ] UI: seccion SEO en editor
- [ ] UI: seccion Portfolio con upload (URL por ahora)

### Fase 3: Analytics (1-2 horas)
- [ ] Tabla page_views (provider_id, date, count)
- [ ] Middleware de conteo en pagina publica
- [ ] API: GET /api/provider/analytics
- [ ] UI: dashboard con graficos simples (visitas/dia, leads/mes)

### Fase 4: Pulido final (1-2 horas)
- [ ] Copiar URL publica con un click
- [ ] Vista previa mobile toggle
- [ ] Indicadores de "ultima actualizacion"
- [ ] Vista previa del custom domain (Pro)
