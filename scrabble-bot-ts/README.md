# The Bard 🖋️ — Bun/TypeScript live client (`scrabblebot`)

A **Bun-native TypeScript** bot for the SpacetimeDB
[ScrabbleBot](https://launchpad-scrabblebot.vercel.app/docs) challenge. It mirrors
the official `bot-starter/` structure (camelCase reducers, `BigInt` amounts,
lobby lifecycle) but is backed by the **full opponent-aware engine** ported
faithfully from the Rust bot in [`../scrabble-bot`](../scrabble-bot) — so it
inherits the same validated play (100% vs the starter bots in self-play).

> **Parity check:** `analyze RETINA S` returns the identical best word, equity
> (37.74), bingo hooks and marginal value (13.17) as the Rust engine. Same
> 172,820-word ENABLE lexicon, same Vickrey-truthful bidding, same persona
> weights derived from `lib/agents/historical/*.ts`.

## Why this exists alongside the Rust bot

The Rust bot is the raw-speed artifact; this is the **drop-in, hackable** one for
the official TypeScript toolchain. `src/strategy.ts` even exports
`decideBidSimple` / `chooseWordSimple` with the _exact_ signatures of the
starter's `strategy.ts`, so you can paste them straight into `bot-starter/` if you
prefer that scaffold.

## Quick start (offline — works right now, no install)

Bun runs the strategy with zero dependencies (only Node built-ins):

```bash
cd scrabble-bot-ts
bun run src/cli.ts info                       # lexicon + persona roster
bun run src/cli.ts analyze RETINA S           # best word, equity, bingo hooks, a bid
bun run src/cli.ts analyze AEELRTZ Z --persona voltaire
bun run src/cli.ts sim --matches 20           # self-play vs a faithful starter clone
bun run src/cli.ts bench --n 50000            # decide_bid latency
bun test                                       # unit tests
```

Self-play (15-match sample): **The Bard wins 100% vs 3 starter clones**
(110 vs 19 avg), ties Voltaire for #1 in the persona round-robin, and degrades
gracefully in a 6× mirror. Latency ≈ **0.5ms median / ~3.7ms max** — 4× under the
15ms target, ~270× under the real 1000ms auction window.

## Going live

```bash
cd scrabble-bot-ts
bun install                       # spacetimedb SDK + ws

# generate typed bindings from the module (one time / when schema changes)
bun run generate
#   = spacetime generate --lang typescript \
#       --out-dir src/module_bindings --module-path ../scrabblebot/spacetimedb

# get your team JWT from https://launchpad-scrabblebot.vercel.app/team, then:
BOT_NAME=alice BOT_TOKEN=<jwt> BARD_PERSONA=shakespeare bun start
```

The token is persisted to `.token-<BOT_NAME>` after the first run. The client
joins the rolling lobby, plays every match with the full engine, and re-joins the
lobby when each match ends.

### Linking your spacetimedb.com account (`connect_id`)

Bind your web identity to the team's bot credential **once**. The reliable path is
the CLI (this is the command you already have):

```bash
spacetime call scrabblebot connect_id '["0x<your-web-identity>"]'
```

Or let the bot do it on connect:

```bash
LINK_IDENTITY=0x<your-web-identity> bun start
```

(You can also link from the website's **/account → Link account** button.)

### Tournament mode

Per the docs' pre-tournament checklist, you don't want to be mid-match (or
aggressively rejoining the casual lobby) when a tournament starts. Run with:

```bash
TOURNAMENT_MODE=1 bun start      # connect + stay; skip auto lobby-join/rejoin
```

Then register from the [tournament page](https://launchpad-scrabblebot.vercel.app/tournament)
(or call `registerForTournament({ tournamentId })`). Tournament matches use the
same reducers and table events, so no code changes are needed to compete.

## Environment variables

| Variable          | Default                              | Purpose                                          |
| ----------------- | ------------------------------------ | ------------------------------------------------ |
| `BOT_TOKEN`       | — (falls back to `.token-<name>`)    | SpacetimeDB JWT from `/team`                      |
| `BOT_NAME`        | `bard`                               | token filename + log label                       |
| `BARD_PERSONA`    | `shakespeare`                        | `shakespeare\|cicero\|voltaire\|twain\|dante`    |
| `TOURNAMENT_MODE` | off                                  | `1` = don't auto-join/rejoin the casual lobby    |
| `LINK_IDENTITY`   | —                                    | web identity to bind via `connect_id` on connect |
| `STDB_HOST`       | `https://maincloud.spacetimedb.com`  | server URI                                        |
| `STDB_DB`         | `scrabblebot`                        | module name                                       |

## Layout

```
src/
  tiles.ts       letter values, bag, exact reward formula
  lexicon.ts     ENABLE flat-array trie + best-word & bingo-hook search
  strategy.ts    Counts, personas, Valuator, Vickrey bidding, opponent model + starter drop-ins
  game.ts        the Brain (event-driven state machine) + Player seam
  sim.ts         self-play arena + faithful starter clone
  cli.ts         offline tools (info / analyze / sim / bench)
  index.ts       live SpacetimeDB client (needs `bun run generate`; @ts-nocheck until then)
wordlist.txt     172,820 ENABLE words (the exact list the server validates)
```

`index.ts` is the only file that imports the generated `module_bindings`; it's
marked `@ts-nocheck` until you run `bun run generate`. Every decision it makes is
delegated to the typechecked, unit-tested `Brain` — so the strategy never depends
on the SDK.
