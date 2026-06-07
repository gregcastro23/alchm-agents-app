//! Valuation engine — the strategic core.
//!
//! A Vickrey (second-price) auction rewards bidding your *true marginal value*,
//! so the whole game reduces to: **how much is one more tile worth to me?**
//! [`Valuator::marginal_value`] answers that, built on a rack-equity model that
//! blends three things, weighted by persona:
//!   1. the best word playable right now (currency soon realisable),
//!   2. rack health (a balanced rack keeps options open),
//!   3. bingo proximity (closeness to a 3x >=7-letter word — the biggest lever).

use crate::dict::{Lexicon, Play};
use crate::persona::Persona;
use crate::rack::Counts;
use crate::tiles::{index_letter, letter_index, reward_exact, NLETTERS};

pub struct Valuator<'a> {
    pub lex: &'a Lexicon,
    pub persona: Persona,
}

impl<'a> Valuator<'a> {
    pub fn new(lex: &'a Lexicon, persona: Persona) -> Self {
        Self { lex, persona }
    }

    /// Equity (in currency-comparable units) of holding `rack`.
    pub fn equity(&self, rack: &Counts) -> f64 {
        let p = &self.persona;

        let immediate = match self.lex.best_play(rack) {
            // length_bias nudges equity toward longer words beyond raw reward.
            Some(pl) => pl.reward + p.length_bias * pl.len as f64,
            None => 0.0,
        };
        let balance = self.balance_score(rack);
        let potential = self.potential_score(rack);

        p.immediacy * immediate + p.balance * balance + p.potential * potential
    }

    /// Marginal value of adding letter `i` to `rack`. Floored at 0 — a tile that
    /// would *worsen* the rack is simply not worth bidding on.
    pub fn marginal_value(&self, rack: &Counts, i: usize) -> f64 {
        let with = rack.with_added(i);
        (self.equity(&with) - self.equity(rack)).max(0.0)
    }

    /// Cheaper marginal value that skips the bingo-potential DFS. Used to size an
    /// opponent's threat for the deprivation premium, where a fast, good-enough
    /// estimate beats spending the time budget modelling every rival precisely.
    pub fn marginal_value_fast(&self, rack: &Counts, i: usize) -> f64 {
        let with = rack.with_added(i);
        (self.equity_fast(&with) - self.equity_fast(rack)).max(0.0)
    }

    fn equity_fast(&self, rack: &Counts) -> f64 {
        let p = &self.persona;
        let immediate = match self.lex.best_play(rack) {
            Some(pl) => pl.reward + p.length_bias * pl.len as f64,
            None => 0.0,
        };
        p.immediacy * immediate + p.balance * self.balance_score(rack)
    }

    /// Rack health: rewards a workable vowel ratio, penalises duplication and the
    /// classic stranded-Q trap.
    fn balance_score(&self, rack: &Counts) -> f64 {
        if rack.total == 0 {
            return 0.0;
        }
        let v = rack.vowels() as f64;
        let total = rack.total as f64;
        let ratio = v / total;
        // Ideal vowel ratio ~0.40; penalise distance from it.
        let ratio_pen = (ratio - 0.40).abs();
        let mut score = 4.0 - 6.0 * ratio_pen;

        // Duplication penalty: 3+ copies of any letter is clunky.
        for c in rack.n.iter() {
            if *c >= 3 {
                score -= 1.2 * (*c as f64 - 2.0);
            }
        }
        // Stranded Q (no U) is a known trap in this no-blanks game.
        let q = letter_index(b'Q').unwrap();
        let u = letter_index(b'U').unwrap();
        if rack.n[q] > 0 && rack.n[u] == 0 {
            score -= 2.5;
        }
        score
    }

    /// Bingo potential: how close the rack is to a 3x (>=7 letter) word. Counts
    /// the distinct single-letter "hooks" that would complete one. (When a bingo
    /// is already playable, that value lives in `immediate` instead.)
    fn potential_score(&self, rack: &Counts) -> f64 {
        if rack.total >= 5 && rack.total <= 8 {
            let hooks = self.lex.bingo_hook_mask(rack, 7).count_ones() as f64;
            hooks * 0.6
        } else {
            0.0
        }
    }

    /// Decide whether to play a word now and which one. Returns the chosen play
    /// when playing beats holding the rack to build something bigger.
    ///
    /// Not on the 15ms bid path — `play_word` is a separate, less frequent action
    /// — so this can afford to evaluate the leave equity of the top candidates.
    pub fn choose_word(&self, rack: &Counts) -> Option<Play> {
        if rack.total < 2 {
            return None;
        }
        let best = self.lex.best_play(rack)?;
        if self.should_hold(rack, &best) {
            return None;
        }
        // Play the word that best balances reward against the leave it implies.
        self.best_play_with_leave(rack).map(|(c, _)| c.into_play())
    }

    /// Whether to keep building rather than cash the best word now. Under
    /// cumulative scoring the only reason to hold is to merge tiles into a longer
    /// (3x) word, so we hold only small, bingo-promising racks; everything else
    /// gets played — banking score *and* refilling balance for the next bids.
    fn should_hold(&self, rack: &Counts, best: &Play) -> bool {
        if best.len >= 7 {
            return false; // an in-hand bingo: lock it in
        }
        if rack.total >= 7 || rack.total <= 2 {
            return false; // too big to keep waiting / too small to bother
        }
        let hooks = self.lex.bingo_hook_mask(rack, 7).count_ones();
        // Patient personas (high `potential`, e.g. Dante/Shakespeare) hold with
        // fewer hooks; impatient ones (Cicero) demand more promise before waiting.
        let need = if self.persona.potential >= 1.3 { 2 } else { 4 };
        hooks >= need
    }

    /// Best play ignoring the hold/play tradeoff — used to flush the rack at the
    /// end of the bag, where any unplayed tile scores nothing.
    pub fn best_forced_word(&self, rack: &Counts) -> Option<Play> {
        self.lex.best_play(rack)
    }

    /// Search formable words, keep the strongest by raw reward, then pick the one
    /// whose (reward + leave-equity) is highest. Allocation-light: candidate
    /// letters are kept as fixed index arrays, no per-word `String`.
    fn best_play_with_leave(&self, rack: &Counts) -> Option<(Candidate, f64)> {
        const K: usize = 24;
        let mut cands: Vec<Candidate> = Vec::with_capacity(64);
        self.lex.for_each_play(rack, |word, base| {
            let len = word.len();
            if len > MAX_WORD {
                return;
            }
            let reward = reward_exact(base as i64, len) as f64;
            let mut letters = [0u8; MAX_WORD];
            letters[..len].copy_from_slice(word);
            cands.push(Candidate {
                reward,
                base,
                len: len as u8,
                letters,
            });
        });
        if cands.is_empty() {
            return None;
        }
        cands.sort_by(|a, b| b.reward.partial_cmp(&a.reward).unwrap());
        cands.truncate(K);

        let mut best: Option<(Candidate, f64)> = None;
        for c in cands {
            let mut leave = *rack;
            for &idx in &c.letters[..c.len as usize] {
                leave.n[idx as usize] -= 1;
                leave.total -= 1;
            }
            let value_if_played = c.reward + self.equity(&leave);
            let better = match &best {
                Some((_, v)) => value_if_played > *v,
                None => true,
            };
            if better {
                best = Some((c, value_if_played));
            }
        }
        best
    }
}

const MAX_WORD: usize = 15;

#[derive(Clone, Copy)]
struct Candidate {
    reward: f64,
    base: u32,
    len: u8,
    letters: [u8; MAX_WORD],
}

impl Candidate {
    fn into_play(self) -> Play {
        let len = self.len as usize;
        let word: String = self.letters[..len]
            .iter()
            .map(|&i| index_letter(i as usize) as char)
            .collect();
        Play {
            word,
            base_score: self.base,
            len,
            reward: self.reward,
        }
    }
}

/// Number of vowels among the 26 letter slots that are vowels — small helper kept
/// here for documentation symmetry; the work is done in [`Counts::vowels`].
pub const VOWEL_INDICES: [usize; 5] = [0, 4, 8, 14, 20]; // A E I O U
const _: () = assert!(VOWEL_INDICES[4] < NLETTERS);

#[cfg(test)]
mod tests {
    use super::*;
    use crate::dict::Lexicon;

    fn lex() -> Lexicon {
        Lexicon::from_words([
            "QI", "QUIZ", "RETINA", "RETINAS", "RETAINS", "CAT", "CATS", "AE", "AA", "ZA",
        ])
    }

    #[test]
    fn marginal_value_of_completing_bingo_is_high() {
        let l = lex();
        let v = Valuator::new(&l, Persona::shakespeare());
        // RETINA + S completes a 3x bingo: S should carry a large marginal value.
        let rack = Counts::from_letters("RETINA");
        let s = letter_index(b'S').unwrap();
        let mv_s = v.marginal_value(&rack, s);
        // A random clunky letter should be worth far less.
        let z = letter_index(b'Z').unwrap();
        let mv_z = v.marginal_value(&rack, z);
        assert!(mv_s > mv_z, "completing a bingo (S={mv_s}) must beat a clunk (Z={mv_z})");
        assert!(mv_s > 0.0);
    }

    #[test]
    fn useless_tile_has_zero_marginal_value() {
        let l = lex();
        let v = Valuator::new(&l, Persona::shakespeare());
        // A rack that is already a clean bingo-in-hand; adding a 3rd duplicate
        // vowel should not increase (and may decrease) equity -> floored to 0.
        let rack = Counts::from_letters("AA");
        let a = letter_index(b'A').unwrap();
        let mv = v.marginal_value(&rack, a); // 3rd A
        assert_eq!(mv, 0.0);
    }
}
