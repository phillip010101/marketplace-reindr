---
id: SCOPE_02
title: MVP scope
type: product
status: active
priority: high
version: 1.0.0
applies_to:
  - product
  - frontend
  - backend
  - database
depends_on:
  - PRODUCT_01
related: []
agent_read_policy: when_related
---
# 02 â€” MVP Scope Contract

## MVP en una frase

Un directorio SEO de servicios locales con perfiles de proveedores, reviews, solicitudes multi-servicio y bandeja de leads para proveedores.

## Funciones must-have

### Sitio pÃºblico

- Home con buscador simple.
- PÃ¡gina de servicio.
- PÃ¡gina ciudad + servicio.
- Perfil de proveedor.
- Formulario de solicitud.
- Sugerencias de servicios relacionados.
- ConfirmaciÃ³n de solicitud.

### Proveedor

- Registro.
- Login.
- Crear perfil.
- Seleccionar servicios ofrecidos.
- Seleccionar zonas atendidas.
- Recibir leads.
- Ver detalle de lead.
- Cambiar estado.
- Enviar cotizaciÃ³n bÃ¡sica.

### Admin

- Crear/editar servicios.
- Crear/editar ubicaciones.
- Crear/editar relaciones entre servicios.
- Aprobar proveedores.
- Ver leads.
- Moderar reviews.

### Datos

- Postgres.
- Migraciones.
- Seed inicial.
- Estados de lead.
- AuditorÃ­a mÃ­nima con eventos.

## Funciones should-have

- Reviews visibles y moderadas.
- Score bÃ¡sico de perfil.
- Filtros por zona.
- Filtros por servicio.
- Precio estimado del lead por categorÃ­a.
- Panel de mÃ©tricas bÃ¡sico.

## Funciones could-have

- Wallet prepaga.
- Comparador de cotizaciones.
- Emails transaccionales.
- Notificaciones WhatsApp.
- BÃºsqueda full-text.
- Meilisearch/Typesense.

## No hacer en V1

- Pagos de servicios.
- ComisiÃ³n por cierre automÃ¡tica.
- Split payments.
- GarantÃ­a.
- Escrow.
- Chat realtime.

## Criterios de Ã©xito del MVP

Un micromercado se considera viable si logra:

```txt
10â€“20 proveedores activos
5â€“8 proveedores con reviews
25â€“60 leads/mes
40%+ leads contactados
20%+ leads cotizados
primeros proveedores dispuestos a pagar
```

## Micromercado inicial sugerido

Elegir un vertical donde haya servicios complementarios frecuentes y ticket razonable.

Ejemplo:

```txt
Ciudad: BogotÃ¡
Vertical: servicios grÃ¡ficos/empaques
Servicios:
- cajas personalizadas
- troqueles
- impresiÃ³n
- serigrafÃ­a
- etiquetas
- diseÃ±o de empaque
- fotografÃ­a de producto
- landing/ecommerce
```

## Regla de avance

No agregar otro vertical hasta que el primero tenga:
- oferta suficiente,
- trÃ¡fico medible,
- leads reales,
- al menos algunos cierres reportados,
- disposiciÃ³n de pago.

