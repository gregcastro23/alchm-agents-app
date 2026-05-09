# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Frontend (Next.js)
```bash
yarn dev          # Start dev server (NODE_OPTIONS max-old-space-size=4096)
yarn build        # Production build
yarn lint         # ESLint across .js/.jsx/.ts/.tsx
yarn lint:fix     # ESLint with autofix
yarn format       # Prettier write
yarn typecheck    # tsc --noEmit (many existing errors; build ignores them)
yarn check        # lint + format:check + typecheck combined
```

### Testing
```bash
# Integration & unit tests (vitest, jsdom)
vitest run test/                        # All tests in test/
vitest run test/monica.spec.ts          # Single spec file
vitest run --config vitest.unit.config.ts  # Unit config (no storybook project)

# Chat system test aliases
yarn test:chat          # All chat-system tests
yarn test:chat:unit     # Unit only
yarn test:chat:integration  # Integration only

# Backend (Python)
cd backend && pytest                   # All backend tests
cd backend && ruff check .             # Lint
```

### Database & Data Sync
```bash
npx prisma studio                      # Prisma DB browser
npx prisma migrate dev                 # Run migrations locally
npx tsx scripts/seed-historical-agents.ts   # Seed agent data
yarn sync:all                          # Sync DB + ChromaDB
yarn sync:chromadb                     # Ingest agents into ChromaDB
yarn verify-db                         # Verify Prisma connection
```

### Backend (Python FastAPI)
```bash
cd backend && uvicorn main:app --reload --port 8000
cd backend && pip install -r requirements.txt
```

### Storybook
```bash
yarn storybook        # Dev on port 6006
yarn build-storybook  # Static build
```

## Architecture Overview

### Two-Layer Backend

The app has two distinct backends that must stay in sync:

1. **Next.js API routes** (`app/api/`) — the frontend's server layer. Most routes are thin proxies to the Railway backend, but some contain local logic (auth, Galileo logging, consciousness calculations). Chat and streaming endpoints live here.

2. **FastAPI Python backend** (`backend/`) — deployed on Railway at the URL in `NEXT_PUBLIC_BACKEND_URL`. Owns the canonical agent data, chat orchestration with RAG, and planetary position calculations. The `lib/backend.ts` client is the single point of contact from Next.js server code.

When touching agent data or chat logic, check both layers to understand which one is authoritative.

### Agent System

Three agent types are unified through `lib/unified-agent-types.ts` and `lib/unified-agent-factory.ts`:

- **Historical agents** — real historical figures stored in the `historical_agents` Prisma table and ChromaDB (RAG). Seeded via `scripts/seed-historical-agents.ts`.
- **Planetary agents** — synthetic agents tied to current planetary positions (Sun, Moon, Mercury, etc.). Configs in `lib/demo-agents.ts`.
- **Monica** — the onboarding/guide agent. Streaming endpoint at `app/api/monica-agent/stream/route.ts`; non-streaming at `app/api/monica-agent/route.ts`.

Conversations, evolution states, attachments, and consciousness snapshots all relate to `historical_agents.agentId` as the foreign key.

### Planetary Calculations

Planetary positions flow through a fallback hierarchy:
1. Railway backend API (`/api/planetary/rectify`)
2. `lib/enhanced-astronomical-calculator.ts` (VSOP87, ±0.1° accuracy)
3. Basic transit calculations
4. Static fallback positions

The central Next.js API endpoint is `app/api/planetary-positions/route.ts`. The React hook `hooks/useUnifiedPlanetaryPositions.ts` is the preferred frontend interface.

### Database

PostgreSQL via **Prisma Accelerate** (connection pooling). Schema at `prisma/schema.prisma`. Key tables: `historical_agents`, `created_agents`, `user_natal_charts`, `consciousness_snapshots`, `agent_consciousness`, `collaborative_time_sessions`.

There is also a legacy SQLite schema at `prisma/sqlite-schema.prisma` (dev only).

### AI Model Configuration

All model IDs are centralized in `lib/models/registry.ts`. Use `CLAUDE`, `OPENAI`, and `MODEL_TIERS` exports from there — **never hardcode model strings elsewhere**. The `anthropic-client.ts` wrapper supports an optional AI Gateway (`AI_GATEWAY_ENABLED=true`) that reroutes calls through a custom base URL.

```ts
import { CLAUDE, MODEL_TIERS, resolveClaudeModel } from '@/lib/models/registry'
```

Current default models (May 2026):
- Claude SONNET: `claude-3-5-sonnet-20241022`
- Claude HAIKU: `claude-3-5-haiku-20241022`
- OpenAI default: `gpt-4o-mini` (Monica)

### Observability (Galileo)

All AI interactions are logged through `lib/galileo-unified.ts` (`UnifiedGalileoService`). Configure with env vars `GALILEO_API_KEY`, `GALILEO_PROJECT`, `GALILEO_LOG_STREAM`. Set `GALILEO_FAIL_SILENTLY=true` to suppress errors when not configured.

### RAG (Retrieval-Augmented Generation)

Agent knowledge is stored in ChromaDB (optional, Docker: `docker run -p 8000:8000 chromadb/chroma`). Ingestion pipeline at `lib/llamaindex/ingestion-pipeline.ts`. The semantic search endpoint is `app/api/agents/semantic-search/route.ts`. RAG analytics are tracked in `RAGQuery`/`RAGSource`/`RAGFeedback` Prisma tables.

### Feature Flags (env vars)

| Variable | Effect |
|---|---|
| `NEXT_PUBLIC_KINETICS_BACKEND` | Use Railway for kinetics calculations (vs. local) |
| `NEXT_PUBLIC_PLANETARY_HOURS_BACKEND` | Use Railway for planetary hour calculations |
| `NEXT_PUBLIC_THERMODYNAMICS_BACKEND` | Use Railway for thermodynamics engine |
| `CROSS_BACKEND_SYNC_ENABLED` | Sync planetary positions across backends |
| `AI_GATEWAY_ENABLED` | Route Anthropic calls through an AI Gateway |

### TypeScript Errors

`next.config.mjs` sets `typescript: { ignoreBuildErrors: true }` — production builds succeed despite TS errors. The repo has a tracked linting campaign (`yarn linting-campaign:*` scripts) for gradual resolution. Do not let this become an excuse to introduce new type errors.

### Path Aliases

`@` resolves to the project root. Use `@/lib/...`, `@/components/...`, `@/app/...`, `@/hooks/...`.

### Husky / Pre-commit

Pre-commit runs `lint-staged` (ESLint + Prettier) on staged `.js/.jsx/.ts/.tsx` and `.json/.md` files.
