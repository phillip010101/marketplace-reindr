---
id: DESALINEACIONES_23
title: Contrato de desalineaciones
type: governance
status: active
priority: high
version: 1.0.0
applies_to:
  - engineering
  - product
depends_on:
  - DOD_21
related: []
agent_read_policy: when_related
---
# 23 - Contrato de analisis de desalineaciones

## Objetivo

Detectar y resolver contradicciones entre producto, contratos y codigo antes de que se conviertan en deuda costosa.

## Definicion de desalineacion

Cualquier diferencia material entre:

- lo que se prometio (contratos),
- lo que se modela (DB/core),
- lo que se expone (API/UI),
- lo que se prueba (QA).

## Tipos de desalineacion

1. Producto/alcance:
- feature fuera de fase,
- objetivo de negocio no soportado por flujo.

2. Dominio/datos:
- entidad sin tabla o constraint,
- estado definido sin transicion valida,
- invariant de negocio no enforceado.

3. API/contrato:
- ruta inexistente,
- payload distinto,
- error shape inconsistente.

4. UI/SEO:
- rutas faltantes,
- paginas vacias,
- metadata/canonical ausente,
- fuga de datos privados.

5. Seguridad/compliance:
- permisos rotos,
- datos sensibles sin control,
- logs con secretos,
- auditoria incompleta.

6. Testing/operacion:
- criterio DoD sin test,
- seed insuficiente,
- falta de runbook para modulo critico.

## Severidad y SLA

- Critica:
  - rompe seguridad, datos, facturacion o flujo principal.
  - SLA: resolver antes de merge.

- Alta:
  - impacto funcional alto o riesgo comercial fuerte.
  - SLA: resolver en la fase actual.

- Media:
  - no bloquea salida inmediata, pero degrada calidad.
  - SLA: planificada maximo en 1 fase.

- Baja:
  - mejora incremental.
  - SLA: backlog priorizado.

## Ruta de analisis obligatoria (orden)

1. Contratos base:
- `00`, `01`, `02`, `03`, `04`, `06`, `17`, `21`.
2. Contratos operativos:
- `07`, `08`, `10`, `11`, `12`, `13`, `15`, `16`.
3. Implementacion real:
- `apps/web`, `apps/api`, `packages/core`, `packages/db`.
4. Verificacion:
- tests, scripts, seed, smoke manual.

## Matriz de trazabilidad minima

Campos requeridos:

- `contract_id`,
- `requirement_id`,
- `db_table_or_core_rule`,
- `api_endpoint`,
- `ui_route_or_component`,
- `test_case`,
- `owner`,
- `status`.

## Evidencia minima por cierre de desalineacion

- referencia a contrato corregido o confirmado,
- diff de codigo asociado,
- test agregado/actualizado,
- resultado de verificacion manual.

## Checklist por capa

### Dominio y DB

- estados definidos y transiciones validas,
- constraints para invariantes criticos,
- indices para queries de negocio,
- campos auditables en entidades sensibles.

### API

- validacion server-side,
- formato uniforme `ok/error`,
- authz por rol y ownership,
- no exponer datos privados fuera de contexto.

### UI/SEO

- rutas prometidas existen,
- contenido util por pagina indexable,
- canonical/sitemap coherentes,
- CTA principal funcional sin dependencias fragiles.

### Seguridad

- rate limit en endpoints publicos,
- sanitizacion entradas,
- secretos fuera de repo,
- logs sin PII sensible.

### QA

- unit tests para reglas core,
- integration tests para flujos API criticos,
- E2E minima para journey cliente/proveedor/admin,
- seed apto para demo funcional.

## Gate de release

No se permite release si hay:

- desalineacion critica abierta,
- desalineacion alta sin plan firmado,
- criterio DoD sin evidencia,
- riesgo de privacidad sin mitigacion implementada.
