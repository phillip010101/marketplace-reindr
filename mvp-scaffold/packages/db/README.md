# Database Migrations

This package contains:

- `schema.sql` and `seed.sql` for bootstrap environments.
- `migrations/*.sql` for ordered, incremental changes.

## Commands

From repository root:

```bash
pnpm db:migrate
pnpm db:migrate:check
```

From `mvp-scaffold`:

```bash
pnpm db:migrate
pnpm db:migrate:check
```

## Rules

- Never edit an already applied migration file.
- Create a new migration for every schema change.
- Include rollback notes in every migration file.
- Keep migrations additive whenever possible.
