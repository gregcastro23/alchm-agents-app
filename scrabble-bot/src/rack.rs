//! A rack / tile multiset represented as per-letter counts for O(1) add & remove.
//!
//! Everything in the hot path (valuation, bidding) operates on [`Counts`] rather
//! than strings, so there are no allocations during a bid decision.

use crate::tiles::{index_letter, letter_index, NLETTERS};

/// A multiset of tiles: `n[i]` is how many of letter `i` (0='A') are held.
#[derive(Clone, Copy, PartialEq, Eq, Debug, Default)]
pub struct Counts {
    pub n: [u8; NLETTERS],
    pub total: u16,
}

impl Counts {
    pub fn new() -> Self {
        Self::default()
    }

    /// Build a multiset from a string of letters (non-letters ignored).
    pub fn from_letters(s: &str) -> Self {
        let mut c = Self::new();
        for b in s.bytes() {
            c.add_letter(b);
        }
        c
    }

    #[inline]
    pub fn add(&mut self, i: usize) {
        self.n[i] += 1;
        self.total += 1;
    }

    #[inline]
    pub fn add_letter(&mut self, b: u8) {
        if let Some(i) = letter_index(b) {
            self.add(i);
        }
    }

    #[inline]
    pub fn remove(&mut self, i: usize) -> bool {
        if self.n[i] > 0 {
            self.n[i] -= 1;
            self.total -= 1;
            true
        } else {
            false
        }
    }

    #[inline]
    pub fn get(&self, i: usize) -> u8 {
        self.n[i]
    }

    /// A copy with one more of letter `i` (used to evaluate "rack + auctioned tile").
    #[inline]
    pub fn with_added(&self, i: usize) -> Self {
        let mut c = *self;
        c.add(i);
        c
    }

    /// Remove every letter of `word`. Returns the leave (remaining tiles) if
    /// `word` is a sub-multiset of this rack, else `None`.
    pub fn try_remove_word(&self, word: &[u8]) -> Option<Counts> {
        let mut c = *self;
        for &b in word {
            let i = letter_index(b)?;
            if !c.remove(i) {
                return None;
            }
        }
        Some(c)
    }

    /// Number of vowels (A, E, I, O, U) held.
    pub fn vowels(&self) -> u16 {
        (self.n[0] as u16) // A
            + self.n[4] as u16 // E
            + self.n[8] as u16 // I
            + self.n[14] as u16 // O
            + self.n[20] as u16 // U
    }

    /// Number of consonants held.
    pub fn consonants(&self) -> u16 {
        self.total - self.vowels()
    }

    /// Number of distinct letters held.
    pub fn distinct(&self) -> u16 {
        self.n.iter().filter(|&&c| c > 0).count() as u16
    }

    /// Render as a sorted uppercase string (e.g. "AEORST"). Allocates; not for
    /// the hot path.
    pub fn to_letters(&self) -> String {
        let mut s = String::with_capacity(self.total as usize);
        for i in 0..NLETTERS {
            for _ in 0..self.n[i] {
                s.push(index_letter(i) as char);
            }
        }
        s
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn add_remove_roundtrip() {
        let mut c = Counts::from_letters("RETINAS");
        assert_eq!(c.total, 7);
        assert_eq!(c.vowels(), 3); // E I A
        assert_eq!(c.consonants(), 4); // R T N S
        let leave = c.try_remove_word(b"RAIN").unwrap();
        assert_eq!(leave.total, 3);
        assert_eq!(leave.to_letters(), "EST");
        c.remove(crate::tiles::letter_index(b'R').unwrap());
        assert_eq!(c.get(crate::tiles::letter_index(b'R').unwrap()), 0);
    }

    #[test]
    fn rejects_non_submultiset() {
        let c = Counts::from_letters("CAT");
        assert!(c.try_remove_word(b"CATS").is_none());
    }
}
