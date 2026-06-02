---
id: VISUAL_DESIGN_ROUTE_55
title: "Ruta de mejora visual y diseño UI"
type: governance
status: active
priority: critical
version: 1.0.0
applies_to:
  - engineering
  - design
  - frontend
depends_on:
  - CMS_51
  - UX_IMPROVEMENT_49
---

# 55 — Ruta de mejora visual

## Diagnostico

**Score visual actual: 5.2/10**

El marketplace funciona pero no tiene identidad visual cohesiva. Cada pagina es una isla con sus propios estilos inline. Los `tokens.css` y `BaseLayout.astro` existen pero nadie los usa.

---

## Bugs criticos (arreglar YA)

| # | Bug | Archivo | Impacto |
|---|-----|---------|---------|
| 1 | Cover image duplicado en perfil provider | `proveedores/[providerSlug].astro:125-131` | Muestra dos veces la misma imagen |
| 2 | Inputs del login provider sin estilo | `panel/login/index.astro` | Se ve roto vs el registro |
| 3 | Posts renderizan texto crudo (no markdown) | `publicaciones/[slug]/index.astro` | Contenido ilegible |
| 4 | `renderTemplateGrid()` llamado 3 veces | `panel/perfil/index.astro` | Flickering y race conditions |

---

## Fase 1: Identidad visual (3-4 horas)

### 1.1 Adoptar BaseLayout + tokens.css
- [ ] Migrar todas las paginas publicas a usar `<BaseLayout>`
- [ ] Importar `tokens.css` desde BaseLayout
- [ ] Reemplazar colores hardcodeados por variables CSS

### 1.2 Logo + favicon
- [ ] Agregar favicon
- [ ] Agregar logo/marca en header de BaseLayout
- [ ] Consistencia de "Reindr Marketplace" en todas las paginas

### 1.3 Escala tipografica
- [ ] Definir h1-h6 en tokens.css
- [ ] Aplicar a todas las paginas via BaseLayout

### 1.4 Header global con navegacion
- [ ] Nav: Inicio | Servicios | Publicaciones | Planes
- [ ] Boton "Panel proveedor" / "Admin"

---

## Fase 2: Componentes consistentes (2-3 horas)

### 2.1 Botones unificados
- [ ] `.btn-primary`: fondo `--color-brand`, texto blanco, border-radius, hover
- [ ] `.btn-secondary`: borde `--color-border`, fondo blanco
- [ ] `.btn-danger`: fondo `--color-error`, texto blanco

### 2.2 Inputs unificados
- [ ] Todos los inputs con mismo padding, border, radius
- [ ] Focus states con outline verde
- [ ] Error states con borde rojo

### 2.3 Cards unificadas
- [ ] `.card`: border, radius, padding, shadow consistentes
- [ ] `.card-hover`: hover effect con elevation

### 2.4 Provider list como cards
- [ ] Reemplazar `<ul>` sin estilo en service pages por cards

---

## Fase 3: Paginas especificas (2-3 horas)

### 3.1 Blog post renderer
- [ ] Implementar renderizado Markdown basico (h1-h3, p, ul, strong, a)
- [ ] Estilos tipograficos para contenido de articulo

### 3.2 Admin theme bridge
- [ ] Agregar `#4ecca3` (teal green) como puente entre admin oscuro y brand verde

### 3.3 Empty states con iconos
- [ ] Reemplazar `-` (dash) en dashboards por indicadores visuales
- [ ] Agregar iconos o emojis a mensajes de empty state

### 3.4 Hover effects globales
- [ ] Cards de servicio: elevation + border-color en hover
- [ ] Links de navegacion: underline en hover
- [ ] Botones: ligero darken/lighten

---

## Fase 4: Responsive completo (1-2 horas)

### 4.1 Breakpoints en todas las paginas
- [ ] Agregar `@media (max-width: 640px)` a paginas faltantes
- [ ] Tablas: scroll horizontal en mobile
- [ ] Stepper: texto responsive

### 4.2 Panel provider sidebar
- [ ] Navegacion lateral en desktop, top bar en mobile

---

## Resumen visual post-mejora

```
Score actual: 5.2/10
Score esperado post-Fase 1: 7/10
Score esperado post-Fase 2: 8/10  
Score esperado post-Fase 4: 9/10
```
