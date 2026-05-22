---
id: ONBOARDING_FLOW_43
title: Flujo de onboarding — minima friccion
type: analysis
status: active
priority: high
version: 1.0.0
applies_to:
  - product
  - engineering
  - ux
depends_on:
  - SLICE2_41
  - API_06
  - AUTH_RBAC_28
  - PROVIDER_PANEL_11
---

# 43 — Flujo de onboarding: minima friccion

## Estado actual (Mayo 2026)

El flujo completo de creacion de una cuenta provider funciona end-to-end:

```
/panel/registro  →  /panel/perfil  →  /admin/providers (aprobar)  →  /proveedores/[slug]
    (30s)             (2-5min)              (admin, 5s)                  (publico)
```

### Paso a paso

| # | Paso | Donde | Tiempo estimado | Que se pide |
|---|------|-------|-----------------|-------------|
| 1 | Registro | `/panel/registro` | 30s | Email, password, nombre del negocio |
| 2 | Perfil | `/panel/perfil` | 2-5min | Descripcion, telefono, WhatsApp, web, logo URL, cover URL, template, servicios, ciudades |
| 3 | Aprobacion | `/admin/providers` | 5s (admin) | Click en "Aprobar" |
| 4 | Publico | `/proveedores/[slug]` | instantaneo | Pagina generada automaticamente con template CSS |

### Minimo viable para publicar

Para que un provider aparezca en el sitio publico necesita:
1. Cuenta creada (registro) ✅
2. **Al menos 1 servicio seleccionado** ✅
3. **Al menos 1 ciudad de cobertura** ✅
4. Status = `active` (admin aprueba) ✅
5. Nombre comercial (display_name) ✅

**Con solo 3 campos el provider ya es visible: email, password, nombre.** El resto (descripcion, telefono, template personalizado) mejora la pagina pero no bloquea la publicacion.

## Friccion actual vs ideal

### Friccion detectada

| Punto de friccion | Severidad | Solucion |
|-------------------|-----------|----------|
| Despues de registro, redirect a `/panel/perfil` sin contexto | Media | Mostrar checklist y guia "que sigue" en el dashboard |
| Template selector: 6 opciones sin preview grande | Baja | El preview lateral ya existe y es funcional |
| Servicios: checkboxes sin descripcion de cada servicio | Baja | Se muestran todos juntos, es claro |
| URL de logo/cover: hay que hostear la imagen en otro lado | Alta (futuro) | En V1.5: upload directo de imagen |
| No hay "vista previa" de como queda la pagina publica | Media | Link desde el perfil a `/proveedores/[slug]` |

### Lo que funciona bien

- Registro en 1 paso (3 campos) — minima friccion
- Template preview en tiempo real al cambiar el selector
- Servicios y ciudades en checkboxes — seleccion rapida
- Checklist de completitud en dashboard con barra de progreso
- Admin puede crear provider completo (template + servicios) en 1 paso

## Roles de cuenta y creacion

### Cliente (end user)
- No necesita cuenta para enviar leads
- El formulario de lead es publico, sin login
- Futuro: panel cliente para ver historial de solicitudes

### Provider
- Se registra solo en `/panel/registro`
- Requiere aprobacion admin para ser visible
- Flujo auto-guiado: registro → dashboard (checklist) → perfil

### Admin
- **No hay self-registration** (por seguridad)
- El primer admin se crea via `POST /api/setup/first-admin` (solo si no hay admins)
- Admins subsecuentes: los crea un admin existente desde `/admin/providers` o via SQL
- Login en `/admin/login`

## Setup inicial del sistema

En un VPS nuevo (0 cuentas):

```
1. POST /api/setup/first-admin  { email, password }
   → Crea el primer admin (solo funciona si no hay ninguno)

2. El admin entra a /admin/login con sus credenciales

3. Desde /admin/providers puede:
   - Crear providers manualmente (con template + servicios)
   - Aprobar providers registrados

4. Desde /admin/services puede:
   - Crear/editar servicios
   - Definir precios base de lead
```

## Pendientes detectados en auditoria

Ver `contracts/` para detalle completo. Lo critico ya esta resuelto:

- [x] Provider suspendido no accede al panel (`resolveProviderIdFromAccount` chequea status)
- [x] Setup first-admin sin cuentas preexistentes
- [x] Pagina de confirmacion de lead (no JSON crudo)
- [ ] Wallet/billing (Fase 6)
- [ ] Upload de imagenes (Fase 8)
- [ ] Contenido SEO / blog posts
