// Strategic core — a faithful TypeScript port of scrabble-bot/src/{rack,persona,
// valuation,bidding,opponent}.rs. Same constants, same math, so the TS bot
// inherits the Rust bot's validated behaviour.

import { fileURLToPath } from "node:url";
import { Lexicon, type Play, popcount } from "./lexicon";
import { indexLetter, letterIndex, NLETTERS, rewardExact } from "./tiles";

// --- Counts: a tile multiset -------------------------------------------------

export class Counts {
  n = new Uint8Array(NLETTERS);
  total = 0;

  static fromLetters(s: string): Counts {
    const c = new Counts();
    for (let k = 0; k < s.length; k++) {
      const i = letterIndex(s.charCodeAt(k));
      if (i >= 0) {
        c.n[i]++;
        c.total++;
      }
    }
    return c;
  }

  static fromMap(map: Map<string, number>): Counts {
    const c = new Counts();
    for (const [letter, count] of map) {
      const i = letterIndex(letter.charCodeAt(0));
      if (i >= 0 && count > 0) {
        c.n[i] += count;
        c.total += count;
      }
    }
    return c;
  }

  clone(): Counts {
    const c = new Counts();
    c.n = Uint8Array.from(this.n);
    c.total = this.total;
    return c;
  }

  add(i: number): void {
    this.n[i]++;
    this.total++;
  }
  remove(i: number): boolean {
    if (this.n[i] > 0) {
      this.n[i]--;
      this.total--;
      return true;
    }
    return false;
  }
  get(i: number): number {
    return this.n[i];
  }
  withAdded(i: number): Counts {
    const c = this.clone();
    c.add(i);
    return c;
  }
  vowels(): number {
    return this.n[0] + this.n[4] + this.n[8] + this.n[14] + this.n[20];
  }
  tryRemoveWord(word: string): Counts | null {
    const c = this.clone();
    for (let k = 0; k < word.length; k++) {
      const i = letterIndex(word.charCodeAt(k));
      if (i < 0 || !c.remove(i)) return null;
    }
    return c;
  }
  toLetters(): string {
    let s = "";
    for (let i = 0; i < NLETTERS; i++) for (let k = 0; k < this.n[i]; k++) s += indexLetter(i);
    return s;
  }
}

// --- Persona: bidding temperaments from lib/agents/historical/*.ts -----------

export interface Persona {
  name: string;
  signature: string;
  immediacy: number;
  balance: number;
  potential: number;
  lengthBias: number;
  aggression: number;
  thrift: number;
  deprivation: number;
  insight: number;
}

// Shakespeare is the flagship — both persona-faithful and the self-play-selected
// champion profile (see scrabble-bot/README.md "Tuning").
export const PERSONAS = {
  shakespeare: (): Persona => ({
    name: "The Bard (Shakespeare)",
    signature: "SHAKESPEARE-1564-WORDSMITH-GENIUS",
    immediacy: 1.0,
    balance: 0.9,
    potential: 1.4,
    lengthBias: 0.9,
    aggression: 1.15,
    thrift: 0.4,
    deprivation: 0.65,
    insight: 1.0,
  }),
  cicero: (): Persona => ({
    name: "Cicero",
    signature: "CICERO-SIGNATURE",
    immediacy: 1.2,
    balance: 0.8,
    potential: 1.0,
    lengthBias: 0.7,
    aggression: 1.2,
    thrift: 0.4,
    deprivation: 0.3,
    insight: 0.7,
  }),
  voltaire: (): Persona => ({
    name: "Voltaire",
    signature: "VOLTAIRE-1694-ENLIGHTENMENT-WIT",
    immediacy: 1.0,
    balance: 0.85,
    potential: 1.1,
    lengthBias: 0.8,
    aggression: 1.0,
    thrift: 0.55,
    deprivation: 0.7,
    insight: 1.0,
  }),
  twain: (): Persona => ({
    name: "Mark Twain",
    signature: "TWAIN-1835-AMERICAN-HUMORIST",
    immediacy: 0.95,
    balance: 1.0,
    potential: 1.2,
    lengthBias: 0.85,
    aggression: 0.9,
    thrift: 0.8,
    deprivation: 0.25,
    insight: 0.75,
  }),
  dante: (): Persona => ({
    name: "Dante",
    signature: "DANTE-1265-DIVINE-POET",
    immediacy: 0.85,
    balance: 1.1,
    potential: 1.5,
    lengthBias: 1.0,
    aggression: 0.95,
    thrift: 0.6,
    deprivation: 0.3,
    insight: 0.8,
  }),
};

export function personaByName(name: string): Persona | null {
  const key = name.toLowerCase();
  if (key === "shakespeare" || key === "bard") return PERSONAS.shakespeare();
  if (key === "cicero") return PERSONAS.cicero();
  if (key === "voltaire") return PERSONAS.voltaire();
  if (key === "twain") return PERSONAS.twain();
  if (key === "dante") return PERSONAS.dante();
  return null;
}

export function personaRoster(): Persona[] {
  return [PERSONAS.shakespeare(), PERSONAS.cicero(), PERSONAS.voltaire(), PERSONAS.twain(), PERSONAS.dante()];
}

// --- Valuator: rack equity + marginal value ---------------------------------

const Q = letterIndex(81); // 'Q'
const U = letterIndex(85); // 'U'
const MAX_WORD = 15;

export class Valuator {
  constructor(
    public lex: Lexicon,
    public persona: Persona,
  ) {}

  equity(rack: Counts): number {
    const p = this.persona;
    const best = this.lex.bestPlay(rack.n);
    const immediate = best ? best.reward + p.lengthBias * best.len : 0;
    return p.immediacy * immediate + p.balance * this.balanceScore(rack) + p.potential * this.potentialScore(rack);
  }

  marginalValue(rack: Counts, i: number): number {
    return Math.max(0, this.equity(rack.withAdded(i)) - this.equity(rack));
  }

  /** Cheaper marginal value (skips the bingo-potential DFS) for opponent threats. */
  marginalValueFast(rack: Counts, i: number): number {
    return Math.max(0, this.equityFast(rack.withAdded(i)) - this.equityFast(rack));
  }

  private equityFast(rack: Counts): number {
    const p = this.persona;
    const best = this.lex.bestPlay(rack.n);
    const immediate = best ? best.reward + p.lengthBias * best.len : 0;
    return p.immediacy * immediate + p.balance * this.balanceScore(rack);
  }

  private balanceScore(rack: Counts): number {
    if (rack.total === 0) return 0;
    const ratio = rack.vowels() / rack.total;
    let score = 4.0 - 6.0 * Math.abs(ratio - 0.4);
    for (let i = 0; i < NLETTERS; i++) {
      if (rack.n[i] >= 3) score -= 1.2 * (rack.n[i] - 2);
    }
    if (rack.n[Q] > 0 && rack.n[U] === 0) score -= 2.5;
    return score;
  }

  private potentialScore(rack: Counts): number {
    if (rack.total >= 5 && rack.total <= 8) {
      return popcount(this.lex.bingoHookMask(rack.n, 7)) * 0.6;
    }
    return 0;
  }

  chooseWord(rack: Counts): Play | null {
    if (rack.total < 2) return null;
    const best = this.lex.bestPlay(rack.n);
    if (!best) return null;
    if (this.shouldHold(rack, best)) return null;
    const r = this.bestPlayWithLeave(rack);
    return r ? r.play : null;
  }

  bestForcedWord(rack: Counts): Play | null {
    return this.lex.bestPlay(rack.n);
  }

  private shouldHold(rack: Counts, best: Play): boolean {
    if (best.len >= 7) return false; // lock in an in-hand bingo
    if (rack.total >= 7 || rack.total <= 2) return false;
    const hooks = popcount(this.lex.bingoHookMask(rack.n, 7));
    const need = this.persona.potential >= 1.3 ? 2 : 4;
    return hooks >= need;
  }

  private bestPlayWithLeave(rack: Counts): { play: Play; value: number } | null {
    const K = 24;
    type Cand = { reward: number; base: number; len: number; letters: Uint8Array };
    const cands: Cand[] = [];
    this.lex.forEachPlay(rack.n, (path, depth, base) => {
      if (depth > MAX_WORD) return;
      const reward = rewardExact(base, depth);
      cands.push({ reward, base, len: depth, letters: Uint8Array.from(path.subarray(0, depth)) });
    });
    if (cands.length === 0) return null;
    cands.sort((a, b) => b.reward - a.reward);
    cands.length = Math.min(cands.length, K);

    let best: { play: Play; value: number } | null = null;
    for (const c of cands) {
      const leave = rack.clone();
      for (let k = 0; k < c.len; k++) {
        leave.n[c.letters[k]]--;
        leave.total--;
      }
      const value = c.reward + this.equity(leave);
      if (best === null || value > best.value) {
        let w = "";
        for (let k = 0; k < c.len; k++) w += indexLetter(c.letters[k]);
        best = { play: { word: w, baseScore: c.base, len: c.len, reward: c.reward }, value };
      }
    }
    return best;
  }
}

// --- Opponent modelling ------------------------------------------------------

export class OpponentModel {
  rack = new Counts();
  balance: number;
  score = 0;
  wordsPlayed = 0;
  constructor(
    public botId: number,
    startBalance: number,
  ) {
    this.balance = startBalance;
  }
  wonLetter(i: number, paid: number): void {
    this.rack.add(i);
    this.balance -= paid;
  }
  playedWord(word: string, reward: number): void {
    const leave = this.rack.tryRemoveWord(word);
    if (leave) this.rack = leave;
    this.balance += reward;
    this.score += reward;
    this.wordsPlayed++;
  }
  setPublic(balance: number, score: number): void {
    this.balance = balance;
    this.score = score;
  }
}

export class TableModel {
  opponents: OpponentModel[] = [];
  seen = new Uint8Array(NLETTERS);
  constructor(
    public startBalance: number,
    opponentIds: number[],
  ) {
    this.opponents = opponentIds.map((id) => new OpponentModel(id, startBalance));
  }
  opponent(botId: number): OpponentModel | undefined {
    return this.opponents.find((o) => o.botId === botId);
  }
  onAuctionWon(winnerBotId: number, i: number, paid: number, me: number): void {
    if (this.seen[i] < 255) this.seen[i]++;
    if (winnerBotId !== me) this.opponent(winnerBotId)?.wonLetter(i, paid);
  }
  onWordPlayed(botId: number, word: string, reward: number, me: number): void {
    if (botId !== me) this.opponent(botId)?.playedWord(word, reward);
  }
}

// --- Bidding policy ----------------------------------------------------------

export enum ScoreModel {
  CumulativeWordScore,
  FinalBalance,
}

export interface BidContext {
  valuator: Valuator;
  rack: Counts;
  letterIdx: number;
  myBalance: number;
  reserve: number;
  opponents: OpponentModel[];
  tilesRemaining: number;
  scoreModel: ScoreModel;
}

function liquidityPressure(balance: number): number {
  const COMFORT = 25.0;
  return Math.min(1, Math.max(0, 1 - Math.max(0, balance) / COMFORT));
}

export function decideBid(ctx: BidContext): number {
  const p = ctx.valuator.persona;
  let value = ctx.valuator.marginalValue(ctx.rack, ctx.letterIdx) * p.aggression;

  if (p.deprivation > 0 && ctx.opponents.length > 0) {
    let bestOpp = 0;
    for (const opp of ctx.opponents) {
      const omv = ctx.valuator.marginalValueFast(opp.rack, ctx.letterIdx);
      if (omv > bestOpp) bestOpp = omv;
    }
    if (bestOpp > value) value += p.deprivation * p.insight * (bestOpp - value);
  }

  if (value <= 0) return 0;

  const endgame = ctx.tilesRemaining <= 12;
  let bid = value;
  if (ctx.scoreModel === ScoreModel.CumulativeWordScore) {
    if (endgame) bid = Math.max(bid, ctx.myBalance * 0.5);
    else bid *= 1 - 0.5 * p.thrift * liquidityPressure(ctx.myBalance);
  } else {
    bid *= 1 - p.thrift * liquidityPressure(ctx.myBalance);
  }

  const maxAffordable = Math.max(0, ctx.myBalance);
  let bidI = Math.round(bid);
  if (bidI > maxAffordable) bidI = maxAffordable;
  if (bidI < ctx.reserve) {
    return value >= ctx.reserve && maxAffordable >= ctx.reserve ? ctx.reserve : 0;
  }
  return bidI;
}

// --- Drop-in helpers matching the official starter's strategy.ts -------------

export function defaultWordlistPath(): string {
  return fileURLToPath(new URL("../wordlist.txt", import.meta.url));
}

let SHARED_LEX: Lexicon | null = null;
export function sharedLexicon(): Lexicon {
  if (!SHARED_LEX) SHARED_LEX = Lexicon.loadFromFile(defaultWordlistPath());
  return SHARED_LEX;
}

/**
 * Drop-in replacement for the starter's `decideBid` — same signature, far better
 * play (real marginal-value + bingo awareness). Lacks opponent context, so it
 * assumes a mid-bag, no-rivals situation; the full client in index.ts uses the
 * stateful `Brain` instead for opponent-aware deprivation.
 */
export function decideBidSimple(ctx: { letter: string; myBalance: number; myRack: Map<string, number> }): number {
  const v = new Valuator(sharedLexicon(), PERSONAS.shakespeare());
  const rack = Counts.fromMap(ctx.myRack);
  const idx = letterIndex(ctx.letter.charCodeAt(0));
  if (idx < 0) return 0;
  return decideBid({
    valuator: v,
    rack,
    letterIdx: idx,
    myBalance: ctx.myBalance,
    reserve: 1,
    opponents: [],
    tilesRemaining: 60,
    scoreModel: ScoreModel.CumulativeWordScore,
  });
}

/** Drop-in replacement for the starter's `chooseWord`. */
export function chooseWordSimple(ctx: { myRack: Map<string, number> }): string | null {
  const v = new Valuator(sharedLexicon(), PERSONAS.shakespeare());
  const play = v.chooseWord(Counts.fromMap(ctx.myRack));
  return play ? play.word : null;
}
