# The Bard 🖋️ — a Scrabble-auction bot for the SpacetimeDB `scrabblebot` challenge

A compiled, **sub-millisecond** bidding engine for the Clockwork Labs
[ScrabbleBot](https://github.com/clockworklabs/scrabblebot) hackathon challenge
([devspot #549](https://spacetimedb.devspot.app/challenges?challenge=549)).

The word-finder _is_ Shakespeare's documented **"Linguistic Mastery"** gift made
literal, and the bidding temperament is derived — field by field — from the
**grammatical-master agents** in this repo (`lib/agents/historical/*.ts`):
Shakespeare (flagship), Cicero, Voltaire, Twain, Dante.

> **Why a compiled bot and not an LLM?** The auction window is tight and the loop
> is fully automated — an LLM API round-trip (hundreds of ms to seconds) can't
> bid in time. So we used an LLM (Claude) to _design and write_ this bot, and the
> bot itself does pure local computation: **~270µs per bid, ~2ms worst case.**

---

## The game (verbatim from the module, not guessed)

| Rule                | Value                                                                                            |
| ------------------- | ----------------------------------------------------------------------------------------------- |
| Players             | up to 6 (lobby max), padded with simulated house bots                                            |
| Start balance       | **100** currency per match                                                                       |
| Starting rack       | **5** tiles                                                                                      |
| Bag                 | standard **98-tile** English set, **no blanks**                                                  |
| Auction             | **sealed-bid, 1000ms window**, reserve **1**, ties → earliest bid                                |
| Pricing             | **Vickrey** (winner pays the runner-up's bid) by default; FirstPrice configurable               |
| Word reward         | `base_score × length_multiplier`, integer math: `≤3 → 1×, 4 → 1.5×, 5 → 2×, 6 → 2.5×, ≥7 → 3×`   |
| Dictionary          | **ENABLE** (`172,820` words) — embedded verbatim from the module's `wordlist.txt`                |
| **Winner**          | **highest cumulative `score`** (sum of word rewards) — _not_ leftover balance                    |
| Visibility          | your own rack is private (`my_rack` view); **all auctions & word-plays are public**              |

Two facts drive the entire strategy:

1. **Score = cumulative word rewards.** Hoarding currency loses; _playing
   high-value words_ wins. Balance is a **renewable budget** — every word you
   play adds its reward to _both_ score and balance.
2. **Vickrey ⇒ bid your true marginal value.** In a second-price auction,
   truthful bidding is the dominant strategy, so a precise _marginal-value_
   engine is the whole ballgame.

> Note on the brief: the challenge text mentioned a **15ms** reply budget; the
> live module's constant is actually `AUCTION_DURATION_MS = 1000`. We target the
> stricter 15ms anyway and clear it with **~7× headroom on the worst case**.

---

## Quick start

```bash
cd scrabble-bot

# stats + the persona roster (derived from lib/agents/historical/*.ts)
cargo run --release -- info

# analyze a rack: best word, equity, bingo "hooks", and a bid for a letter
cargo run --release -- analyze RETINA S
cargo run --release -- analyze AEELRTZ Z --persona voltaire

# prove it works: self-play tournament (personas + a faithful starter clone)
cargo run --release -- sim --matches 40

# prove it's fast: decide_bid latency distribution
cargo run --release -- bench --n 100000

cargo test            # 16 unit/integration tests
```

Example `analyze RETINA S` — it recognises the famous bingo stem (16 letters
complete a 7+ word) and prices `S` accordingly:

```
Rack    : AEINRT (6 tiles)
Best word: RATINE (base 6, len 6, reward 15)
Bingo hooks (one tile from a 7+ word): CDEFGHIKLMNPRSTUW
Letter on auction: S
  marginal value : 13.17
  bid (bal 100, mid-bag, no rivals): 14
```

---

## Results (self-play)

```
== The Bard (Shakespeare) vs 3 official starter clones, 80 matches ==
  persona                  wins   win%   avgScore
  The Bard (Shakespeare)     79  98.8%      108.0
  Naive (starter)             1   0.4%       18.5     (×3 bots)

== Persona round-robin: 5 Bard personas + 1 starter clone, 40 matches ==
  The Bard (Shakespeare)  47.5%   avgRank 0.62   <- #1
  Voltaire                37.5%
  Cicero / Twain / Dante  ...
  Naive (starter)          0.0%

== Mirror robustness: 6× The Bard, 40 matches ==
  even 16.7% wins, no score collapse  <- the aggressive profile doesn't cannibalise

== Latency (Shakespeare, 3 modelled opponents, 7-tile rack) ==
  median ~270µs   p99 ~1.0ms   max ~2.2ms   (7× under the 15ms target)
```

---

## Architecture

```
src/
  tiles.rs       letter values, 98-tile bag, exact integer reward formula
  rack.rs        tile multiset (Counts) — allocation-free hot path
  dict.rs        ENABLE trie + rack-bounded best-word & "bingo hook" search  ← Linguistic Mastery
  persona.rs     bidding temperaments derived from lib/agents/historical/*.ts
  valuation.rs   rack equity + marginal value (what a Vickrey auction rewards)
  opponent.rs    reconstruct rivals' racks from public auction/word events
  bidding.rs     Vickrey-truthful policy + liquidity management + deprivation
  game.rs        event-driven state machine + the Player trait
  bridge.rs      engine-side translation for live play (no SDK dep, unit-tested)
  sim.rs         faithful local arena + a clone of the official starter bot
  net/           live SpacetimeDB SDK client (feature `live`)
assets/wordlist.txt   172,820 ENABLE words (the exact list the server validates)
```

**Valuation.** Each rack's equity blends (1) the best word playable now, (2) rack
health (vowel/consonant balance, anti-duplication, no stranded-Q trap) and (3)
**bingo proximity** — the count of single tiles that would complete a 7+ word,
found with a one-deficit trie DFS. The bid for a tile is its _marginal_ equity
(`equity(rack+tile) − equity(rack)`), which is exactly the quantity a Vickrey
auction pays you for bidding truthfully.

**Opponent modelling.** `match_participant` is public, so rivals' balance/score
are read directly; their racks are private, so we rebuild them from the public
`auction_result` (who won which letter) minus `word_play` (what they spent). That
feeds a capped _deprivation_ premium — paying a little extra to deny a pivotal
tile to whoever it helps most.

---

## The Shakespeare connection (and the rest of the roster)

Personas are tunable weight-bundles; every weight cites the agent field it comes
from. The flagship maps Shakespeare's `william-shakespeare.ts` directly:

| Shakespeare's persona data                                                       | → weight                          |
| -------------------------------------------------------------------------------- | --------------------------------- |
| gift **"Linguistic Mastery"**, trait "linguistic innovation and wordplay"        | high `length_bias`, `potential`   |
| `essence: 0.95`, uniquePower **"see into the heart of any human situation"**      | maxed `insight`, strong `deprivation` |
| `resonanceScore: 0.96`, trait "theatrical visionary with commercial savvy"       | confident `aggression`            |
| dominantModality `Fixed`, `monicaConstant 5.12`, "Patient craftsman"             | sustained `potential`, light `thrift` |

Alternates: **Cicero** (high-tempo orator), **Voltaire** (contrarian blocker —
max deprivation), **Twain** (patient value-investor), **Dante** (methodical
structuralist). Swap with `--persona <name>` or `BARD_PERSONA=voltaire`.

### Tuning

The flagship's weights are not just thematic — they're what self-play _selected_.
A round-robin showed the **aggressive, opponent-aware** axis (high `insight` +
`deprivation` + `aggression`) dominates a varied field, and that axis is precisely
Shakespeare's documented stat profile, so the flagship was tuned onto it. The
6× mirror match confirms it degrades gracefully rather than cannibalising.

---

## Going live

The engine, simulator, analyzer, tests and benchmark build with **zero external
dependencies** and run offline. Live play needs the SpacetimeDB SDK + bindings
generated from the module (which can't be produced in this sandbox), so it lives
behind the `live` feature:

```bash
# 1. install the SpacetimeDB CLI
curl -sSf https://install.spacetimedb.com | sh

# 2. generate the Rust bindings INTO this crate
spacetime generate --lang rust \
  --out-dir scrabble-bot/src/net/module_bindings \
  --project-path <path-to>/scrabblebot/spacetimedb

# 3. get your team JWT from the challenge site, then:
BOT_TOKEN=<jwt> BARD_PERSONA=shakespeare \
  cargo run --release --features live -- play
```

Connection: `https://maincloud.spacetimedb.com`, module `scrabblebot`.
Reducers used: `join_lobby()`, `submit_bid(auction_id, amount)`,
`submit_word(match_id, word)`.

All live decisions are delegated to `bridge.rs` (`LiveBridge`), which is fully
unit-tested without any SpacetimeDB dependency — so the only thing the SDK glue in
`net/spacetime.rs` does is move data in and reducer calls out. If a future module
rename shifts a field name, fix it there; the strategy never changes.

> **Prefer TypeScript/Bun?** A faithful port of this engine — same lexicon,
> personas, valuation and Vickrey bidding — lives in
> [`../scrabble-bot-ts`](../scrabble-bot-ts). It matches the official starter's
> toolchain (`spacetime generate --lang typescript`) and verifiably reproduces
> this bot's analysis and self-play results.
