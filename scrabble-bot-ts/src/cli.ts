#!/usr/bin/env bun
// Offline tooling — runs today with Bun, no SpacetimeDB needed:
//   bun run src/cli.ts info
//   bun run src/cli.ts analyze RETINA S [--persona voltaire]
//   bun run src/cli.ts sim [--matches 20]
//   bun run src/cli.ts bench [--n 50000]

import { Brain, type Event } from "./game";
import { Lexicon } from "./lexicon";
import { runTournament, Rng } from "./sim";
import {
  Counts,
  PERSONAS,
  type Persona,
  ScoreModel,
  Valuator,
  decideBid,
  defaultWordlistPath,
  personaByName,
  personaRoster,
} from "./strategy";
import { indexLetter, letterIndex } from "./tiles";

function flag(args: string[], name: string): string | undefined {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
}
function positionals(args: string[]): string[] {
  const out: string[] = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith("--")) i++;
    else out.push(args[i]);
  }
  return out;
}
function personaFrom(args: string[]): Persona {
  const name = flag(args, "--persona");
  return name ? (personaByName(name) ?? PERSONAS.shakespeare()) : PERSONAS.shakespeare();
}

function cmdInfo(): void {
  const lex = Lexicon.loadFromFile(defaultWordlistPath());
  console.log(`Lexicon (ENABLE): ${lex.wordCount} words, ${lex.nodes} trie nodes`);
  console.log("\nPersonas (derived from lib/agents/historical/*.ts):");
  for (const p of personaRoster()) {
    console.log(
      `  ${p.name.padEnd(22)} ${p.signature.padEnd(34)} agg ${p.aggression.toFixed(2)}  potential ${p.potential.toFixed(
        2,
      )}  insight ${p.insight.toFixed(2)}  deprivation ${p.deprivation.toFixed(2)}`,
    );
  }
}

function cmdAnalyze(args: string[]): void {
  const pos = positionals(args);
  if (pos.length === 0) {
    console.error("usage: analyze <RACK> [LETTER] [--persona name]");
    return;
  }
  const persona = personaFrom(args);
  const lex = Lexicon.loadFromFile(defaultWordlistPath());
  const v = new Valuator(lex, persona);
  const rack = Counts.fromLetters(pos[0]);

  console.log(`Persona : ${persona.name}`);
  console.log(`Rack    : ${rack.toLetters()} (${rack.total} tiles)`);
  const best = lex.bestPlay(rack.n);
  console.log(best ? `Best word: ${best.word} (base ${best.baseScore}, len ${best.len}, reward ${best.reward})` : "Best word: (none formable)");
  console.log(`Equity  : ${v.equity(rack).toFixed(2)}`);

  const mask = lex.bingoHookMask(rack.n, 7);
  let hooks = "";
  for (let i = 0; i < 26; i++) if (mask & (1 << i)) hooks += indexLetter(i);
  console.log(`Bingo hooks (one tile from a 7+ word): ${hooks || "(none)"}`);

  if (pos[1]) {
    const idx = letterIndex(pos[1].charCodeAt(0));
    if (idx >= 0) {
      const mv = v.marginalValue(rack, idx);
      const bid = decideBid({
        valuator: v,
        rack,
        letterIdx: idx,
        myBalance: 100,
        reserve: 1,
        opponents: [],
        tilesRemaining: 60,
        scoreModel: ScoreModel.CumulativeWordScore,
      });
      console.log(`\nLetter on auction: ${indexLetter(idx)}`);
      console.log(`  marginal value : ${mv.toFixed(2)}`);
      console.log(`  bid (bal 100, mid-bag, no rivals): ${bid}`);
    } else {
      console.error(`'${pos[1]}' is not a letter A-Z`);
    }
  }
}

function printTourney(results: ReturnType<typeof runTournament>): void {
  console.log(`  ${"persona".padEnd(22)} ${"matches".padStart(7)} ${"wins".padStart(6)} ${"win%".padStart(8)} ${"avgScore".padStart(9)} ${"avgRank".padStart(9)}`);
  for (const r of results) {
    const winPct = ((r.wins / r.matches) * 100).toFixed(1);
    const avgScore = (r.totalScore / r.matches).toFixed(1);
    const avgRank = (r.sumRank / r.matches).toFixed(2);
    console.log(`  ${r.name.padEnd(22)} ${String(r.matches).padStart(7)} ${String(r.wins).padStart(6)} ${(winPct + "%").padStart(8)} ${avgScore.padStart(9)} ${avgRank.padStart(9)}`);
  }
}

function cmdSim(args: string[]): void {
  const matches = Number(flag(args, "--matches") ?? 20);
  const seed = 0xc0ffeen;
  const lex = Lexicon.loadFromFile(defaultWordlistPath());
  console.log(`Loaded ENABLE lexicon: ${lex.wordCount} words.\n`);

  console.log(`== Persona round-robin: 5 Bard personas + 1 starter clone, ${matches} matches ==`);
  printTourney(runTournament(personaRoster(), 1, matches, seed, lex));

  console.log(`\n== The Bard (Shakespeare) vs 3 starter clones, ${matches * 2} matches ==`);
  printTourney(runTournament([PERSONAS.shakespeare()], 3, matches * 2, seed ^ 0xabcdn, lex));

  console.log(`\n== Mirror robustness: 6x The Bard (Shakespeare), ${matches} matches ==`);
  printTourney(runTournament([PERSONAS.shakespeare(), PERSONAS.shakespeare(), PERSONAS.shakespeare(), PERSONAS.shakespeare(), PERSONAS.shakespeare(), PERSONAS.shakespeare()], 0, matches, seed ^ 0x55aan, lex));
}

function cmdBench(args: string[]): void {
  const n = Number(flag(args, "--n") ?? 50000);
  const lex = Lexicon.loadFromFile(defaultWordlistPath());
  const brain = new Brain(0, lex, PERSONAS.shakespeare());
  brain.observe({ t: "MatchStart", me: 0, players: [0, 1, 2, 3], startBalance: 100, tilesToAuction: 60 });
  const rng = new Rng(0xdeadbeefn);
  for (let oid = 1; oid <= 3; oid++) {
    for (let k = 0; k < 6; k++) {
      brain.observe({ t: "AuctionResolved", winner: oid, letterIdx: rng.below(26), paid: 2 });
    }
  }

  const durations = new Float64Array(n);
  // warmup
  for (let i = 0; i < 1000; i++) {
    const rack = new Counts();
    for (let k = 0; k < 7; k++) rack.add(rng.below(26));
    brain.myRack = rack;
    brain.decideBid(rng.below(26));
  }
  for (let i = 0; i < n; i++) {
    const rack = new Counts();
    for (let k = 0; k < 7; k++) rack.add(rng.below(26));
    brain.myRack = rack;
    const letter = rng.below(26);
    const t = performance.now();
    brain.decideBid(letter);
    durations[i] = (performance.now() - t) * 1000; // µs
  }
  durations.sort();
  const mean = durations.reduce((a, b) => a + b, 0) / n;
  const p50 = durations[Math.floor(n / 2)];
  const p99 = durations[Math.floor((n * 99) / 100)];
  const max = durations[n - 1];
  console.log(`decide_bid latency over ${n} random mid-game states`);
  console.log(`(Shakespeare persona, 3 modelled opponents, 7-tile rack):\n`);
  console.log(`  mean  ${mean.toFixed(2)} µs`);
  console.log(`  p50   ${p50.toFixed(2)} µs`);
  console.log(`  p99   ${p99.toFixed(2)} µs`);
  console.log(`  max   ${max.toFixed(2)} µs`);
  console.log(`\n  server window 1000 ms / 15 ms target -> ${(15000 / Math.max(0.001, max)).toFixed(0)}x headroom vs the 15 ms target`);
}

const argv = process.argv.slice(2);
const cmd = argv[0] ?? "help";
const rest = argv.slice(1);
switch (cmd) {
  case "info":
    cmdInfo();
    break;
  case "analyze":
    cmdAnalyze(rest);
    break;
  case "sim":
    cmdSim(rest);
    break;
  case "bench":
    cmdBench(rest);
    break;
  default:
    console.log(
      "bard (TypeScript) — offline tools\n\n" +
        "  bun run src/cli.ts info\n" +
        "  bun run src/cli.ts analyze <RACK> [LETTER] [--persona name]\n" +
        "  bun run src/cli.ts sim [--matches N]\n" +
        "  bun run src/cli.ts bench [--n N]\n\n" +
        "Live play: bun run src/index.ts  (after `bun run generate` + BOT_TOKEN; see README).",
    );
}
