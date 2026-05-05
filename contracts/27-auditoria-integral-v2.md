---
id: AUDITORIA_V2_27
title: Auditoria integral v2
type: governance
status: active
priority: high
version: 1.0.0
applies_to:
  - engineering
  - product
  - architecture
depends_on:
  - PLAN_ALTAS_26
related: []
agent_read_policy: when_related
---
# 27 - Auditoria integral V2

Fecha de corte: 2026-04-28

## Objetivo

Revisar nuevamente contratos, artefactos de gobernanza y scaffold real para detectar:

- desalineaciones nuevas o no documentadas,
- errores en los propios artefactos de control,
- mejoras necesarias antes de iniciar desarrollo de features.

## Metodo usado

Cruce entre:

- contratos base `00`-`17`,
- contratos de control `18`, `20`, `21`, `23`, `24`, `25`, `26`,
- scaffold real en `mvp-scaffold/apps`, `packages`, `.env.example`, `README`.

## Resumen ejecutivo

- Criticas: 2
- Altas: 10
- Medias: 8
- Bajas: 5

Gate recomendado:

- no iniciar implementacion de features del MVP hasta cerrar las criticas,
- no cerrar Fase `-1` hasta convertir al menos 7 de las altas en decisiones o cambios concretos.

## Hallazgos criticos

### C1 - El flujo central de lead compuesto esta roto a nivel de contrato, UI y API

Evidencia:

- `contracts/06-api-contract.md` define `requested_service_slugs`.
- `mvp-scaffold/apps/web/src/pages/[city]/[service].astro` envia `related_services`.
- `mvp-scaffold/apps/api/src/routes/leads.ts` no parsea ningun arreglo de servicios solicitados.
- `mvp-scaffold/packages/core/src/lead-routing.ts` asume una lista `requestedServiceSlugs` para matching.

Impacto:

- el MVP promete solicitudes multi-servicio, pero hoy el contrato no coincide con el formulario ni con la API,
- no existe forma consistente de crear oportunidades compuestas.

Resolucion recomendada:

- estandarizar un solo nombre de payload: `requested_service_slugs`,
- hacer que web, API, core, seed y tests usen la misma taxonomia,
- definir slugs canonicos de servicios relacionados en contrato y seed.

### C2 - El modelo de identidad del proveedor no soporta el panel prometido

Evidencia:

- `providers.account_id` es nullable en `mvp-scaffold/packages/db/schema.sql`,
- el seed crea cuentas provider en `accounts`, pero los `providers` no quedan vinculados a esas cuentas,
- `contracts/11-provider-panel-contract.md` y `contracts/15-security-compliance-contract.md` requieren ownership y permisos por proveedor.

Impacto:

- no hay base consistente para authz del panel,
- no se puede garantizar que un proveedor vea solo sus oportunidades.

Resolucion recomendada:

- fijar estrategia de identidad ahora,
- decidir si `provider` nace siempre asociado a `account`,
- definir constraint, seed y reglas de onboarding acordes.

## Hallazgos altos

### H1 - Desalineacion de prefijos y topologia de API privada

Evidencia:

- contrato usa `/api/provider/*`,
- codigo expone `/api/providers`.

Impacto:

- rompe trazabilidad, prompts, tests futuros y contrato de panel.

### H2 - No existe perfil publico de proveedor end-to-end

Evidencia:

- producto, scope y SEO requieren `/proveedores/[provider-slug]`,
- no existe ruta Astro,
- tampoco existe endpoint/API publica clara para detalle de proveedor.

Impacto:

- falta una ruta esencial del directorio publico.

### H3 - `POST /api/leads` no persiste ni audita

Evidencia:

- el handler responde `ok` pero no inserta en `leads`, `lead_requested_services`, `lead_opportunities`, `lead_events`.

Impacto:

- el sistema aparenta aceptar solicitudes sin crear negocio real ni trazabilidad.

### H4 - Los artefactos de control ya tienen inconsistencias propias

Evidencia:

- `contracts/24-matriz-trazabilidad-fase-1.md` incluye `GET /api/providers/:slug`, pero ni el contrato API lo define ni el codigo lo implementa,
- `README.md` recomienda un orden de lectura que omite contratos operativos importantes como `05`, `07`, `10`, `15`, `16`.

Impacto:

- el equipo puede usar como canon documentos que ya arrancan desalineados.

### H5 - Falta una state machine ejecutable para estados de lead y oportunidad

Evidencia:

- `contracts/04-domain-model-contract.md` define transiciones validas,
- `packages/core` no tiene modulo para validarlas.

Impacto:

- el panel proveedor y admin puede terminar aceptando cambios invalidos.

### H6 - Seed insuficiente y parcialmente incompatible con QA y auth

Evidencia:

- `contracts/17-testing-qa-contract.md` pide 5 proveedores, 3 reviews aprobadas y 2 leads demo,
- el seed tiene 3 proveedores, 1 review y 0 leads,
- ademas los providers no tienen `account_id`.

Impacto:

- el entorno demo no prueba journeys reales ni permisos.

### H7 - Baseline de calidad ausente

Evidencia:

- no hay `tsconfig`,
- no hay `lint`,
- `test` en API y core son placeholders,
- no hay CI declarada en repo.

Impacto:

- no existe control tecnico minimo para sostener iteracion rapida.

### H8 - La frontera publico/privado no esta modelada tecnicamente

Evidencia:

- contratos separan datos publicos y privados,
- el scaffold no tiene DTOs, serializers ni politicas de redaccion por rol.

Impacto:

- alto riesgo de fuga de PII al crecer endpoints y paginas.

### H9 - La capa publica SEO incumple requisitos estructurales

Evidencia:

- faltan rutas publicas,
- `[city]/[service]` no muestra proveedores reales, FAQs, breadcrumbs ni enlaces internos suficientes,
- `astro.config.mjs` mantiene `site: 'https://example.com'`.

Impacto:

- paginas indexables debiles o no publicables segun el propio contrato SEO.

### H10 - El schema permite duplicidad de oportunidades y no modela duplicado de leads

Evidencia:

- `lead_opportunities` no tiene unique constraint como `(lead_id, provider_id, service_id)`,
- `contracts/08-leads-billing-rules.md` exige control de duplicados por ventana configurable,
- el schema no modela esa capa de negocio.

Impacto:

- riesgo de doble asignacion y doble cobro por la misma oportunidad.

## Hallazgos medios

### M1 - Los slugs del formulario no coinciden con los slugs canonicos del seed

Ejemplos:

- `Troquel` vs `troqueles`,
- `Landing o ecommerce` produce `landing-o-ecommerce`, pero en seed existen `landing-page` y `ecommerce`.

### M2 - El formulario usa URL absoluta local y no usa `PUBLIC_API_BASE_URL`

Impacto:

- rompe portabilidad entre entornos y despliegues.

### M3 - No existe pagina de confirmacion del lead

Impacto:

- el flujo UX del contrato queda incompleto,
- hoy el usuario terminaria viendo la respuesta cruda del endpoint.

### M4 - `getStaticPaths()` cubre menos servicios que el home y el seed

Impacto:

- inventario publico inconsistente y parcial.

### M5 - No existe endpoint `GET /api/services/:slug/related`

Impacto:

- la UI no puede consumir reglas reales de relacionados desde API.

### M6 - No existe `GET /api/search`

Impacto:

- el home tiene busqueda visual pero no existe capa de busqueda real del contrato.

### M7 - Observabilidad y analytics estan solo en documento

Impacto:

- no hay request logging minimo, eventos ni medicion de conversion.

### M8 - El repo tiene problemas de codificacion de texto

Evidencia:

- multiples archivos muestran mojibake en consola (`Ã¢â‚¬â€`, `ÃƒÂ¡`, `Ã‚Â¿`).

Impacto:

- riesgo de copy roto en UI, docs y seeds.

## Hallazgos bajos

### L1 - Dependencias fijadas en `latest`

### L2 - `packages/ui` existe pero no tiene rol definido todavia

### L3 - `mvp-scaffold/README.md` sigue un flujo anterior y no refleja Fase `-1`

### L4 - No hay politica explicita de migraciones, aunque el roadmap la menciona

### L5 - `updated_at` existe en varias tablas sin mecanismo comun de actualizacion

## Mejoras recomendadas antes de codificar features

### 1. Congelar taxonomias canonicas

Definir en un solo punto:

- nombres de payload (`requested_service_slugs`),
- slugs de servicios,
- nombres de rutas API,
- nombres de estados.

### 2. Crear contratos faltantes de gobierno tecnico

Conviene agregar:

- contrato de auth y RBAC,
- contrato de state machine,
- contrato de DTO publico/privado,
- contrato de migraciones y versionado de schema,
- contrato de contenido/publicacion SEO.

### 3. Alinear datos seed con journeys reales

El seed debe soportar:

- cliente -> lead -> oportunidades,
- provider account -> provider -> panel,
- admin -> moderacion review,
- proveedor publico con reviews reales.

### 4. Reducir acoplamiento de UI a mocks

La UI publica debe consumir datos canonicos o fixtures estructurados, no strings ad hoc en cada pagina.

### 5. Convertir Fase `-1` en checklist ejecutable por PR

Cada PR deberia responder:

- contrato afectado,
- endpoint afectado,
- tabla/regla afectada,
- test agregado,
- riesgo de privacidad,
- cambio de seed o fixture.

## Secuencia recomendada para cerrar la auditoria

1. Resolver C1: payload y taxonomia de lead compuesto.
2. Resolver C2: identidad y ownership de proveedor.
3. Corregir H4: artefactos de control desalineados.
4. Resolver H7: baseline TS, tests y lint.
5. Resolver H10: invariantes de schema para oportunidades/duplicados.
6. Resolver H6: seed QA y auth-ready.
7. Resolver H1/H3/H8 como paquete API base.
8. Resolver H2/H9/M3/M4/M5/M6 como paquete publico SEO.

## Criterio de salida recomendado

No pasar a implementacion de features hasta que:

- C1 y C2 esten cerradas,
- exista baseline de calidad ejecutable,
- seed soporte auth + lead compuesto + demo local,
- matriz y reportes de control reflejen el estado real del repo.

