# Contract RAG OS (Hybrid RAG for Development Contracts)

Contract RAG OS is a CLI-first hybrid context system for agentic development contracts.

The source of truth is always the markdown/yaml contracts in `/contracts`.

The design is MCP-ready (modular and deterministic), but MCP transport/server is intentionally not implemented yet.

The PostgreSQL/vector index is derived data:
- reproducible from contracts,
- used for fast retrieval,
- never authoritative over contracts.

If generated context contradicts contract files, contract files win.

## Why this exists

Future agents need compact, task-specific context without loading all contracts every time.

This tool helps agents answer:
- which contracts are relevant for a task,
- what dependencies and graph relations matter,
- which non-negotiable rules are active,
- what active decisions must be respected.

## How indexing works

`contract-rag index`:
1. reads `/contracts/**/*.md`,
2. parses frontmatter,
3. chunks by markdown headings,
4. computes stable hashes,
5. upserts documents and chunks in PostgreSQL,
6. re-embeds only changed chunks,
7. refreshes `contracts.index.yml`,
8. syncs relations graph metadata into DB.

Unchanged chunks are not re-embedded.

If `DATABASE_URL` is not set, index runs in local-cache mode and writes:

- `.context/generated/contract-rag-cache.json`

This keeps search/context available without PostgreSQL.

## How retrieval works (hybrid)

`search` and `context` use:
1. metadata matches (id/title/path),
2. keyword matches,
3. vector similarity,
4. graph relation expansion,
5. context pack boosts.

Scores are explicit (`vectorScore`, `keywordScore`, `metadataBoost`, `relationBoost`, `priorityBoost`, `statusBoost`).

## Commands

From `mvp-scaffold`:

```bash
pnpm contract-rag:ensure
pnpm contract-rag init
pnpm contract-rag validate
pnpm contract-rag migrate
pnpm contract-rag index
pnpm contract-rag search "lead to order conversion"
pnpm contract-rag graph LEADS_CONTRACT
pnpm contract-rag context "implement lead to order conversion"
```

Local mode (no DB):

```bash
pnpm contract-rag index
pnpm contract-rag search "lead to order conversion"
pnpm contract-rag context "implement lead to order conversion"
```

Useful flags:

```bash
pnpm contract-rag context "task text" --budget 8000 --pack lead-development --module leads --json
pnpm contract-rag init --force
```

## Always-ready mode (recommended)

`mvp-scaffold/package.json` includes lifecycle hooks so Contract RAG stays preflighted:

- `postinstall` -> runs `contract-rag:ensure`
- `predev` -> runs `contract-rag:ensure`
- `pretypecheck` -> runs `contract-rag:ensure`
- `pretest` -> runs `contract-rag:ensure`

`contract-rag:ensure` runs:

1. `init`
2. `validate`
3. `index`
4. `context "<ensure task>"`

Default ensure task:

- `workspace preflight contract sync`

Environment overrides in `mvp-scaffold/.env`:

- `CONTRACT_RAG_ENSURE_MODE=full|baseline`
- `CONTRACT_RAG_ENSURE_TASK=...`
- `CONTRACT_RAG_ENSURE_PACK=...`
- `CONTRACT_RAG_ENSURE_MODULE=...`

Use `baseline` mode when you only want fast scaffolding (`init`) and will run `index/context` manually later.

## Postgres + pgvector

Set `DATABASE_URL` and run:

```bash
pnpm contract-rag migrate
```

Migration creates:
- `contract_documents`
- `contract_chunks`
- `contract_relations`
- `contract_context_queries`
- `contract_rag_migrations`

And enables:
- `CREATE EXTENSION IF NOT EXISTS vector;`

## Embeddings behavior

Provider interface is replaceable.

Default:
- OpenAI embeddings if `OPENAI_API_KEY` exists.

Fallback:
- local hash embedding (dev mode) if API key is missing.

So these commands still work without API key:
- `init`
- `validate`
- `index`
- `search`
- `context`

## Environment variables

See `tools/contract-rag/.env.example`.

Key vars:
- `DATABASE_URL`
- `OPENAI_API_KEY`
- `CONTRACT_RAG_EMBEDDING_MODEL`
- `CONTRACT_RAG_CONTEXT_BUDGET`
- `CONTRACT_RAG_MAX_CHUNKS`
- `CONTRACT_RAG_GRAPH_DEPTH`

## Add a new contract

1. Create a markdown file under `/contracts` with YAML frontmatter.
2. Include at minimum:
   - `id`, `title`, `type`
3. Add `depends_on`/`related` when applicable.
4. Run:
   - `pnpm contract-rag index`
   - `pnpm contract-rag validate`

## Create a context pack

Edit `contracts/_registry/context-packs.yml`:
- define `required_contracts`,
- define optional and critical rules.

Then run:

```bash
pnpm contract-rag context "task" --pack your-pack-id
```

## Agent usage protocol

Before coding, the agent should:
1. generate/read `.context/generated/current-context.md`,
2. list contracts consulted,
3. list contracts affected,
4. list migrations needed,
5. list tests expected.

This keeps implementation aligned with contracts and avoids agentic drift.
