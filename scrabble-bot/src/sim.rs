//! Local self-play arena that mirrors the ScrabbleBot ruleset faithfully enough
//! to (a) prove the engine works end-to-end and (b) tune personas by self-play —
//! all without the live server or credentials.
//!
//! Modelled rules (verbatim from the module): start balance 100, starting rack 5
//! tiles, 98-tile bag (no blanks), Vickrey pricing with reserve 1, ties to the
//! earliest bidder, word reward = `base * num / denom`, **winner = highest
//! cumulative `score`**. It also fields [`NaiveBot`], a faithful clone of the
//! official `bot-starter/src/strategy.ts`, so The Bard can be measured against
//! the baseline everyone else starts from.

use std::collections::BTreeMap;
use std::sync::Arc;

use crate::bidding::ScoreModel;
use crate::dict::{Lexicon, Play};
use crate::game::{Bot, Event, Player};
use crate::persona::Persona;
use crate::rack::Counts;
use crate::tiles::{index_letter, reward_exact, value_of, BAG_COUNTS, BAG_TOTAL, NLETTERS};

/// Auction pricing rule.
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum AuctionType {
    Vickrey,
    FirstPrice,
}

/// A small, fast, deterministic PRNG (xorshift64*). Public so the benchmark can
/// reuse it.
pub struct Rng(u64);

impl Rng {
    pub fn new(seed: u64) -> Self {
        Rng((seed ^ 0x9E37_79B9_7F4A_7C15) | 1)
    }
    pub fn next_u64(&mut self) -> u64 {
        let mut x = self.0;
        x ^= x >> 12;
        x ^= x << 25;
        x ^= x >> 27;
        self.0 = x;
        x.wrapping_mul(0x2545_F491_4F6C_DD1D)
    }
    pub fn below(&mut self, n: u64) -> u64 {
        self.next_u64() % n
    }
}

fn draw(bag: &mut Counts, rng: &mut Rng) -> Option<usize> {
    if bag.total == 0 {
        return None;
    }
    let mut r = rng.below(bag.total as u64) as i64;
    for i in 0..NLETTERS {
        r -= bag.n[i] as i64;
        if r < 0 {
            bag.remove(i);
            return Some(i);
        }
    }
    None
}

/// Final standing of one participant in a match.
#[derive(Clone, Debug)]
pub struct Standing {
    pub bot_id: u64,
    pub persona: String,
    pub score: i64,
    pub balance: i64,
    pub words: u32,
}

/// Run a single match to completion and return standings sorted by score (desc).
pub fn run_match(
    mut players: Vec<Box<dyn Player>>,
    auction_type: AuctionType,
    seed: u64,
) -> Vec<Standing> {
    let n = players.len();
    const RESERVE: i64 = 1;
    const START_BALANCE: i64 = 100;
    const STARTING_RACK: u32 = 5;

    let mut rng = Rng::new(seed);
    let mut bag = Counts {
        n: BAG_COUNTS,
        total: BAG_TOTAL as u16,
    };
    let ids: Vec<u64> = (0..n as u64).collect();

    // Deal starting racks privately (opponents never learn these — realistic).
    let mut start_racks = vec![Counts::new(); n];
    for _ in 0..STARTING_RACK {
        for r in start_racks.iter_mut() {
            if let Some(idx) = draw(&mut bag, &mut rng) {
                r.add(idx);
            }
        }
    }
    let tiles_to_auction = bag.total as u32;

    for (i, p) in players.iter_mut().enumerate() {
        p.observe(&Event::MatchStart {
            me: i as u64,
            players: ids.clone(),
            start_balance: START_BALANCE,
            tiles_to_auction,
        });
        p.observe(&Event::RackSnapshot {
            rack: start_racks[i],
            balance: START_BALANCE,
            score: 0,
        });
    }

    let mut auction_id = 0u64;
    while let Some(letter_idx) = draw(&mut bag, &mut rng) {
        auction_id += 1;

        // Sealed bids.
        let mut order: Vec<(usize, i64)> = Vec::with_capacity(n);
        for (i, p) in players.iter().enumerate() {
            let amt = p.decide_bid(letter_idx);
            if amt >= RESERVE {
                order.push((i, amt));
            }
        }
        // Highest wins; ties to the earliest (lowest index, mirroring lowest id).
        order.sort_by(|a, b| b.1.cmp(&a.1).then(a.0.cmp(&b.0)));
        let (winner, paid) = if order.is_empty() {
            (None, 0)
        } else {
            let (w, top) = order[0];
            let paid = match auction_type {
                AuctionType::FirstPrice => top,
                AuctionType::Vickrey => {
                    if order.len() >= 2 {
                        order[1].1.max(RESERVE)
                    } else {
                        RESERVE
                    }
                }
            };
            (Some(w as u64), paid)
        };

        let ev = Event::AuctionResolved {
            winner,
            letter_idx,
            paid,
        };
        for p in players.iter_mut() {
            p.observe(&ev);
        }

        // Each player may cash one word this round (hold/play decided internally).
        for i in 0..n {
            if let Some(play) = players[i].choose_word() {
                let ev = Event::WordPlayed {
                    bot_id: i as u64,
                    reward: play.reward as i64,
                    word: play.word,
                };
                for p in players.iter_mut() {
                    p.observe(&ev);
                }
            }
        }
        let _ = auction_id;
    }

    // End of bag: force-flush remaining racks — any unplayed tile scores nothing.
    let mut guard = 0;
    loop {
        let mut progress = false;
        for i in 0..n {
            if let Some(play) = players[i].best_forced_word() {
                let ev = Event::WordPlayed {
                    bot_id: i as u64,
                    reward: play.reward as i64,
                    word: play.word,
                };
                for p in players.iter_mut() {
                    p.observe(&ev);
                }
                progress = true;
            }
        }
        guard += 1;
        if !progress || guard > 100 {
            break;
        }
    }

    let mut standings: Vec<Standing> = players
        .iter()
        .map(|p| Standing {
            bot_id: p.id(),
            persona: p.name().to_string(),
            score: p.score(),
            balance: p.balance(),
            words: p.words(),
        })
        .collect();
    standings.sort_by(|a, b| b.score.cmp(&a.score));
    standings
}

/// Aggregated tournament result for one persona (or "Naive" as a class).
#[derive(Clone, Debug)]
pub struct TourneyResult {
    pub name: String,
    pub matches: u32,
    pub wins: u32,
    pub total_score: i64,
    pub sum_rank: u64,
}

impl TourneyResult {
    pub fn win_rate(&self) -> f64 {
        if self.matches == 0 {
            0.0
        } else {
            self.wins as f64 / self.matches as f64
        }
    }
    pub fn avg_score(&self) -> f64 {
        if self.matches == 0 {
            0.0
        } else {
            self.total_score as f64 / self.matches as f64
        }
    }
    pub fn avg_rank(&self) -> f64 {
        if self.matches == 0 {
            0.0
        } else {
            self.sum_rank as f64 / self.matches as f64
        }
    }
}

/// Run `matches` matches of `bard_roster` (each as a Bard `Bot`) plus `n_naive`
/// faithful starter clones, and aggregate by persona name.
pub fn run_tournament(
    bard_roster: &[Persona],
    n_naive: usize,
    matches: u32,
    seed: u64,
    lex: Arc<Lexicon>,
) -> Vec<TourneyResult> {
    let mut agg: BTreeMap<String, TourneyResult> = BTreeMap::new();

    for m in 0..matches {
        let mut players: Vec<Box<dyn Player>> = Vec::new();
        for (i, &persona) in bard_roster.iter().enumerate() {
            players.push(Box::new(Bot::new(
                i as u64,
                persona,
                ScoreModel::default(),
                lex.clone(),
            )));
        }
        let mut idx = bard_roster.len();
        for _ in 0..n_naive {
            players.push(Box::new(NaiveBot::new(idx as u64, lex.clone())));
            idx += 1;
        }

        let match_seed = seed.wrapping_add((m as u64).wrapping_mul(0x9E37_79B9_7F4A_7C15));
        let standings = run_match(players, AuctionType::Vickrey, match_seed);

        for (rank, s) in standings.iter().enumerate() {
            let e = agg.entry(s.persona.clone()).or_insert_with(|| TourneyResult {
                name: s.persona.clone(),
                matches: 0,
                wins: 0,
                total_score: 0,
                sum_rank: 0,
            });
            e.matches += 1;
            if rank == 0 {
                e.wins += 1;
            }
            e.total_score += s.score;
            e.sum_rank += rank as u64;
        }
    }

    let mut v: Vec<TourneyResult> = agg.into_values().collect();
    v.sort_by(|a, b| {
        b.wins
            .cmp(&a.wins)
            .then(b.total_score.cmp(&a.total_score))
    });
    v
}

// ---------------------------------------------------------------------------
// NaiveBot — a faithful clone of bot-starter/src/strategy.ts (the baseline).
// ---------------------------------------------------------------------------

/// Faithful reimplementation of the official starter strategy:
///   * `decideBid`: want = (held? max(1,value) : value+2), clamped to balance.
///   * `chooseWord`: play the single longest formable word, every chance it gets.
pub struct NaiveBot {
    me: u64,
    lex: Arc<Lexicon>,
    rack: Counts,
    balance: i64,
    score: i64,
    words: u32,
}

impl NaiveBot {
    pub fn new(me: u64, lex: Arc<Lexicon>) -> Self {
        Self {
            me,
            lex,
            rack: Counts::new(),
            balance: 0,
            score: 0,
            words: 0,
        }
    }

    fn longest_word(&self) -> Option<Play> {
        let mut best: Option<(u32, usize, [u8; 15])> = None;
        let mut best_len = 1usize; // min word length is 2
        self.lex.for_each_play(&self.rack, |word, base| {
            let len = word.len();
            if len > best_len && len <= 15 {
                best_len = len;
                let mut l = [0u8; 15];
                l[..len].copy_from_slice(word);
                best = Some((base, len, l));
            }
        });
        best.map(|(base, len, l)| {
            let word: String = l[..len].iter().map(|&i| index_letter(i as usize) as char).collect();
            Play {
                word,
                base_score: base,
                len,
                reward: reward_exact(base as i64, len) as f64,
            }
        })
    }
}

impl Player for NaiveBot {
    fn observe(&mut self, ev: &Event) {
        match ev {
            Event::MatchStart { me, start_balance, .. } => {
                self.me = *me;
                self.balance = *start_balance;
                self.score = 0;
                self.words = 0;
                self.rack = Counts::new();
            }
            Event::RackSnapshot { rack, balance, score } => {
                self.rack = *rack;
                self.balance = *balance;
                self.score = *score;
            }
            Event::AuctionResolved { winner, letter_idx, paid } => {
                if *winner == Some(self.me) {
                    self.rack.add(*letter_idx);
                    self.balance -= *paid;
                }
            }
            Event::WordPlayed { bot_id, word, reward } => {
                if *bot_id == self.me {
                    if let Some(leave) = self.rack.try_remove_word(word.as_bytes()) {
                        self.rack = leave;
                    }
                    self.balance += *reward;
                    self.score += *reward;
                    self.words += 1;
                }
            }
            Event::Participant { bot_id, balance, score } => {
                if *bot_id == self.me {
                    self.balance = *balance;
                    self.score = *score;
                }
            }
            Event::AuctionOpen { .. } | Event::MatchEnd => {}
        }
    }

    fn decide_bid(&self, letter_idx: usize) -> i64 {
        let value = value_of(letter_idx) as i64;
        let have = self.rack.get(letter_idx);
        let want = if have == 0 { value + 2 } else { value.max(1) };
        want.min(self.balance.max(0))
    }

    fn choose_word(&self) -> Option<Play> {
        self.longest_word()
    }

    fn best_forced_word(&self) -> Option<Play> {
        self.longest_word()
    }

    fn id(&self) -> u64 {
        self.me
    }
    fn name(&self) -> &str {
        "Naive (starter)"
    }
    fn score(&self) -> i64 {
        self.score
    }
    fn balance(&self) -> i64 {
        self.balance
    }
    fn words(&self) -> u32 {
        self.words
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn a_match_runs_and_produces_a_ranked_winner() {
        let lex = Arc::new(Lexicon::load_embedded());
        let players: Vec<Box<dyn Player>> = vec![
            Box::new(Bot::new(0, Persona::shakespeare(), ScoreModel::default(), lex.clone())),
            Box::new(NaiveBot::new(1, lex.clone())),
            Box::new(NaiveBot::new(2, lex.clone())),
            Box::new(NaiveBot::new(3, lex.clone())),
        ];
        let standings = run_match(players, AuctionType::Vickrey, 12345);
        assert_eq!(standings.len(), 4);
        // Scores are sorted descending and everyone played at least something.
        assert!(standings[0].score >= standings[3].score);
        let total_words: u32 = standings.iter().map(|s| s.words).sum();
        assert!(total_words > 0, "somebody should have played a word");
    }
}
