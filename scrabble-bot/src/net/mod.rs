//! Live SpacetimeDB client (compiled only with `--features live`).
//!
//! This is a thin glue layer: it subscribes to the public `scrabblebot` tables
//! and the private `my_rack` view, forwards every change into the always-compiled,
//! unit-tested [`crate::bridge::LiveBridge`], and pushes the bridge's decisions
//! back as `submit_bid` / `submit_word` reducer calls.
//!
//! ## One-time setup before this compiles
//! ```text
//! # 1. install the SpacetimeDB CLI
//! curl -sSf https://install.spacetimedb.com | sh
//! # 2. generate the typed Rust bindings INTO this directory
//! spacetime generate --lang rust \
//!   --out-dir scrabble-bot/src/net/module_bindings \
//!   --module-path <path-to>/scrabblebot/spacetimedb
//! # 3. build with the feature on
//! cargo run --release --features live -- play
//! ```
//! `spacetime generate` writes the `module_bindings` module referenced below
//! (`DbConnection`, the table/reducer accessors, and the row structs `Auction`,
//! `AuctionResult`, `WordPlay`, `MatchParticipant`, `Match`, `Holding`,
//! `BotCredential`). Field names in `spacetime.rs` mirror the module schema; if a
//! future module rename shifts one, adjust it there — all the *logic* lives in
//! `bridge.rs` and won't need to change.

#[allow(warnings)]
pub mod module_bindings;

pub mod spacetime;

pub use spacetime::run_live;
