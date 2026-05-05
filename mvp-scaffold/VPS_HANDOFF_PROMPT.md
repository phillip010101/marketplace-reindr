# VPS Handoff Prompt (No Docker, PostgreSQL Localhost)

Usa este prompt tal cual en tu agente dentro del VPS.

## 1) Prompt para pegar en el VPS

```txt
Actua como SRE/DevOps + backend release engineer para este proyecto.

Objetivo:
- Conectar este proyecto con PostgreSQL local ya endurecido en este VPS.
- NO usar Docker.
- Dejar app y DB listas para continuar desarrollo.
- Validar con gates reproducibles y reportar estado final GO/NO-GO.

Contexto importante:
- PostgreSQL ya fue endurecido a localhost (127.0.0.1 / ::1).
- Ya existen rol y base: reindr_mvp / reindr_marketplace.
- Existe archivo de credenciales generado por scripts previos: /home/matias/reindr-postgres-sudo/reindr_db_credentials.env
- El repo completo (incluyendo contracts y tools/contract-rag) estara en:
  /home/matias/reindr-marketplace-mvp
- El workspace app esta en:
  /home/matias/reindr-marketplace-mvp/mvp-scaffold

Tareas exactas (en orden):
1) Verifica prerequisitos del host:
   - node -v
   - pnpm -v
   - psql --version
2) Entra al workspace:
   - cd /home/matias/reindr-marketplace-mvp/mvp-scaffold
3) Crea/ajusta .env (sin imprimir secretos):
   - Si no existe .env, copiar .env.example
   - Cargar credenciales desde /home/matias/reindr-postgres-sudo/reindr_db_credentials.env
   - Construir DATABASE_URL con host localhost y puerto 5432
   - Escribir DATABASE_URL en .env
4) Instala dependencias:
   - pnpm install
5) Bootstrapping DB base (si tablas no existen):
   - Ejecutar schema.sql y opcionalmente seed.sql contra reindr_marketplace
6) Ejecuta migraciones versionadas:
   - pnpm db:migrate
   - pnpm db:migrate:check
7) Validaciones de proyecto:
   - pnpm contract-rag validate
   - pnpm run CI-typecheck-test-smoke
8) Verificaciones SQL:
   - SELECT now();
   - SELECT count(*) FROM schema_migrations;
   - \dt
9) Reporte final:
   - Estado GO/NO-GO
   - Versiones detectadas (Node/pnpm/Postgres)
   - Resultado de cada comando (ok/fail)
   - Si hay fallo, causa raiz + comando exacto de correccion

Reglas:
- No Docker.
- No exponer password en logs/salida.
- No modificar migraciones ya existentes.
- Si falta algo, proponer fix minimo y ejecutarlo.
```

## 2) Checklist previo desde local (antes de subir)

Desde `mvp-scaffold`:

```bash
pnpm install
pnpm contract-rag validate
pnpm run CI-typecheck-test-smoke
pnpm db:migrate
pnpm db:migrate:check
```

Si eso falla, no subas al VPS todavia.

## 3) Qué debes compartir al agente del VPS

- Ruta repo en VPS: `/home/matias/reindr-marketplace-mvp`
- Ruta app: `/home/matias/reindr-marketplace-mvp/mvp-scaffold`
- Ruta credenciales DB: `/home/matias/reindr-postgres-sudo/reindr_db_credentials.env`
- Confirmacion: “sin Docker, todo por localhost”.

## 4) Criterio de exito minimo

Considera “listo para continuar desarrollo” solo si:

- `pnpm db:migrate:check` pasa
- `pnpm run CI-typecheck-test-smoke` pasa
- `contract-rag validate` pasa
- Conexion SQL a `reindr_marketplace` OK

