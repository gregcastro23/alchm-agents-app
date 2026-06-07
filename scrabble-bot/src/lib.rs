//! # The Bard — a Scrabble auction bot for the SpacetimeDB `scrabblebot` challenge.
//!
//! A compiled, sub-millisecond bidding engine whose word-finding *is* Shakespeare's
//! "Linguistic Mastery" gift made literal, and whose bidding temperament is derived
//! from the alchm grammatical-master agents (`lib/agents/historical/*.ts`).
//!
//! ## Layers
//! * [`tiles`] — letter values, the 98-tile bag, and the exact reward formula.
//! * [`rack`] — a tile multiset (`Counts`) for allocation-free hot paths.
//! * [`dict`] — the ENABLE lexicon trie with rack-bounded best-word search.
//! * [`persona`] — bidding temperaments derived from the historical agents.
//! * [`valuation`] — rack equity + the marginal value a Vickrey auction rewards.
//! * [`opponent`] — reconstructing rivals' racks from public events.
//! * [`bidding`] — the Vickrey-truthful bidding policy with liquidity management.
//! * [`game`] — the event-driven state machine and the `Player` trait.
//! * [`sim`] — a faithful local arena (incl. a clone of the official starter bot).
//! * `net` — the live SpacetimeDB client (behind the `live` feature).

pub mod bidding;
pub mod bridge;
pub mod dict;
pub mod game;
pub mod opponent;
pub mod persona;
pub mod rack;
pub mod sim;
pub mod tiles;
pub mod valuation;

#[cfg(feature = "live")]
pub mod net;
