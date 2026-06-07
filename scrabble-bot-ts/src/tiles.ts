// Tile values, the 98-tile bag, and the exact reward formula for ScrabbleBot.
// Mirrors scrabble-bot/src/tiles.rs (and the live module's letters.rs) exactly,
// including the integer-division reward so our accounting can't drift.

export const NLETTERS = 26;

// Standard English Scrabble point values, indexed by letter (0 = 'A').
export const LETTER_VALUES: readonly number[] = [
  1, 3, 3, 2, 1, 4, 2, 4, 1, 8, 5, 1, 3, 1, 1, 3, 10, 1, 1, 1, 1, 4, 4, 8, 4, 10,
];

// Standard 98-tile bag (100 standard tiles minus the 2 blanks), indexed by letter.
export const BAG_COUNTS: readonly number[] = [
  9, 2, 2, 4, 12, 2, 3, 2, 9, 1, 1, 4, 2, 6, 8, 2, 1, 6, 4, 6, 4, 2, 2, 1, 2, 1,
];

export const BAG_TOTAL = 98;

/** ASCII code (upper or lower) -> 0..25, or -1 if not A-Z. */
export function letterIndex(code: number): number {
  if (code >= 65 && code <= 90) return code - 65;
  if (code >= 97 && code <= 122) return code - 97;
  return -1;
}

/** 0..25 -> uppercase letter. */
export function indexLetter(i: number): string {
  return String.fromCharCode(65 + i);
}

export function valueOf(i: number): number {
  return LETTER_VALUES[i];
}

/** Length multiplier as the exact integer ratio [num, denom] the module uses. */
export function lengthMultRatio(len: number): [number, number] {
  if (len <= 3) return [1, 1];
  if (len === 4) return [3, 2];
  if (len === 5) return [2, 1];
  if (len === 6) return [5, 2];
  return [3, 1]; // >= 7
}

/** Length multiplier as a float (heuristics only). */
export function lengthMultiplier(len: number): number {
  const [n, d] = lengthMultRatio(len);
  return n / d;
}

/** Exact word reward = floor(base_score * num / denom), as the module computes it. */
export function rewardExact(baseScore: number, len: number): number {
  const [n, d] = lengthMultRatio(len);
  return Math.trunc((baseScore * n) / d);
}
