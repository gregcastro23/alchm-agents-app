# Next Session Prompt — Onboarding & Activating Historical Agents in Planetary Agents

> **Run this prompt in the `planetary_agents-main` directory (`/Users/cookingwithcastro/Desktop/PA_legacy/planetary_agents-main`).**
> It provides complete context, architectural alignment, and actionable steps to ensure all ~70 historical agents are fully onboarded, synchronized with Pentacles SpacetimeDB, and functioning as active autonomous players in planetary-agents.

---

## 0. Orientation & Context

- **Pentacles Backend**: SpacetimeDB module `cookingwithcastrollc` (and testnet `pentacles2xtest`).
- **Seeding Verification**: All 71 historical agent charts (Newton, Einstein, Socrates, Da Vinci, Joan of Arc, Buddha, Hypatia, Confucius, etc.) have been computed and seeded into SpacetimeDB (`agent_chart` & `player` tables) under deterministic identities: `Identity::from_claims("pentacles:agent", &agent_key)`.
- **Pentacles Seams**:
  - `feeder/historical-agent-service.ts` evaluates ephemeris transits of historical agents' natal placements and calls `trigger_zone_flux`.
  - `server/src/reducers.rs` counts historical agent decks & dignities in planetary Faction War.
  - `agent_letters` seam accepts model-driven move queries for historical & planetary agents.
- **Target Repository**: `planetary_agents-main` (`/Users/cookingwithcastro/Desktop/PA_legacy/planetary_agents-main`).

---

## 1. Objectives

1. **Roster Synchronization**: Verify that all 71 historical agents in Pentacles (`scripts/agents-data.ts`) are registered in `lib/agents/historical/index.ts` and synced with Prisma `Agent` records.
2. **Word Duel & Lettered Arena Activation**:
   - Wire historical agents into `POST /api/agents/word-duel` so they can answer challenges from human players in Pentacles.
   - Activate historical agents in _The Lettered Arena_ (inter-agent Scrabble League, `lib/agents/duel/`), allowing agents to pair, play, and accumulate ELO/standings.
3. **Feed Activation & Persona Voicing**:
   - Ensure historical agents generate persona-voiced posts (via `generateVoicedText` on Groq Llama-70B/8B) when triggering Zone Flux or winning key Word Duels.
   - Broadcast historical agent activity into `/api/feed` with metadata payloads (`playedWord`, `zoneFluxId`, `opponentName`, `rationale`).
4. **Zero-Cost & Fail-Safe Execution**:
   - Keep in-character moves deterministic or LLM-cached on free-tier Groq (`generateVoicedText`).
   - Graceful fallback to top candidate from `rack-solver.ts` if model latency exceeds 2.5s.

---

## 2. Technical Architecture & File Seams

| Layer                    | Responsibility                                | Primary Seam in `planetary_agents-main`                                           |
| ------------------------ | --------------------------------------------- | --------------------------------------------------------------------------------- |
| **Roster Sync**          | 71 historical agents with Sacred-7 stats      | `lib/agents/historical/index.ts`, `prisma/schema.prisma`                          |
| **Word Duel Brain**      | Model-driven or Sacred-7 weighted word picker | `lib/agents/duel/agent-word-strategy.ts`, `app/api/agents/word-duel/route.ts`     |
| **Zone Flux Commentary** | Voicing ephemeris transits & sky flux events  | `lib/agents/feed-activation-engine.ts`, `lib/agents/persona/voiced-generation.ts` |
| **Scrabble League**      | Historical agent vs agent match loop          | `app/api/cron/scrabble/tick/route.ts`, `lib/agents/scrabble-league.ts`            |

---

## 3. Step-by-Step Implementation Instructions

### Step 1: Historical Agents Roster Verification

Check `lib/agents/historical/index.ts` against Pentacles' `scripts/agents-data.ts`. Ensure all 71 keys (including `isaac-newton`, `albert-einstein`, `socrates`, `leonardo-da-vinci`, `joan-of-arc`, `siddhartha-gautama-buddha`, `cleopatra`, `confucius`, `lao-tzu`, `hypatia`, etc.) exist with valid birth coordinates and Sacred planetary dimension weights derived via `deriveSacredStats`.

### Step 2: Word Duel & Agent Strategy Integration

1. In `lib/agents/duel/agent-word-strategy.ts`:
   - Map each historical agent's Sacred-7 dimensions (`martialImpetus`, `mercurialVelocity`, `jovianExpansion`, etc.) to planetary candidate weighting.
   - Allow historical agents to evaluate tile racks and select moves that match their philosophical style (e.g. Newton favors structured/scientific terms, Dickinson favors poetic/terse words).
2. In `app/api/agents/word-duel/route.ts`:
   - Support `agent_key` lookups for both planetary agents (`Sun`, `Moon`, `Mars`, etc.) and historical agents (`isaac-newton`, `albert-einstein`, etc.).
   - Return `{ success, agentKey, move: { word, score, rationale }, timestamp }`.

### Step 3: Zone Flux & Feed Action Events

1. In `lib/agents/feed-activation-engine.ts`:
   - Register `'historical_zone_flux'` and `'agent_word_duel'` in `WTENEventType`.
   - Add payload formatter for historical agent zone flux alerts when `historical-agent-service.ts` triggers flux in SpacetimeDB.
2. In `lib/agents/persona/voiced-generation.ts`:
   - Verify `generateVoicedText` uses Groq Llama-70B with fallbacks, generating short 1-line in-character commentary.

### Step 4: Autonomous Cron Loop & Verification

1. Verify cron job in `app/api/cron/agents/tick/route.ts` executes periodic sweeps for active historical agents.
2. Run test suite: `bun test test/word-duel.test.ts` or `npm run test`.
3. Test API endpoint locally:
   ```bash
   curl -X POST http://localhost:3000/api/agents/word-duel \
     -H "Content-Type: application/json" \
     -d '{"agentKey": "isaac-newton", "rack": "GRAVITY", "candidates": ["GRAVITY", "GRAV", "ART"]}'
   ```

---

## 4. Acceptance Criteria

- [ ] All 71 historical agents are active in `planetary_agents-main` and mapped to their Pentacles `agent_key`.
- [ ] `POST /api/agents/word-duel` returns in-character moves for historical agents within 2.5 seconds.
- [ ] Historical agent zone flux events and duel outcomes fan out cleanly to the live feed (`/api/feed`).
- [ ] All move generation runs fail-safe (Groq free tier with fallback to deterministic ranking).
