// Local self-play arena + a faithful clone of the official starter bot. Port of
// scrabble-bot/src/sim.rs. Lets the TS port be proven offline with Bun.

import { Brain, type Event, type Player } from "./game";
import type { Lexicon, Play } from "./lexicon";
import { Counts, type Persona, ScoreModel } from "./strategy";
import { BAG_COUNTS, BAG_TOTAL, indexLetter, rewardExact, valueOf } from "./tiles";

export enum AuctionType {
  Vickrey,
  FirstPrice,
}

/** xorshift64* PRNG (deterministic). */
export class Rng {
  private s: bigint;
  constructor(seed: number | bigint) {
    this.s = (BigInt(seed) ^ 0x9e3779b97f4a7c15n) | 1n;
  }
  nextU64(): bigint {
    let x = this.s;
    x ^= x >> 12n;
    x ^= (x << 25n) & 0xffffffffffffffffn;
    x ^= x >> 27n;
    this.s = x & 0xffffffffffffffffn;
    return (this.s * 0x2545f4914f6cdd1dn) & 0xffffffffffffffffn;
  }
  below(n: number): number {
    return Number(this.nextU64() % BigInt(n));
  }
}

function bagFull(): Counts {
  const c = new Counts();
  c.n = Uint8Array.from(BAG_COUNTS);
  c.total = BAG_TOTAL;
  return c;
}

function draw(bag: Counts, rng: Rng): number {
  if (bag.total === 0) return -1;
  let r = rng.below(bag.total);
  for (let i = 0; i < 26; i++) {
    r -= bag.n[i];
    if (r < 0) {
      bag.remove(i);
      return i;
    }
  }
  return -1;
}

export interface Standing {
  botId: number;
  persona: string;
  score: number;
  balance: number;
  words: number;
}

export function runMatch(players: Player[], auctionType: AuctionType, seed: number | bigint): Standing[] {
  const n = players.length;
  const RESERVE = 1;
  const START_BALANCE = 100;
  const STARTING_RACK = 5;
  const rng = new Rng(seed);
  const bag = bagFull();
  const ids = Array.from({ length: n }, (_, i) => i);

  // Deal starting racks privately.
  const startRacks = Array.from({ length: n }, () => new Counts());
  for (let s = 0; s < STARTING_RACK; s++) {
    for (const r of startRacks) {
      const idx = draw(bag, rng);
      if (idx >= 0) r.add(idx);
    }
  }
  const tilesToAuction = bag.total;

  for (let i = 0; i < n; i++) {
    players[i].observe({ t: "MatchStart", me: i, players: ids, startBalance: START_BALANCE, tilesToAuction });
    players[i].observe({ t: "RackSnapshot", rack: startRacks[i], balance: START_BALANCE, score: 0 });
  }

  for (;;) {
    const letterIdx = draw(bag, rng);
    if (letterIdx < 0) break;

    const order: Array<[number, number]> = [];
    for (let i = 0; i < n; i++) {
      const amt = players[i].decideBid(letterIdx);
      if (amt >= RESERVE) order.push([i, amt]);
    }
    order.sort((a, b) => b[1] - a[1] || a[0] - b[0]);

    let winner: number | null = null;
    let paid = 0;
    if (order.length > 0) {
      winner = order[0][0];
      paid =
        auctionType === AuctionType.FirstPrice
          ? order[0][1]
          : order.length >= 2
            ? Math.max(order[1][1], RESERVE)
            : RESERVE;
    }
    const resolved: Event = { t: "AuctionResolved", winner, letterIdx, paid };
    for (const p of players) p.observe(resolved);

    for (let i = 0; i < n; i++) {
      const play = players[i].chooseWord();
      if (play) {
        const ev: Event = { t: "WordPlayed", botId: i, word: play.word, reward: Math.trunc(play.reward) };
        for (const p of players) p.observe(ev);
      }
    }
  }

  // End-of-bag flush.
  let guard = 0;
  for (;;) {
    let progress = false;
    for (let i = 0; i < n; i++) {
      const play = players[i].bestForcedWord();
      if (play) {
        const ev: Event = { t: "WordPlayed", botId: i, word: play.word, reward: Math.trunc(play.reward) };
        for (const p of players) p.observe(ev);
        progress = true;
      }
    }
    if (!progress || ++guard > 100) break;
  }

  const standings: Standing[] = players.map((p) => ({
    botId: p.id(),
    persona: p.name(),
    score: p.score(),
    balance: p.balance(),
    words: p.words(),
  }));
  standings.sort((a, b) => b.score - a.score);
  return standings;
}

export interface TourneyResult {
  name: string;
  matches: number;
  wins: number;
  totalScore: number;
  sumRank: number;
}

export function runTournament(
  bardRoster: Persona[],
  nNaive: number,
  matches: number,
  seed: bigint,
  lex: Lexicon,
): TourneyResult[] {
  const agg = new Map<string, TourneyResult>();
  for (let m = 0; m < matches; m++) {
    const players: Player[] = [];
    bardRoster.forEach((persona, i) => players.push(new Brain(i, lex, persona, ScoreModel.CumulativeWordScore)));
    for (let k = 0; k < nNaive; k++) players.push(new NaiveBot(bardRoster.length + k, lex));

    const matchSeed = (seed + BigInt(m) * 0x9e3779b97f4a7c15n) & 0xffffffffffffffffn;
    const standings = runMatch(players, AuctionType.Vickrey, matchSeed);

    standings.forEach((s, rank) => {
      let e = agg.get(s.persona);
      if (!e) {
        e = { name: s.persona, matches: 0, wins: 0, totalScore: 0, sumRank: 0 };
        agg.set(s.persona, e);
      }
      e.matches++;
      if (rank === 0) e.wins++;
      e.totalScore += s.score;
      e.sumRank += rank;
    });
  }
  return [...agg.values()].sort((a, b) => b.wins - a.wins || b.totalScore - a.totalScore);
}

// --- NaiveBot: faithful clone of bot-starter/src/strategy.ts -----------------

export class NaiveBot implements Player {
  private rack = new Counts();
  private bal = 0;
  private sc = 0;
  private w = 0;
  constructor(
    private meId: number,
    private lex: Lexicon,
  ) {}

  private longestWord(): Play | null {
    let best: { base: number; len: number; letters: Uint8Array } | null = null;
    let bestLen = 1; // min word length is 2
    this.lex.forEachPlay(this.rack.n, (path, depth, base) => {
      if (depth > bestLen && depth <= 15) {
        bestLen = depth;
        best = { base, len: depth, letters: Uint8Array.from(path.subarray(0, depth)) };
      }
    });
    if (!best) return null;
    const b = best as { base: number; len: number; letters: Uint8Array };
    let word = "";
    for (let k = 0; k < b.len; k++) word += indexLetter(b.letters[k]);
    return { word, baseScore: b.base, len: b.len, reward: rewardExact(b.base, b.len) };
  }

  observe(ev: Event): void {
    switch (ev.t) {
      case "MatchStart":
        this.meId = ev.me;
        this.bal = ev.startBalance;
        this.sc = 0;
        this.w = 0;
        this.rack = new Counts();
        break;
      case "RackSnapshot":
        this.rack = ev.rack;
        this.bal = ev.balance;
        this.sc = ev.score;
        break;
      case "AuctionResolved":
        if (ev.winner === this.meId) {
          this.rack.add(ev.letterIdx);
          this.bal -= ev.paid;
        }
        break;
      case "WordPlayed":
        if (ev.botId === this.meId) {
          const leave = this.rack.tryRemoveWord(ev.word);
          if (leave) this.rack = leave;
          this.bal += ev.reward;
          this.sc += ev.reward;
          this.w++;
        }
        break;
      case "Participant":
        if (ev.botId === this.meId) {
          this.bal = ev.balance;
          this.sc = ev.score;
        }
        break;
    }
  }

  decideBid(letterIdx: number): number {
    const value = valueOf(letterIdx);
    const have = this.rack.get(letterIdx);
    const want = have === 0 ? value + 2 : Math.max(1, value);
    return Math.min(want, Math.max(0, this.bal));
  }
  chooseWord(): Play | null {
    return this.longestWord();
  }
  bestForcedWord(): Play | null {
    return this.longestWord();
  }
  id(): number {
    return this.meId;
  }
  name(): string {
    return "Naive (starter)";
  }
  score(): number {
    return this.sc;
  }
  balance(): number {
    return this.bal;
  }
  words(): number {
    return this.w;
  }
}
