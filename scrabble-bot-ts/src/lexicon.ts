// The ENABLE lexicon as a flat-array trie with rack-bounded best-word search.
// Port of scrabble-bot/src/dict.rs. This is Shakespeare's "Linguistic Mastery"
// gift made literal: it finds the highest-reward word a rack can build, and the
// single tiles that would complete a 7+ letter "bingo".

import { readFileSync } from "node:fs";
import { indexLetter, letterIndex, NLETTERS, rewardExact, valueOf } from "./tiles";

const NONE = -1;

export interface Play {
  word: string;
  baseScore: number;
  len: number;
  reward: number;
}

export class Lexicon {
  private children: Int32Array; // node * 26 + letter -> child node id (or NONE)
  private terminal: Uint8Array;
  private nodeCount = 0;
  private cap: number;
  wordCount = 0;

  constructor(words: Iterable<string>) {
    this.cap = 1 << 19; // 524288 nodes (ENABLE needs ~388k); grows if exceeded
    this.children = new Int32Array(this.cap * NLETTERS).fill(NONE);
    this.terminal = new Uint8Array(this.cap);
    this.allocNode(); // root = 0
    for (const w of words) this.insert(w);
  }

  static loadFromFile(path: string): Lexicon {
    const raw = readFileSync(path, "utf8");
    return new Lexicon(raw.split("\n"));
  }

  get nodes(): number {
    return this.nodeCount;
  }

  private allocNode(): number {
    if (this.nodeCount >= this.cap) this.grow();
    return this.nodeCount++;
  }

  private grow(): void {
    const newCap = this.cap * 2;
    const nc = new Int32Array(newCap * NLETTERS).fill(NONE);
    nc.set(this.children);
    const nt = new Uint8Array(newCap);
    nt.set(this.terminal);
    this.children = nc;
    this.terminal = nt;
    this.cap = newCap;
  }

  private insert(word: string): void {
    const w = word.trim();
    if (!w) return;
    let cur = 0;
    for (let k = 0; k < w.length; k++) {
      const idx = letterIndex(w.charCodeAt(k));
      if (idx < 0) return; // skip words with non-letters
      let next = this.children[cur * NLETTERS + idx];
      if (next === NONE) {
        next = this.allocNode(); // may grow this.children
        this.children[cur * NLETTERS + idx] = next;
      }
      cur = next;
    }
    if (this.terminal[cur] === 0) {
      this.terminal[cur] = 1;
      this.wordCount++;
    }
  }

  contains(word: string): boolean {
    let cur = 0;
    for (let k = 0; k < word.length; k++) {
      const idx = letterIndex(word.charCodeAt(k));
      if (idx < 0) return false;
      const n = this.children[cur * NLETTERS + idx];
      if (n === NONE) return false;
      cur = n;
    }
    return this.terminal[cur] === 1;
  }

  /** Highest-reward word formable from `countsN` (a 26-length tile-count array). */
  bestPlay(countsN: Uint8Array): Play | null {
    const avail = Uint8Array.from(countsN);
    const path = new Uint8Array(16);
    let best: Play | null = null;

    const dfs = (node: number, depth: number, score: number): void => {
      if (this.terminal[node] === 1) {
        const reward = rewardExact(score, depth);
        if (best === null || reward > best.reward) {
          let w = "";
          for (let k = 0; k < depth; k++) w += indexLetter(path[k]);
          best = { word: w, baseScore: score, len: depth, reward };
        }
      }
      const off = node * NLETTERS;
      for (let i = 0; i < NLETTERS; i++) {
        if (avail[i] === 0) continue;
        const child = this.children[off + i];
        if (child === NONE) continue;
        avail[i]--;
        path[depth] = i;
        dfs(child, depth + 1, score + valueOf(i));
        avail[i]++;
      }
    };
    dfs(0, 0, 0);
    return best;
  }

  /** Visit every formable word as (letterIndices, depth, baseScore). */
  forEachPlay(countsN: Uint8Array, visit: (path: Uint8Array, depth: number, base: number) => void): void {
    const avail = Uint8Array.from(countsN);
    const path = new Uint8Array(16);
    const dfs = (node: number, depth: number, score: number): void => {
      if (this.terminal[node] === 1) visit(path, depth, score);
      const off = node * NLETTERS;
      for (let i = 0; i < NLETTERS; i++) {
        if (avail[i] === 0) continue;
        const child = this.children[off + i];
        if (child === NONE) continue;
        avail[i]--;
        path[depth] = i;
        dfs(child, depth + 1, score + valueOf(i));
        avail[i]++;
      }
    };
    dfs(0, 0, 0);
  }

  /** Bitmask of single letters that would complete a >= minLen word ("bingo hooks"). */
  bingoHookMask(countsN: Uint8Array, minLen = 7): number {
    const avail = Uint8Array.from(countsN);
    let mask = 0;
    const dfs = (node: number, deficitLetter: number, depth: number): void => {
      if (depth >= minLen && this.terminal[node] === 1 && deficitLetter >= 0) {
        mask |= 1 << deficitLetter;
      }
      if (depth >= minLen + 1) return;
      const off = node * NLETTERS;
      for (let i = 0; i < NLETTERS; i++) {
        const child = this.children[off + i];
        if (child === NONE) continue;
        if (avail[i] > 0) {
          avail[i]--;
          dfs(child, deficitLetter, depth + 1);
          avail[i]++;
        } else if (deficitLetter < 0) {
          dfs(child, i, depth + 1); // spend our single deficit on letter i
        }
      }
    };
    dfs(0, -1, 0);
    return mask;
  }
}

function popcount(x: number): number {
  let c = 0;
  while (x) {
    x &= x - 1;
    c++;
  }
  return c;
}

export { popcount };
