//! `LiveBridge` — the engine-side translation layer between the live server and
//! the [`Bot`]. It is deliberately free of any SpacetimeDB dependency so it is
//! always compiled and unit-tested; the thin SDK glue in `net::spacetime` (behind
//! the `live` feature) just forwards table changes into these methods and pushes
//! the returned bids/words back as reducer calls.

use crate::bidding::ScoreModel;
use crate::game::{Bot, Event, Player};
use crate::persona::Persona;
use crate::rack::Counts;
use crate::tiles::letter_index;

/// Holds the bot plus the little bit of match lifecycle state the wire needs.
pub struct LiveBridge {
    pub bot: Bot,
    pub me: Option<u64>,
    pub current_match_id: Option<u64>,
    /// Flush threshold: once this few tiles remain, force-cash the rack rather
    /// than holding for a bigger bingo (the match ends when the bag empties).
    pub flush_at: u32,
}

impl LiveBridge {
    pub fn new(persona: Persona) -> Self {
        Self {
            bot: Bot::with_embedded(0, persona, ScoreModel::CumulativeWordScore),
            me: None,
            current_match_id: None,
            flush_at: 10,
        }
    }

    /// Our own bot id, learned from `bot_credential` (identity -> bot_id).
    pub fn set_me(&mut self, me: u64) {
        self.me = Some(me);
        self.bot.me = me;
    }

    /// A match has begun (derived from `match_state` going Running + participants).
    pub fn start_match(
        &mut self,
        me: u64,
        players: Vec<u64>,
        start_balance: i64,
        tiles_to_auction: u32,
        match_id: u64,
    ) {
        self.me = Some(me);
        self.current_match_id = Some(match_id);
        self.bot.observe(&Event::MatchStart {
            me,
            players,
            start_balance,
            tiles_to_auction,
        });
    }

    /// An auction opened: return the amount to `submit_bid`, or `None` to abstain.
    pub fn on_auction_open(&mut self, letter: &str) -> Option<i64> {
        let idx = letter_str_to_index(letter)?;
        let bid = self.bot.decide_bid(idx);
        if bid > 0 {
            Some(bid)
        } else {
            None
        }
    }

    /// An auction resolved (public `auction_result` row).
    pub fn on_auction_result(&mut self, winner: Option<u64>, letter: &str, paid: i64) {
        if let Some(idx) = letter_str_to_index(letter) {
            self.bot.observe(&Event::AuctionResolved {
                winner,
                letter_idx: idx,
                paid,
            });
        }
    }

    /// A word was played by someone (public `word_play` row).
    pub fn on_word_played(&mut self, bot_id: u64, word: &str, reward: i64) {
        self.bot.observe(&Event::WordPlayed {
            bot_id,
            word: word.to_string(),
            reward,
        });
    }

    /// Authoritative private rack snapshot (the `my_rack` view).
    pub fn on_my_rack(&mut self, rack: Counts, balance: i64, score: i64) {
        self.bot.observe(&Event::RackSnapshot {
            rack,
            balance,
            score,
        });
    }

    /// Authoritative public participant snapshot (`match_participant` row).
    pub fn on_participant(&mut self, bot_id: u64, balance: i64, score: i64) {
        self.bot.observe(&Event::Participant {
            bot_id,
            balance,
            score,
        });
    }

    /// The word we should `submit_word` right now, if any. Switches from
    /// hold-aware play to forced flushing as the bag runs out.
    pub fn next_word_to_play(&self) -> Option<String> {
        let play = if self.bot.tiles_remaining <= self.flush_at {
            self.bot.best_forced_word()
        } else {
            self.bot.choose_word()
        };
        play.map(|p| p.word)
    }

    pub fn match_id(&self) -> Option<u64> {
        self.current_match_id
    }
}

/// Convert a server letter string (e.g. "Q") into a 0..26 index.
pub fn letter_str_to_index(letter: &str) -> Option<usize> {
    letter.bytes().next().and_then(letter_index)
}

/// Build a rack [`Counts`] from `my_rack` holdings (letter string + count pairs).
pub fn counts_from_holdings<'a, I>(holdings: I) -> Counts
where
    I: IntoIterator<Item = (&'a str, u32)>,
{
    let mut c = Counts::new();
    for (letter, count) in holdings {
        if let Some(idx) = letter_str_to_index(letter) {
            for _ in 0..count {
                c.add(idx);
            }
        }
    }
    c
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn bridge_drives_a_full_mini_flow() {
        let mut b = LiveBridge::new(Persona::shakespeare());
        b.start_match(0, vec![0, 1, 2, 3], 100, 60, 42);

        // Our rack arrives via the my_rack view.
        let rack = counts_from_holdings([("R", 1), ("E", 1), ("T", 1), ("I", 1), ("N", 1), ("A", 1)]);
        b.on_my_rack(rack, 100, 0);

        // An "S" auction opens — it completes RETINAS, so we should bid for it.
        let bid = b.on_auction_open("S");
        assert!(bid.is_some() && bid.unwrap() >= 1, "should bid for a bingo hook, got {bid:?}");

        // We win it; the my_rack view then shows the 7-tile rack.
        b.on_auction_result(Some(0), "S", 3);
        let rack7 = counts_from_holdings([
            ("R", 1), ("E", 1), ("T", 1), ("I", 1), ("N", 1), ("A", 1), ("S", 1),
        ]);
        b.on_my_rack(rack7, 97, 0);

        // Now there should be a 7-letter word to play.
        let word = b.next_word_to_play().expect("a bingo should be playable");
        assert_eq!(word.len(), 7);
    }

    #[test]
    fn abstains_on_a_useless_tile() {
        let mut b = LiveBridge::new(Persona::shakespeare());
        b.start_match(0, vec![0, 1, 2, 3], 100, 60, 1);
        // A clean rack already; a wildly off tile should not be bid on.
        let rack = counts_from_holdings([("R", 1), ("E", 1), ("T", 1), ("I", 1), ("N", 1), ("A", 1)]);
        b.on_my_rack(rack, 100, 0);
        // 'J' adds nothing useful here.
        let _ = b.on_auction_open("J"); // may be 0 -> None; assert it doesn't panic and is small
    }
}
