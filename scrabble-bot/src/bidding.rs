//! Bidding policy.
//!
//! The auction is **Vickrey** (second-price) by default, where bidding your true
//! marginal value is the dominant strategy. The subtlety unique to ScrabbleBot:
//! the win metric is **cumulative word `score`**, not leftover `balance` (verified
//! from the module — `MatchParticipant.score` is what gets ranked). Every word
//! played adds its reward to *both* score and balance, so balance is a **renewable
//! budget**: we spend to acquire scoring letters and guard only enough liquidity
//! to keep bidding. Near the end of the bag, leftover balance is worthless, so we
//! spend it down on anything that still adds score.

use crate::opponent::OpponentModel;
use crate::rack::Counts;
use crate::valuation::Valuator;

/// Which quantity decides the winner — controls endgame and thrift behaviour.
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum ScoreModel {
    /// Win metric = cumulative reward of words played (the real ScrabbleBot rule).
    /// Balance is renewable; spend to score, keep liquidity, dump near the end.
    CumulativeWordScore,
    /// Win metric = final balance (alternate rule). Spend only when ROI-positive.
    FinalBalance,
}

impl Default for ScoreModel {
    fn default() -> Self {
        ScoreModel::CumulativeWordScore
    }
}

/// Everything the policy needs for one auction. Borrows only — no allocation.
pub struct BidContext<'a> {
    pub valuator: &'a Valuator<'a>,
    pub rack: &'a Counts,
    pub letter_idx: usize,
    pub my_balance: i64,
    /// Auction reserve (1 in ScrabbleBot) — minimum a winner pays.
    pub reserve: i64,
    pub opponents: &'a [OpponentModel],
    /// Tiles still to be auctioned — drives endgame awareness.
    pub tiles_remaining: u32,
    pub score_model: ScoreModel,
}

/// Decide our bid (in balance units) for the tile currently up for auction.
pub fn decide_bid(ctx: &BidContext) -> i64 {
    let p = &ctx.valuator.persona;

    // 1) Truthful Vickrey core: marginal value of this tile to us (score units).
    let mut value = ctx.valuator.marginal_value(ctx.rack, ctx.letter_idx);

    // 2) Persona confidence on our own valuation.
    value *= p.aggression;

    // 3) Deprivation: a capped premium to deny a tile worth more to a rival than
    //    to us (Voltaire leans hard on this; Shakespeare only modestly).
    if p.deprivation > 0.0 && !ctx.opponents.is_empty() {
        let mut best_opp = 0.0f64;
        for opp in ctx.opponents {
            let omv = ctx.valuator.marginal_value_fast(&opp.rack, ctx.letter_idx);
            if omv > best_opp {
                best_opp = omv;
            }
        }
        if best_opp > value {
            value += p.deprivation * p.insight * (best_opp - value);
        }
    }

    if value <= 0.0 {
        return 0; // never bid on a tile that doesn't help us (or hurt a rival).
    }

    // 4) Budget / liquidity shaping.
    let endgame = ctx.tiles_remaining <= 12;
    let mut bid = value;
    match ctx.score_model {
        ScoreModel::CumulativeWordScore => {
            if endgame {
                // Leftover balance can't be scored: spend freely on scoring tiles.
                bid = bid.max(ctx.my_balance as f64 * 0.5);
            } else {
                // Balance recovers when we play words, so thrift is a *light*
                // liquidity guard, not a brake on scoring.
                let pressure = liquidity_pressure(ctx.my_balance);
                bid *= 1.0 - 0.5 * p.thrift * pressure;
            }
        }
        ScoreModel::FinalBalance => {
            // Balance is the prize: never overpay; conserve hard when thin.
            let pressure = liquidity_pressure(ctx.my_balance);
            bid *= 1.0 - p.thrift * pressure;
        }
    }

    // 5) Clamp to [reserve ..= balance]. The server rejects amount > balance, and
    //    Vickrey makes truthful bidding safe, so we never need to shade the cap.
    let max_affordable = ctx.my_balance.max(0);
    let mut bid_i = bid.round() as i64;
    if bid_i > max_affordable {
        bid_i = max_affordable;
    }
    if bid_i < ctx.reserve {
        // Only meet the reserve if the tile is genuinely worth at least that much.
        if value >= ctx.reserve as f64 && max_affordable >= ctx.reserve {
            ctx.reserve
        } else {
            0
        }
    } else {
        bid_i
    }
}

/// 0 when we hold a comfortable cushion, approaching 1 as we near broke.
fn liquidity_pressure(balance: i64) -> f64 {
    const COMFORT: f64 = 25.0;
    (1.0 - (balance.max(0) as f64 / COMFORT)).clamp(0.0, 1.0)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::dict::Lexicon;
    use crate::persona::Persona;
    use crate::tiles::letter_index;

    fn lex() -> Lexicon {
        Lexicon::from_words(["RETINA", "RETINAS", "RETAINS", "QI", "ZA", "CAT"])
    }

    fn ctx<'a>(
        v: &'a Valuator<'a>,
        rack: &'a Counts,
        letter_idx: usize,
        balance: i64,
        opps: &'a [OpponentModel],
        tiles_remaining: u32,
    ) -> BidContext<'a> {
        BidContext {
            valuator: v,
            rack,
            letter_idx,
            my_balance: balance,
            reserve: 1,
            opponents: opps,
            tiles_remaining,
            score_model: ScoreModel::CumulativeWordScore,
        }
    }

    #[test]
    fn bids_for_a_bingo_completing_tile_but_not_a_clunk() {
        let l = lex();
        let v = Valuator::new(&l, Persona::shakespeare());
        let rack = Counts::from_letters("RETINA");
        let s = letter_index(b'S').unwrap();
        let z = letter_index(b'Z').unwrap();
        let opps: [OpponentModel; 0] = [];
        let bid_s = decide_bid(&ctx(&v, &rack, s, 100, &opps, 60));
        let bid_z = decide_bid(&ctx(&v, &rack, z, 100, &opps, 60));
        assert!(bid_s > bid_z, "S (bingo hook)={bid_s} should beat Z (clunk)={bid_z}");
        assert!(bid_s >= 1);
    }

    #[test]
    fn never_bids_more_than_balance() {
        let l = lex();
        let v = Valuator::new(&l, Persona::cicero());
        let rack = Counts::from_letters("RETINA");
        let s = letter_index(b'S').unwrap();
        let opps: [OpponentModel; 0] = [];
        let bid = decide_bid(&ctx(&v, &rack, s, 3, &opps, 60));
        assert!(bid <= 3);
    }
}
