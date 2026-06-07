//! Tile values, bag composition, and the word-reward formula for ScrabbleBot.
//!
//! These constants mirror the SpacetimeDB `scrabblebot` module:
//!   * standard 98-tile English Scrabble bag, **no blanks**
//!   * standard English letter point values
//!   * word reward = `base_score * length_multiplier(len)`
//!
//! The length-multiplier breakpoints are confirmed verbatim against the module
//! (`spacetimedb/src/letters.rs`): the reward is computed with **integer** rational
//! math, `total_reward = base_score * num / denom`, with ratios
//! `<=3 -> 1/1, 4 -> 3/2, 5 -> 2/1, 6 -> 5/2, >=7 -> 3/1`. We mirror that exactly
//! in [`reward_exact`] so the simulator and opponent accounting match the server
//! to the unit (including the truncation from integer division).

/// Number of distinct letters A..=Z.
pub const NLETTERS: usize = 26;

/// Standard English Scrabble point values, indexed by letter (0 = 'A').
pub const LETTER_VALUES: [u32; NLETTERS] = [
    1,  // A
    3,  // B
    3,  // C
    2,  // D
    1,  // E
    4,  // F
    2,  // G
    4,  // H
    1,  // I
    8,  // J
    5,  // K
    1,  // L
    3,  // M
    1,  // N
    1,  // O
    3,  // P
    10, // Q
    1,  // R
    1,  // S
    1,  // T
    1,  // U
    4,  // V
    4,  // W
    8,  // X
    4,  // Y
    10, // Z
];

/// Standard 98-tile bag (the 100-tile English set minus the 2 blanks), indexed
/// by letter. Used by the simulator and by opponent / supply modelling.
pub const BAG_COUNTS: [u8; NLETTERS] = [
    9,  // A
    2,  // B
    2,  // C
    4,  // D
    12, // E
    2,  // F
    3,  // G
    2,  // H
    9,  // I
    1,  // J
    1,  // K
    4,  // L
    2,  // M
    6,  // N
    8,  // O
    2,  // P
    1,  // Q
    6,  // R
    4,  // S
    6,  // T
    4,  // U
    2,  // V
    2,  // W
    1,  // X
    2,  // Y
    1,  // Z
];

/// Total tiles in the bag (must be 98).
pub const BAG_TOTAL: u32 = 98;

/// Map an ASCII letter (upper or lower case) to a 0..26 index, if it is A-Z.
#[inline]
pub fn letter_index(c: u8) -> Option<usize> {
    match c {
        b'A'..=b'Z' => Some((c - b'A') as usize),
        b'a'..=b'z' => Some((c - b'a') as usize),
        _ => None,
    }
}

/// Map a 0..26 index back to an uppercase ASCII letter.
#[inline]
pub fn index_letter(i: usize) -> u8 {
    b'A' + i as u8
}

/// Point value of a single letter index.
#[inline]
pub fn value_of(i: usize) -> u32 {
    LETTER_VALUES[i]
}

/// Length multiplier as the exact integer ratio `(num, denom)` the module uses:
///   `<=3 -> 1/1`, `4 -> 3/2`, `5 -> 2/1`, `6 -> 5/2`, `>=7 -> 3/1`.
#[inline]
pub fn length_mult_ratio(len: usize) -> (i64, i64) {
    match len {
        0..=3 => (1, 1),
        4 => (3, 2),
        5 => (2, 1),
        6 => (5, 2),
        _ => (3, 1), // >= 7 ("bingo")
    }
}

/// Length multiplier as `f64` (for heuristics only); equals `num/denom`.
#[inline]
pub fn length_multiplier(len: usize) -> f64 {
    let (n, d) = length_mult_ratio(len);
    n as f64 / d as f64
}

/// Base score of a word = sum of letter values (this game has no board premiums).
pub fn base_score(letters: &[u8]) -> u32 {
    letters
        .iter()
        .filter_map(|&c| letter_index(c))
        .map(value_of)
        .sum()
}

/// Exact word reward `= base_score * num / denom` with **integer division**,
/// identical to the module's `play_word` (so our accounting can't drift).
#[inline]
pub fn reward_exact(base_score: i64, len: usize) -> i64 {
    let (n, d) = length_mult_ratio(len);
    base_score * n / d
}

/// Full exact word reward for a word given as ASCII bytes.
pub fn word_reward(letters: &[u8]) -> i64 {
    reward_exact(base_score(letters) as i64, letters.len())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn bag_totals_98() {
        let sum: u32 = BAG_COUNTS.iter().map(|&c| c as u32).sum();
        assert_eq!(sum, BAG_TOTAL);
    }

    #[test]
    fn scoring_basics() {
        assert_eq!(base_score(b"QUIZ"), 10 + 1 + 1 + 10);
        // 4-letter word: 1.5x -> 22 * 3 / 2 = 33 (exact integer).
        assert_eq!(word_reward(b"QUIZ"), 33);
        // 6-letter integer truncation: base 7 -> 7 * 5 / 2 = 17 (not 17.5).
        assert_eq!(reward_exact(7, 6), 17);
        // 7-letter bingo: 3.0x multiplier.
        assert_eq!(length_multiplier(7), 3.0);
        assert_eq!(reward_exact(7, 7), 21);
    }
}
