# Reindr Marketplace MVP - Paquete de contratos y scaffold inicial

Fecha: 2026-04-28  
Objetivo: construir un marketplace/directorio local de servicios con perfiles, SEO geolocalizado, leads compuestos, reviews, monetizacion por lead y base futura para pagos/garantias.

## Principio central

No construir desde el dia 1 un marketplace transaccional completo.  
Construir primero red de proveedores + solicitudes multi-servicio + tracking de leads.

Frase guia: primero conectamos servicios; despues coordinamos proyectos; al final movemos dinero.

## Carpetas

```txt
contracts/
  Contratos funcionales, tecnicos, de negocio, QA y gobernanza.

mvp-scaffold/
  Estructura inicial sugerida para monorepo con Astro + Hono + Postgres.
```

## Stack recomendado para MVP

```txt
Astro        Sitio publico, SEO, perfiles, paginas locales y contenido.
Hono         API, auth, panel, leads, cotizaciones, reviews y reglas dinamicas.
Postgres     Datos relacionales, busqueda basica, reporting y relaciones.
Drizzle      Opcional para ORM/migraciones si el equipo quiere TypeScript E2E.
Meilisearch  No en V1. Evaluar en V1.5 si busqueda/filtros crecen.
MercadoPago  No en V1. Preparar integracion futura marketplace/split.
```

## No objetivos V1

- No pagos internos de servicios.
- No escrow.
- No garantia automatica.
- No workflows complejos entre proveedores.
- No builder visual.
- No app movil.
- No chat interno complejo.

## Objetivo V1

Lanzar directorio SEO con:

- proveedores,
- servicios,
- ciudades/zonas,
- perfiles publicos,
- reviews moderadas,
- leads validos,
- leads compuestos,
- servicios relacionados,
- panel basico proveedor,
- panel admin minimo,
- reglas de cobro por lead,
- base para medir cierre.

## Orden recomendado de lectura (antes de desarrollar)

1. `contracts/00-contexto-proyecto.md`
2. `contracts/01-product-contract.md`
3. `contracts/02-mvp-scope.md`
4. `contracts/03-architecture-contract.md`
5. `contracts/04-domain-model-contract.md`
6. `contracts/06-api-contract.md`
7. `contracts/18-phases-roadmap.md`
8. `contracts/23-desalineaciones-contract.md`
9. `contracts/24-matriz-trazabilidad-fase-1.md`
10. `contracts/25-reporte-desalineaciones-fase-1.md`
11. `contracts/26-plan-resolucion-altas.md`
12. `contracts/27-auditoria-integral-v2.md`
13. `contracts/33-analisis-siguiente-paso-v3.md`
14. `contracts/34-plan-cierre-pre-desarrollo.md`
15. `contracts/35-sprint1-readiness-checklist.md`
16. `contracts/36-sprint1-slice-declaration.md`
17. `contracts/37-sprint1-slice-tecnico-plan.md`
18. `contracts/38-slice1-pr-breakdown-b1-b2.md`
19. `contracts/39-ruta-desarrollo-operativa-maestra.md`
20. `contracts/40-slice1-handoff-sin-db.md`
21. `contracts/21-definition-of-done.md`
22. `contracts/20-codex-task-prompts.md`

## Regla de ejecucion

- Iniciar siempre por Fase -1 (alineacion contractual).
- No avanzar de fase si falla algun gate de `contracts/21-definition-of-done.md`.
- No hacer features fuera de fase salvo correcciones de seguridad/privacidad.

## Contract RAG OS

CLI disponible en `tools/contract-rag`.

Desde la raiz del repo:

```bash
pnpm contract-rag:ensure
pnpm contract-rag validate
pnpm contract-rag index
pnpm contract-rag context "analizar siguiente paso" --pack next-step-execution
```

Tambien puedes ejecutarlo desde `mvp-scaffold`:

```bash
pnpm contract-rag:ensure
pnpm contract-rag init
pnpm contract-rag validate
pnpm contract-rag migrate
pnpm contract-rag index
pnpm contract-rag search "lead to order conversion"
pnpm contract-rag context "implement lead to order conversion"
```

`contract-rag:ensure` se ejecuta automaticamente en `postinstall`, `predev`, `pretypecheck` y `pretest`.

Modo por defecto: `full` (init + validate + index + context preflight).

Si necesitas rapidez temporal (solo scaffold), configura en `mvp-scaffold/.env`:

```bash
CONTRACT_RAG_ENSURE_MODE=baseline
```

Documentacion completa:

- `tools/contract-rag/README.md`
