---
id: UIUX_10
title: UI UX contract
type: ux
status: active
priority: medium
version: 1.0.0
applies_to:
  - frontend
  - product
depends_on: []
related: []
agent_read_policy: when_related
---
# 10 â€” UI/UX Contract

## Estilo

Minimalista, rÃ¡pido, claro y orientado a conversiÃ³n.

## Principios

- Mobile-first.
- Pocas pantallas.
- Formularios cortos.
- Progresive disclosure.
- No sobrecargar al cliente con conceptos internos.
- No mostrar "marketplace complejo"; mostrar "solicitar cotizaciÃ³n".

## Flujo cliente

### PÃ¡gina ciudad+servicio

Debe mostrar:

- H1 claro.
- Lista de proveedores.
- Filtros simples.
- CTA: Solicitar cotizaciÃ³n.
- Servicios relacionados.
- Reviews.
- FAQ.
- Contenido Ãºtil.

### Formulario de lead

Paso 1:
- servicio principal,
- ciudad,
- descripciÃ³n.

Paso 2:
- servicios relacionados sugeridos.

Paso 3:
- contacto,
- urgencia,
- presupuesto opcional,
- consentimiento.

### ConfirmaciÃ³n

Mostrar:

- nÃºmero de solicitud,
- quÃ© servicios fueron solicitados,
- tiempo estimado de respuesta,
- prÃ³ximos pasos.

## Flujo proveedor

### Dashboard

Mostrar:

- leads nuevos,
- leads vistos,
- cotizaciones pendientes,
- cierres reportados,
- saldo futuro,
- recomendaciones para mejorar perfil.

### Detalle lead

Mostrar:

- servicio,
- ciudad,
- descripciÃ³n,
- contacto,
- servicios relacionados,
- estado,
- botÃ³n cotizar,
- botÃ³n marcar contactado,
- botÃ³n rechazar.

## Flujo admin

Panel simple:

- leads recientes,
- proveedores pendientes,
- reviews pendientes,
- relaciones de servicios,
- mÃ©tricas.

## Componentes clave

- SearchBox.
- ServiceCard.
- ProviderCard.
- RelatedServicesSelector.
- LeadForm.
- LeadStatusBadge.
- QuoteCard.
- ReviewCard.
- AdminModerationTable.

## Copy base

CTA principal:

```txt
Solicitar cotizaciÃ³n
```

CTA secundario:

```txt
Ver proveedores
```

Servicios relacionados:

```txt
Este proyecto tambiÃ©n puede necesitar:
```

Proveedor:

```txt
Recibe oportunidades calificadas para tus servicios.
```

