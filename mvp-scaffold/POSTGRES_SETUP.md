# PostgreSQL Setup (No Docker) - Reindr Marketplace MVP

## 1) Contexto y objetivo

Este proyecto usa PostgreSQL como base de datos principal para:

- API de marketplace (`apps/api`)
- Esquema operativo del negocio (`packages/db/schema.sql`)
- Migraciones versionadas (`packages/db/migrations/*.sql`)
- Seed de desarrollo (`packages/db/seed.sql`)
- Opcional: Contract RAG con `pgvector` (`tools/contract-rag/migrations/001_init.sql`)

La fuente de verdad del dominio sigue siendo contratos + codigo.  
La base de datos persiste estados operativos (leads, oportunidades, reviews, etc).

## 2) Topologia recomendada (minimalista)

Para un VPS unico:

- `postgresql` y `apps/api` en el mismo VPS
- conexion interna por `localhost`
- sin Docker
- un solo rol/DB para desarrollo: `reindr` / `reindr_marketplace`

## 3) Instalacion PostgreSQL en Ubuntu (22.04/24.04)

> Si tu VPS no es Ubuntu, avisa y lo adapto a Debian/RHEL.

```bash
sudo apt update
sudo apt install -y postgresql postgresql-contrib
```

Validar servicio:

```bash
sudo systemctl enable postgresql
sudo systemctl start postgresql
sudo systemctl status postgresql --no-pager
```

## 4) Crear usuario y base de datos del proyecto

Entrar como usuario postgres:

```bash
sudo -u postgres psql
```

Ejecutar:

```sql
CREATE ROLE reindr WITH LOGIN PASSWORD 'reindr';
ALTER ROLE reindr CREATEDB;
CREATE DATABASE reindr_marketplace OWNER reindr;
\q
```

## 5) Configuracion de red y seguridad minima

Si API y DB corren en el mismo VPS, mantener solo localhost:

- `listen_addresses = 'localhost'` en `postgresql.conf`
- en `pg_hba.conf` usar solo reglas locales/127.0.0.1

Ejemplo seguro minimo (`pg_hba.conf`):

```txt
local   all             postgres                                peer
local   all             all                                     scram-sha-256
host    all             all             127.0.0.1/32            scram-sha-256
host    all             all             ::1/128                 scram-sha-256
```

Reiniciar:

```bash
sudo systemctl restart postgresql
```

## 6) Variables de entorno del proyecto

En `mvp-scaffold/.env`:

```env
DATABASE_URL=postgres://reindr:reindr@localhost:5432/reindr_marketplace
```

Referencia base: `mvp-scaffold/.env.example`.

## 7) Bootstrapping del esquema (orden correcto)

Importante: la migracion `0001_slice1_schema_baseline.sql` agrega indices y asume que las tablas base ya existen.

### Paso A - Crear tablas base

Desde la raiz del repo:

```bash
psql "postgres://reindr:reindr@localhost:5432/reindr_marketplace" -f mvp-scaffold/packages/db/schema.sql
```

### Paso B - Seed de desarrollo (opcional, recomendado)

```bash
psql "postgres://reindr:reindr@localhost:5432/reindr_marketplace" -f mvp-scaffold/packages/db/seed.sql
```

### Paso C - Migraciones versionadas del proyecto

```bash
cd mvp-scaffold
pnpm db:migrate
pnpm db:migrate:check
```

## 8) Contract RAG en PostgreSQL (opcional ahora, recomendado despues)

Si quieres Contract RAG persistente en DB (en vez de cache local), necesitas `pgvector`.

### 8.1 Instalar pgvector

Opcion A (si tu distro trae paquete):

```bash
sudo apt install -y postgresql-16-pgvector
```

Si falla por version/nombre de paquete, instala el paquete equivalente para tu version de PostgreSQL o compila desde fuente.

### 8.2 Crear extension y tablas de RAG

```bash
psql "postgres://reindr:reindr@localhost:5432/reindr_marketplace" -f tools/contract-rag/migrations/001_init.sql
```

### 8.3 Ejecutar RAG contra DB real

En `tools/contract-rag/.env` o variables del shell:

```env
DATABASE_URL=postgres://reindr:reindr@localhost:5432/reindr_marketplace
```

Y correr:

```bash
cd mvp-scaffold
pnpm contract-rag migrate
pnpm contract-rag index
pnpm contract-rag context "workspace preflight contract sync"
```

## 9) Todas las tablas del proyecto y su rol

## 9.1 Marketplace (schema principal)

- `accounts`: cuentas y rol (`client|provider|admin`)
- `providers`: perfil de proveedor y estado (`draft|pending_review|active|suspended`)
- `services`: catalogo de servicios
- `locations`: pais/region/ciudad/zona
- `provider_services`: oferta proveedor-servicio-ubicacion
- `service_relations`: servicios relacionados (cross-sell/complement)
- `leads`: solicitud base del cliente
- `lead_requested_services`: servicios pedidos por lead
- `lead_opportunities`: oportunidad asignada a proveedor
- `lead_events`: auditoria/eventos del lead y oportunidad
- `quotes`: cotizaciones de proveedor
- `reviews`: reputacion/moderacion (`pending|approved|rejected|flagged`)
- `wallet_transactions`: cargos/creditos/devoluciones
- `schema_migrations`: control de migraciones aplicadas

## 9.2 Contract RAG (si activas pgvector)

- `contract_documents`: metadatos de contratos indexados
- `contract_chunks`: fragmentos por seccion con embedding
- `contract_relations`: grafo explicito entre contratos
- `contract_context_queries`: bundles de contexto generados

## 10) Interacciones API -> tablas (mapa operativo)

- `POST /api/leads`
  - escribe: `leads`, `lead_requested_services`, `lead_opportunities`, `lead_events`
  - lee: `locations`, `services`, `provider_services`, `providers`
- `GET /api/provider/leads`
  - lee: `lead_opportunities`, `leads`, `services`, `providers`
- `GET /api/provider/leads/:opportunityId`
  - lee: `lead_opportunities`, `leads`, `services`, `locations`
- `POST /api/provider/leads/:opportunityId/status`
  - actualiza: `lead_opportunities.status`, `lead_opportunities.valid_for_billing`
  - escribe: `lead_events`
- `GET /api/services/:slug/related`
  - lee: `service_relations`, `services` (o fallback catalogo local sin DB)
- `GET /api/providers`, `GET /api/providers/:slug`
  - lee: `providers`, `provider_services`, `services`, `locations`, `reviews` (solo aprobadas)
- `POST /api/admin/reviews/:id/moderate`
  - actualiza: `reviews.status`
  - audita: `admin_events`
- `POST/PATCH /api/admin/services*`
  - lee/escribe: `services`
  - audita: `admin_events`

## 11) Validaciones rapidas post-instalacion

Comprobar conexion:

```bash
psql "postgres://reindr:reindr@localhost:5432/reindr_marketplace" -c "SELECT now();"
```

Listar tablas:

```bash
psql "postgres://reindr:reindr@localhost:5432/reindr_marketplace" -c "\dt"
```

Verificar extensiones:

```bash
psql "postgres://reindr:reindr@localhost:5432/reindr_marketplace" -c "\dx"
```

Check de migraciones del proyecto:

```bash
cd mvp-scaffold
pnpm db:migrate:check
```

Smoke gate completo:

```bash
pnpm run CI-typecheck-test-smoke
```

## 12) Backups minimos recomendados

Backup logico:

```bash
pg_dump "postgres://reindr:reindr@localhost:5432/reindr_marketplace" > reindr_marketplace_$(date +%F).sql
```

Restore:

```bash
psql "postgres://reindr:reindr@localhost:5432/reindr_marketplace" < reindr_marketplace_YYYY-MM-DD.sql
```

## 13) Problemas comunes

- `ECONNREFUSED`: servicio postgres no levantado o puerto bloqueado.
- `password authentication failed`: credenciales distintas a `DATABASE_URL`.
- `relation "providers" does not exist`: falto ejecutar `schema.sql` antes de `db:migrate`.
- `type "vector" does not exist`: falta instalar `pgvector` antes de migracion RAG.
- `db:migrate:check` en rojo: hay migraciones pendientes o checksum alterado.

---

Con este flujo puedes continuar desarrollo sin Docker y con una base estable para cerrar `MIG-BASE-01` cuando corras `pnpm db:migrate` + `pnpm db:migrate:check` en el VPS.
