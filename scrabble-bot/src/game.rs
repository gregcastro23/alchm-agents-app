//! Game state machine. A [`Bot`] consumes a stream of [`Event`]s (fed by either
//! the local simulator or the live SpacetimeDB adapter), maintains its private
//! rack + balance + score and its model of the table, and answers two questions:
//! how much to bid for the tile up for auction, and which word (if any) to play.
//!
//! The [`Player`] trait is the seam the simulator drives, so The Bard can be
//! pitted against faithful clones of the official starter strategy.

use std::sync::Arc;

use crate::bidding::{self, BidContext, ScoreModel};
use crate::dict::{Lexicon, Play};
use crate::opponent::TableModel;
use crate::persona::Persona;
use crate::rack::Counts;
use crate::valuation::Valuator;

/// Everything that can happen at the table, normalised away from the wire format.
#[derive(Clone, Debug)]
pub enum Event {
    /// A match begins. `players` is every bot id (including `me`).
    MatchStart {
        me: u64,
        players: Vec<u64>,
        start_balance: i64,
        tiles_to_auction: u32,
    },
    /// A tile is up for auction. (State-wise a no-op; the bid is requested via
    /// [`Player::decide_bid`].) Kept for completeness / logging.
    AuctionOpen { auction_id: u64, letter_idx: usize },
    /// An auction closed. `winner` is `None` if nobody bid the reserve.
    AuctionResolved {
        winner: Option<u64>,
        letter_idx: usize,
        paid: i64,
    },
    /// A word was played by `bot_id` for `reward` points.
    WordPlayed {
        bot_id: u64,
        word: String,
        reward: i64,
    },
    /// Authoritative public snapshot of a participant's balance/score.
    Participant {
        bot_id: u64,
        balance: i64,
        score: i64,
    },
    /// Authoritative private snapshot of *our* rack (from the `my_rack` view).
    RackSnapshot {
        rack: Counts,
        balance: i64,
        score: i64,
    },
    MatchEnd,
}

/// The seam the simulator and live runner drive.
pub trait Player {
    fn observe(&mut self, ev: &Event);
    fn decide_bid(&self, letter_idx: usize) -> i64;
    fn choose_word(&self) -> Option<Play>;
    /// Best word ignoring hold/play tradeoff — for the end-of-bag flush.
    fn best_forced_word(&self) -> Option<Play>;
    fn id(&self) -> u64;
    fn name(&self) -> &str;
    fn score(&self) -> i64;
    fn balance(&self) -> i64;
    fn words(&self) -> u32;
}

/// The Bard — the full engine bot.
pub struct Bot {
    pub me: u64,
    pub persona: Persona,
    pub lex: Arc<Lexicon>,
    pub score_model: ScoreModel,
    pub reserve: i64,

    pub my_rack: Counts,
    pub my_balance: i64,
    pub my_score: i64,
    pub my_words: u32,
    pub start_balance: i64,
    pub tiles_remaining: u32,
    pub table: TableModel,
}

impl Bot {
    pub fn new(me: u64, persona: Persona, score_model: ScoreModel, lex: Arc<Lexicon>) -> Self {
        Self {
            me,
            persona,
            lex,
            score_model,
            reserve: 1,
            my_rack: Counts::new(),
            my_balance: 0,
            my_score: 0,
            my_words: 0,
            start_balance: 0,
            tiles_remaining: 0,
            table: TableModel::new(0, &[]),
        }
    }

    /// Convenience constructor that builds its own embedded lexicon.
    pub fn with_embedded(me: u64, persona: Persona, score_model: ScoreModel) -> Self {
        Self::new(me, persona, score_model, Arc::new(Lexicon::load_embedded()))
    }

    fn valuator(&self) -> Valuator<'_> {
        Valuator::new(self.lex.as_ref(), self.persona)
    }
}

impl Player for Bot {
    fn observe(&mut self, ev: &Event) {
        match ev {
            Event::MatchStart {
                me,
                players,
                start_balance,
                tiles_to_auction,
            } => {
                self.me = *me;
                self.start_balance = *start_balance;
                self.my_balance = *start_balance;
                self.my_score = 0;
                self.my_words = 0;
                self.my_rack = Counts::new();
                self.tiles_remaining = *tiles_to_auction;
                let opp_ids: Vec<u64> = players.iter().copied().filter(|&p| p != *me).collect();
                self.table = TableModel::new(*start_balance, &opp_ids);
            }
            Event::AuctionOpen { .. } => {}
            Event::AuctionResolved {
                winner,
                letter_idx,
                paid,
            } => {
                if self.tiles_remaining > 0 {
                    self.tiles_remaining -= 1;
                }
                if let Some(w) = winner {
                    self.table.on_auction_won(*w, *letter_idx, *paid, self.me);
                    if *w == self.me {
                        self.my_rack.add(*letter_idx);
                        self.my_balance -= *paid;
                    }
                }
            }
            Event::WordPlayed {
                bot_id,
                word,
                reward,
            } => {
                let bytes = word.as_bytes();
                self.table.on_word_played(*bot_id, bytes, *reward, self.me);
                if *bot_id == self.me {
                    if let Some(leave) = self.my_rack.try_remove_word(bytes) {
                        self.my_rack = leave;
                    }
                    self.my_balance += *reward;
                    self.my_score += *reward;
                    self.my_words += 1;
                }
            }
            Event::Participant {
                bot_id,
                balance,
                score,
            } => {
                if *bot_id == self.me {
                    self.my_balance = *balance;
                    self.my_score = *score;
                } else if let Some(o) = self.table.opponent_mut(*bot_id) {
                    o.set_public(*balance, *score);
                }
            }
            Event::RackSnapshot {
                rack,
                balance,
                score,
            } => {
                self.my_rack = *rack;
                self.my_balance = *balance;
                self.my_score = *score;
            }
            Event::MatchEnd => {}
        }
    }

    fn decide_bid(&self, letter_idx: usize) -> i64 {
        let valuator = self.valuator();
        let ctx = BidContext {
            valuator: &valuator,
            rack: &self.my_rack,
            letter_idx,
            my_balance: self.my_balance,
            reserve: self.reserve,
            opponents: &self.table.opponents,
            tiles_remaining: self.tiles_remaining,
            score_model: self.score_model,
        };
        bidding::decide_bid(&ctx)
    }

    fn choose_word(&self) -> Option<Play> {
        self.valuator().choose_word(&self.my_rack)
    }

    fn best_forced_word(&self) -> Option<Play> {
        self.valuator().best_forced_word(&self.my_rack)
    }

    fn id(&self) -> u64 {
        self.me
    }
    fn name(&self) -> &str {
        self.persona.name
    }
    fn score(&self) -> i64 {
        self.my_score
    }
    fn balance(&self) -> i64 {
        self.my_balance
    }
    fn words(&self) -> u32 {
        self.my_words
    }
}
