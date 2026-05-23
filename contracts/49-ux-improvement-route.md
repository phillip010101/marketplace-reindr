---
id: UX_IMPROVEMENT_ROUTE_49
title: "Ruta de mejora UI/UX — evaluacion completa"
type: governance
status: active
priority: critical
version: 1.0.0
applies_to:
  - frontend
  - ux
  - product
depends_on:
  - UIUX_10
  - PROVIDER_PANEL_11
  - SEO_07
related:
  - DOD_21
  - CONTRACT_TO_CODE_44
agent_read_policy: always_when_touching_module
---

# 49 — Ruta de mejora UI/UX

## Resumen ejecutivo

El marketplace es funcional pero tiene **friccion significativa en los flujos clave**: registro, seleccion de template, formulario de lead, navegacion publica. La mayoria de los problemas son de **bajo esfuerzo / alto impacto**. Se organizan en 4 fases priorizadas por relacion esfuerzo/impacto.

---

## Fase A — Correcciones criticas (esfuerzo bajo, impacto maximo)

Estos items rompen la experiencia. Arreglarlos toma poco tiempo.

### A1. Buscador del home no funciona
**Archivo**: `index.astro`
**Problema**: El `<form>` tiene `action="/bogota/cajas-personalizadas"` fijo. El input de busqueda se ignora.
**Solucion**: Cambiar a un formulario que redirija dinamicamente con JS o usar un `<select>` de servicio + `<select>` de ciudad.

### A2. WhatsApp no es clickeable
**Archivos**: `proveedores/[providerSlug].astro`, `panel/perfil/index.astro`, lead form
**Problema**: Los numeros de WhatsApp son texto plano, no links `wa.me`. En LATAM esto es critico.
**Solucion**: Envolver en `<a href="https://wa.me/57{numero}">` con formato internacional.

### A3. Nombres de servicio como slugs en perfil publico
**Archivo**: `proveedores/[providerSlug].astro`
**Problema**: La lista de servicios muestra `cajas-personalizadas` en vez de "Cajas personalizadas".
**Solucion**: Fetch los nombres de servicio via API o usar el catalogo `getServiceName()`.

### A4. Bogota hardcodeado en todo el sitio
**Archivos**: `index.astro`, `proveedores/[providerSlug].astro`
**Problema**: Todos los links van a `/bogota/...`. Un provider en Medellin o Cali no funciona.
**Solucion**: Leer `city` del provider desde la API y usar ese slug en los links.

### A5. Loading states en todos los botones submit
**Archivos**: Todos los forms (registro, login, perfil, lead, admin)
**Problema**: Doble submit sin feedback visual.
**Solucion**: Funcion `setButtonLoading(btn, "Guardando...")` que deshabilita y muestra texto temporal.

---

## Fase B — Flujo de registro y onboarding (esfuerzo medio, alto impacto)

### B1. Password confirmation en registro
**Archivo**: `panel/registro/index.astro`
**Agregar**: Campo "Repetir contraseña" con validacion client-side de igualdad.

### B2. Forgot password en ambos logins
**Archivos**: `panel/login/index.astro`, `admin/login/index.astro`
**Agregar**: Link "¿Olvidaste tu contraseña?" que por ahora puede abrir un mailto o mostrar instrucciones.

### B3. Mejoras post-registro
**Archivo**: `panel/index.astro`
- Redirigir a `/panel` (dashboard) en vez de `/panel/perfil` directamente
- Mostrar un banner tipo "Completa tu perfil en 3 pasos" con progreso
- El checklist ya existe pero deberia ser lo primero que ve el usuario

### B4. Terms of service checkbox en registro
**Archivo**: `panel/registro/index.astro`
**Agregar**: Checkbox "Acepto los terminos y condiciones" requerido.

### B5. Correccion de typos en español
- "Contrasena" → "Contraseña"
- "Se notifico" → "Se notificó"
- "role provider" → "rol de proveedor"
- Revisar todos los textos con `aspell -d es`

---

## Fase C — Template y perfil (esfuerzo medio, alto impacto visual)

### C1. Rediseno del selector de templates
**Archivos**: `panel/perfil/index.astro`, `packages/core/src/provider-templates.ts`

Nuevo diseno:
- **Grid de thumbnails** (3x2) en vez de dropdown. Cada thumbnail es un mini preview con los colores del template.
- **Live preview GRANDE** que se actualiza con los datos reales del provider (display_name, description), no con placeholder.
- **Descripcion y tags** por template: "Craft Paper — Cálido, artesanal, papel kraft" / "Urban Ink — Moderno, editorial, contraste"
- **Indicador de template activo** (check o borde resaltado)

Estructura de datos nueva:
```ts
{
  id: 'craft-paper',
  name: 'Craft Paper',
  description: 'Tonos cálidos de papel kraft, ideal para productos artesanales y naturales.',
  tags: ['cálido', 'artesanal', 'natural'],
  ...
}
```

### C2. Profile preview en tiempo real
**Archivo**: `panel/perfil/index.astro`
Mientras el provider llena el formulario, un panel lateral muestra como se vera su perfil publico (usando display_name, description, template seleccionado). Esto cierra el gap entre "llenar formulario" y "ver resultado".

### C3. Logo y cover visibles en perfil publico
**Archivo**: `proveedores/[providerSlug].astro`
Renderizar `<img src={logo_url}>` y `<img src={cover_url}>` cuando existan.

### C4. Reemplazar "Template: Craft Paper" visible al publico
**Archivo**: `proveedores/[providerSlug].astro`
Eliminar el `<p id="provider-template-label">` del perfil publico. Es metadata de desarrollo, no aporta al usuario final.

---

## Fase D — Formulario de lead y conversion (esfuerzo medio, alto impacto)

### D1. Barra de progreso en lead form
**Archivo**: `[city]/[service].astro`
Agregar indicador visual: `[●] Paso 1 — [○] Paso 2 — [○] Paso 3` con dots o stepper.

### D2. Validacion inline en cada paso
Validar los campos de cada paso ANTES de permitir avanzar al siguiente. Mostrar errores debajo de cada campo en rojo.

### D3. Selector de ciudad en el form
Agregar un `<select>` de ciudad (fetch de `/api/locations?type=city`) en el paso 1, en vez de depender del URL.

### D4. Budget como dropdown con rangos predefinidos
Reemplazar input libre por:
```
<select>
  <option value="">Presupuesto (opcional)</option>
  <option value="0-500k">Menos de $500.000</option>
  <option value="500k-2M">$500.000 - $2.000.000</option>
  <option value="2M-5M">$2.000.000 - $5.000.000</option>
  <option value="5M+">Mas de $5.000.000</option>
</select>
```

### D5. Copy button para codigo de seguimiento
**Archivo**: `confirmacion/index.astro`
Agregar boton "Copiar codigo" que use `navigator.clipboard.writeText()`.

---

## Fase E — Infraestructura UI (esfuerzo alto, impacto a largo plazo)

### E1. Layout compartido
Crear `src/layouts/BaseLayout.astro` con:
- `<head>` comun (charset, viewport, meta tags)
- Navbar reutilizable
- Footer con links legales
- Slot para contenido

Migrar todas las paginas a usar `<BaseLayout>`.

### E2. Design tokens CSS
Crear `src/styles/tokens.css`:
```css
:root {
  --color-brand: #0b5d1e;
  --color-brand-light: #f0faf3;
  --color-error: #a40000;
  --color-bg: #f2f4f7;
  --color-border: #dde2ea;
  --radius-sm: 6px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --shadow-card: 0 1px 3px rgba(0,0,0,0.08);
}
```

### E3. Loading state utility
```ts
function setButtonLoading(btn: HTMLButtonElement, text: string) {
  btn.disabled = true;
  btn.dataset.originalText = btn.textContent ?? '';
  btn.textContent = text;
}
function resetButton(btn: HTMLButtonElement) {
  btn.disabled = false;
  btn.textContent = btn.dataset.originalText ?? '';
}
```

### E4. Responsive breakpoints
Agregar media queries en todas las paginas:
```css
@media (max-width: 640px) {
  .admin-grid { grid-template-columns: 1fr; }
  table { font-size: 11px; }
}
```

---

## Mapa de implementacion

```
Fase A (Critica) ───────── 2-3 horas
  A1 Buscador home         A2 WhatsApp links        A3 Service names
  A4 Bogota hardcodeado    A5 Loading states

Fase B (Registro) ──────── 2-3 horas  
  B1 Password confirm      B2 Forgot password       B3 Post-registro UX
  B4 Terms checkbox        B5 Typos español

Fase C (Template/Perfil) ─ 3-4 horas
  C1 Grid thumbnails       C2 Profile preview       C3 Logo/cover
  C4 Ocultar metadata

Fase D (Lead form) ─────── 2-3 horas
  D1 Progress bar          D2 Inline validation     D3 City selector
  D4 Budget dropdown       D5 Copy button

Fase E (Infraestructura) ─ 4-6 horas
  E1 Layout compartido     E2 Design tokens         E3 Loading utility
  E4 Responsive
```

## Prioridad sugerida

1. **Fase A completa** (critico, rompe la experiencia)
2. **Fase B** (mejora la conversion de registro)
3. **Fase C** (el "builder" que querias — template + preview)
4. **Fase D** (mejora la conversion de leads)
5. **Fase E** (deuda tecnica, hacer cuando haya tiempo)

---

## Contratos afectados

- `10-ui-ux-contract.md`: actualizar con los nuevos componentes y patrones
- `11-provider-panel-contract.md`: actualizar flujo de onboarding
- `07-seo-local-contract.md`: actualizar con mejoras de contenido publico
