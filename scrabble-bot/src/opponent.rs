//! Opponent modelling — Shakespeare's "see into the heart of any human situation"
//! made literal at the table.
//!
//! The `match_participant` table is **public**, so each rival's `balance` and
//! `score` are readable directly. Their *racks* are private (`Holding` is private;
//! `my_rack` returns only ours), so we reconstruct them from the public
//! `AuctionResult` stream (who won which letter, and what they paid) minus the
//! public `WordPlay` stream (which letters they spent). From the inferred rack we
//! can estimate how much a contested tile is worth to them, which drives the
//! deprivation premium in the bidding policy.

use crate::rack::Counts;
use crate::tiles::{BAG_COUNTS, NLETTERS};

/// A single rival, as best we can reconstruct them from public information.
#[derive(Clone, Debug)]
pub struct OpponentModel {
    pub bot_id: u64,
    /// Inferred held tiles (won, minus spent in words).
    pub rack: Counts,
    /// Public spendable balance (or inferred when no public snapshot is fed in).
    pub balance: i64,
    /// Public ranking score (cumulative word reward).
    pub score: i64,
    pub words_played: u32,
}

impl OpponentModel {
    pub fn new(bot_id: u64, start_balance: i64) -> Self {
        Self {
            bot_id,
            rack: Counts::new(),
            balance: start_balance,
            score: 0,
            words_played: 0,
        }
    }

    pub fn won_letter(&mut self, idx: usize, paid: i64) {
        self.rack.add(idx);
        self.balance -= paid;
    }

    pub fn played_word(&mut self, word_ascii: &[u8], reward: i64) {
        if let Some(leave) = self.rack.try_remove_word(word_ascii) {
            self.rack = leave;
        }
        // If we can't subtract (our rack inference was incomplete), still credit
        // the reward — balance/score come from the public table anyway.
        self.balance += reward;
        self.score += reward;
        self.words_played += 1;
    }

    /// Overwrite balance/score with an authoritative public-table snapshot.
    pub fn set_public(&mut self, balance: i64, score: i64) {
        self.balance = balance;
        self.score = score;
    }
}

/// The whole table: every rival plus a per-letter remaining-supply estimate, so
/// the bot can price in tile scarcity.
pub struct TableModel {
    pub start_balance: i64,
    pub opponents: Vec<OpponentModel>,
    /// Tiles revealed as owned by anyone (us included) — used for supply tracking.
    pub seen: [u8; NLETTERS],
}

impl TableModel {
    pub fn new(start_balance: i64, opponent_ids: &[u64]) -> Self {
        Self {
            start_balance,
            opponents: opponent_ids
                .iter()
                .map(|&id| OpponentModel::new(id, start_balance))
                .collect(),
            seen: [0; NLETTERS],
        }
    }

    pub fn opponent_mut(&mut self, bot_id: u64) -> Option<&mut OpponentModel> {
        self.opponents.iter_mut().find(|o| o.bot_id == bot_id)
    }

    /// Record a resolved auction. `me` lets us skip self-bookkeeping (the bot
    /// tracks its own rack from the authoritative `my_rack` view).
    pub fn on_auction_won(&mut self, winner_bot_id: u64, idx: usize, paid: i64, me: u64) {
        if self.seen[idx] < u8::MAX {
            self.seen[idx] += 1;
        }
        if winner_bot_id != me {
            if let Some(o) = self.opponent_mut(winner_bot_id) {
                o.won_letter(idx, paid);
            }
        }
    }

    pub fn on_word_played(&mut self, bot_id: u64, word_ascii: &[u8], reward: i64, me: u64) {
        if bot_id != me {
            if let Some(o) = self.opponent_mut(bot_id) {
                o.played_word(word_ascii, reward);
            }
        }
    }

    /// Estimated copies of letter `idx` still unseen (a scarcity signal).
    pub fn remaining_supply(&self, idx: usize) -> i32 {
        BAG_COUNTS[idx] as i32 - self.seen[idx] as i32
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::tiles::letter_index;

    #[test]
    fn reconstructs_rival_rack_from_public_events() {
        let mut t = TableModel::new(100, &[7, 9]);
        let q = letter_index(b'Q').unwrap();
        let i = letter_index(b'I').unwrap();
        t.on_auction_won(7, q, 5, /*me*/ 1);
        t.on_auction_won(7, i, 2, 1);
        // Bot 7 now (inferred) holds Q, I and spent 7 from balance.
        let o = t.opponents.iter().find(|o| o.bot_id == 7).unwrap();
        assert_eq!(o.rack.get(q), 1);
        assert_eq!(o.rack.get(i), 1);
        assert_eq!(o.balance, 100 - 7);
        // They play QI (Q10 I1 = 11, len 2 -> 1x = 11): rack empties, score +11.
        t.on_word_played(7, b"QI", 11, 1);
        let o = t.opponents.iter().find(|o| o.bot_id == 7).unwrap();
        assert_eq!(o.rack.total, 0);
        assert_eq!(o.score, 11);
        assert_eq!(o.balance, 100 - 7 + 11);
        // Supply: one Q has been seen.
        assert_eq!(t.remaining_supply(q), BAG_COUNTS[q] as i32 - 1);
    }
}
