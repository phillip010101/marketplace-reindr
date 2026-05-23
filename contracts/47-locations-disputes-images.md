---
id: LOCATIONS_DISPUTE_47
title: Ubicaciones admin + Disputas + Imagenes — contratos pendientes
type: module
status: active
priority: medium
version: 1.0.0
applies_to:
  - backend
  - frontend
  - admin
depends_on:
  - ADMIN_12
  - API_06
  - AUTH_RBAC_28
related:
  - MIGRATIONS_31
agent_read_policy: when_related
---

# 47 — Ubicaciones, Disputas e Imagenes

## A — Admin CRUD de ubicaciones

### Objetivo
Permitir al admin crear/editar ubicaciones (ciudades, zonas) desde el panel. Hoy `GET /api/locations` es read-only.

### Endpoints

| Metodo | Ruta | Auth |
|--------|------|------|
| `POST` | `/api/admin/locations` | admin |
| `PATCH` | `/api/admin/locations/:id` | admin |

### Schema de creacion
```json
{
  "name": "Barranquilla",
  "slug": "barranquilla",
  "type": "city",
  "parent_id": "uuid-de-colombia"
}
```

### UI
- Nueva pestana "Ubicaciones" en `/admin/ubicaciones`
- Tabla con ciudades existentes + formulario de creacion
- Boton activar/desactivar (usar campo `active` si se agrega)

---

## B — Disputas de leads

### Objetivo
Permitir al provider disputar un lead como invalido, y al admin resolver la disputa.

### Estados de disputa
```
none → opened → accepted (reembolso) / rejected (no reembolso)
```

### Endpoints

| Metodo | Ruta | Auth | Descripcion |
|--------|------|------|-------------|
| `POST` | `/api/provider/leads/:oppId/dispute` | provider | Abrir disputa con motivo |
| `GET` | `/api/admin/disputes` | admin | Listar disputas abiertas |
| `POST` | `/api/admin/disputes/:id/resolve` | admin | Aceptar o rechazar disputa |

### Schema de disputa
```json
{
  "reason": "telefono no contesta",
  "details": "Llame 3 veces en 48h sin respuesta"
}
```

### Reglas
- Solo se puede disputar un lead con `valid_for_billing = true`
- Ventana de disputa: 7 dias desde que se marco como `valid_for_billing`
- Si admin acepta → reembolso automatico (si hay debito)
- Si admin rechaza → disputa cerrada, no hay reembolso

---

## C — Upload de imagenes

### Objetivo
Reemplazar los campos `logo_url` y `cover_url` (URLs) por upload directo.

### Alcance V2 (NO implementar ahora)
- Upload via multipart/form-data
- Almacenamiento en disco local (`/home/reindr.org/public_html/uploads/`)
- Redimension automatica (max 1200px ancho, max 2MB)
- Servir via LiteSpeed como archivos estaticos

### Preparacion V1.5 (implementar ahora)
- Agregar `accept="image/*"` en los inputs de logo_url/cover_url del perfil
- Validar que la URL termine en extension de imagen (.jpg, .png, .webp)
- Mostrar preview de la imagen cuando se ingresa URL

---

## D — Emails transaccionales (futuro)

### Objetivo
Notificar al provider por email cuando recibe un nuevo lead.

### Alcance V1.5 (NO implementar ahora, solo preparar)
- Template de email: "Nuevo lead de [servicio] en [ciudad]"
- Envio via servicio externo (SendGrid, AWS SES, etc.)
- Configuracion via variables de entorno
