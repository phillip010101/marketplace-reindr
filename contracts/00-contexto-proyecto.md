---
id: CONTEXT_00
title: Contexto del proyecto
type: product
status: active
priority: high
version: 1.0.0
applies_to:
  - product
  - architecture
depends_on: []
related: []
agent_read_policy: when_related
---
# 00 â€” Contexto del proyecto

## Nombre interno

Reindr Marketplace / Red de servicios conectados.

## Problema

Muchas empresas o personas necesitan un servicio principal, pero ese servicio suele requerir varios servicios complementarios.  
Ejemplo en industria grÃ¡fica:

- diseÃ±o de empaque,
- cajas personalizadas,
- troquel,
- corte,
- impresiÃ³n,
- screen / serigrafÃ­a,
- etiquetas,
- fotografÃ­a de producto,
- landing o ecommerce.

El cliente no siempre sabe cÃ³mo pedir todo ni a quiÃ©n contactar.  
Los proveedores, por su parte, necesitan leads calificados y visibilidad local.

## Oportunidad

Crear una red donde los proveedores tengan perfiles indexables y los clientes puedan generar solicitudes multi-servicio.  
El sistema debe convertir una necesidad principal en varias oportunidades conectadas.

## Diferencia frente a un directorio tradicional

No es solo "lista de proveedores".

Es:

```txt
directorio SEO
+ perfiles locales
+ reviews
+ leads
+ servicios relacionados
+ solicitudes compuestas
+ tracking de cierre
+ monetizaciÃ³n por lead
+ base futura para pagos y garantÃ­a
```

## Principio de simplicidad

El MVP no debe coordinar producciÃ³n, pagos, entregas o disputas complejas.

El MVP solo debe:

1. Capturar demanda.
2. Identificar servicios relacionados.
3. Crear oportunidades.
4. Enviar oportunidades a proveedores.
5. Permitir cotizaciÃ³n/respuesta.
6. Medir estado y cierre.
7. Cobrar por lead vÃ¡lido.

## Usuario cliente

Persona o empresa que busca un servicio.  
Debe poder:

- buscar por ciudad y servicio,
- ver proveedores,
- enviar solicitud,
- aÃ±adir servicios relacionados,
- recibir respuestas,
- dejar review si corresponde.

## Usuario proveedor

Empresa o independiente que ofrece servicios.  
Debe poder:

- crear perfil,
- elegir servicios,
- elegir zonas,
- recibir leads,
- responder/cotizar,
- marcar estado,
- cargar saldo futuro,
- ver mÃ©tricas bÃ¡sicas.

## Usuario admin

Operador de la plataforma.  
Debe poder:

- aprobar proveedores,
- moderar reviews,
- ver leads,
- reasignar leads,
- resolver disputas simples,
- ajustar precios por categorÃ­a,
- gestionar servicios relacionados,
- publicar contenido SEO.

## Modelo mental

No construir "orden multi-proveedor" en V1.  
Construir "solicitud multi-servicio".

```txt
Solicitud multi-servicio = fÃ¡cil
Orden multi-proveedor = compleja
```

