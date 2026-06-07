//! `bard` — CLI entry point.
//!
//! Subcommands:
//!   * `bard info`                      — lexicon stats + persona roster
//!   * `bard analyze <RACK> [LETTER]`   — best word, equity, bingo hooks, a bid
//!   * `bard sim [--matches N]`         — self-play tournament (proves it works)
//!   * `bard bench [--n N]`             — decide_bid latency (proves sub-15ms)
//!   * `bard play`                      — connect to the live server (feature `live`)

use std::sync::Arc;
use std::time::Instant;

use bard::bidding::{self, BidContext, ScoreModel};
use bard::dict::Lexicon;
use bard::game::{Bot, Event, Player};
use bard::opponent::OpponentModel;
use bard::persona::Persona;
use bard::rack::Counts;
use bard::sim;
use bard::tiles::{index_letter, letter_index};
use bard::valuation::Valuator;

fn main() {
    let args: Vec<String> = std::env::args().skip(1).collect();
    let cmd = args.first().map(|s| s.as_str()).unwrap_or("help");
    let rest = if args.is_empty() { &[][..] } else { &args[1..] };
    match cmd {
        "info" => cmd_info(),
        "analyze" => cmd_analyze(rest),
        "sim" => cmd_sim(rest),
        "bench" => cmd_bench(rest),
        "play" => cmd_play(rest),
        "help" | "-h" | "--help" => print_help(),
        other => {
            eprintln!("unknown command: {other}\n");
            print_help();
        }
    }
}

fn print_help() {
    println!(
        "The Bard — Scrabble auction bot (SpacetimeDB `scrabblebot`)\n\
         \n\
         USAGE:\n  \
           bard <command> [args]\n\
         \n\
         COMMANDS:\n  \
           info                      Lexicon stats and the persona roster\n  \
           analyze <RACK> [LETTER]   Best word, equity, bingo hooks, and a bid for LETTER\n  \
           sim [--matches N] [--seed S]   Self-play tournament across the personas + a starter clone\n  \
           bench [--n N]             decide_bid latency distribution (sub-15ms proof)\n  \
           play                      Connect to the live server (build with --features live)\n  \
         \n\
         OPTIONS:\n  \
           --persona <name>          shakespeare | cicero | voltaire | twain | dante (default: shakespeare)\n"
    );
}

fn flag<'a>(args: &'a [String], name: &str) -> Option<&'a str> {
    args.iter()
        .position(|a| a == name)
        .and_then(|i| args.get(i + 1))
        .map(|s| s.as_str())
}

fn positionals(args: &[String]) -> Vec<&str> {
    let mut out = Vec::new();
    let mut i = 0;
    while i < args.len() {
        if args[i].starts_with("--") {
            i += 2; // skip flag + its value
        } else {
            out.push(args[i].as_str());
            i += 1;
        }
    }
    out
}

fn persona_from(args: &[String]) -> Persona {
    match flag(args, "--persona") {
        Some(name) => Persona::by_name(name).unwrap_or_else(|| {
            eprintln!("unknown persona '{name}', using Shakespeare");
            Persona::shakespeare()
        }),
        None => Persona::shakespeare(),
    }
}

fn cmd_info() {
    let lex = Lexicon::load_embedded();
    println!(
        "Lexicon (ENABLE): {} words, {} trie nodes",
        lex.word_count(),
        lex.node_count()
    );
    println!("\nPersonas (derived from lib/agents/historical/*.ts):");
    for p in Persona::roster() {
        println!(
            "  {:<22} {:<34} agg {:.2}  patience(pot) {:.2}  insight {:.2}  deprivation {:.2}",
            p.name, p.signature, p.aggression, p.potential, p.insight, p.deprivation
        );
    }
}

fn cmd_analyze(args: &[String]) {
    let pos = positionals(args);
    if pos.is_empty() {
        eprintln!("usage: bard analyze <RACK> [LETTER] [--persona name]");
        return;
    }
    let persona = persona_from(args);
    let lex = Lexicon::load_embedded();
    let v = Valuator::new(&lex, persona);
    let rack = Counts::from_letters(pos[0]);

    println!("Persona : {}", persona.name);
    println!("Rack    : {} ({} tiles)", rack.to_letters(), rack.total);
    match lex.best_play(&rack) {
        Some(p) => println!(
            "Best word: {} (base {}, len {}, reward {})",
            p.word, p.base_score, p.len, p.reward as i64
        ),
        None => println!("Best word: (none formable)"),
    }
    println!("Equity  : {:.2}", v.equity(&rack));

    let mask = lex.bingo_hook_mask(&rack, 7);
    let hooks: String = (0..26)
        .filter(|&i| mask & (1u32 << i) != 0)
        .map(|i| index_letter(i) as char)
        .collect();
    println!(
        "Bingo hooks (one tile from a 7+ word): {}",
        if hooks.is_empty() { "(none)".to_string() } else { hooks }
    );

    if let Some(letter) = pos.get(1) {
        if let Some(idx) = letter.bytes().next().and_then(letter_index) {
            let mv = v.marginal_value(&rack, idx);
            let no_opps: [OpponentModel; 0] = [];
            let ctx = BidContext {
                valuator: &v,
                rack: &rack,
                letter_idx: idx,
                my_balance: 100,
                reserve: 1,
                opponents: &no_opps,
                tiles_remaining: 60,
                score_model: ScoreModel::default(),
            };
            let bid = bidding::decide_bid(&ctx);
            let up = (b'A' + idx as u8) as char;
            println!("\nLetter on auction: {up}");
            println!("  marginal value : {mv:.2}");
            println!("  bid (bal 100, mid-bag, no rivals): {bid}");
        } else {
            eprintln!("'{letter}' is not a letter A-Z");
        }
    }
}

fn cmd_sim(args: &[String]) {
    let matches: u32 = flag(args, "--matches").and_then(|s| s.parse().ok()).unwrap_or(40);
    let seed: u64 = flag(args, "--seed").and_then(|s| s.parse().ok()).unwrap_or(0xC0FFEE);
    let lex = Arc::new(Lexicon::load_embedded());

    println!("Loaded ENABLE lexicon: {} words.\n", lex.word_count());

    // 1) Persona round-robin: all five grammatical-master temperaments share a
    //    table with one starter clone (6 players, the module's lobby max).
    println!("== Persona round-robin: 5 Bard personas + 1 starter clone, {matches} matches ==");
    let roster = Persona::roster();
    let results = sim::run_tournament(&roster, 1, matches, seed, lex.clone());
    print_tourney(&results);

    // 2) Head-to-head vs the field: Shakespeare against 3 starter clones (the
    //    hackathon's "you + 3 bots"), to isolate The Bard's edge over baseline.
    println!("\n== The Bard (Shakespeare) vs 3 starter clones, {} matches ==", matches * 2);
    let solo = [Persona::shakespeare()];
    let results = sim::run_tournament(&solo, 3, matches * 2, seed ^ 0xABCD, lex.clone());
    print_tourney(&results);

    // 3) Mirror robustness: 6 identical flagship Bards. If the aggressive profile
    //    cannibalised itself (over-paying, going broke), scores would collapse.
    println!("\n== Mirror robustness: 6x The Bard (Shakespeare), {matches} matches ==");
    let mirror = vec![Persona::shakespeare(); 6];
    let results = sim::run_tournament(&mirror, 0, matches, seed ^ 0x55AA, lex.clone());
    print_tourney(&results);
}

fn print_tourney(results: &[sim::TourneyResult]) {
    println!(
        "  {:<22} {:>7} {:>7} {:>9} {:>9} {:>9}",
        "persona", "matches", "wins", "win%", "avgScore", "avgRank"
    );
    for r in results {
        println!(
            "  {:<22} {:>7} {:>7} {:>8.1}% {:>9.1} {:>9.2}",
            r.name,
            r.matches,
            r.wins,
            r.win_rate() * 100.0,
            r.avg_score(),
            r.avg_rank()
        );
    }
}

fn cmd_bench(args: &[String]) {
    let n: usize = flag(args, "--n").and_then(|s| s.parse().ok()).unwrap_or(50_000);
    let lex = Arc::new(Lexicon::load_embedded());
    let mut bot = Bot::new(0, Persona::shakespeare(), ScoreModel::default(), lex.clone());

    // Set up a realistic 4-player mid-game with three modelled opponents who have
    // each won several tiles (so deprivation evaluation is exercised too).
    bot.observe(&Event::MatchStart {
        me: 0,
        players: vec![0, 1, 2, 3],
        start_balance: 100,
        tiles_to_auction: 60,
    });
    let mut rng = sim::Rng::new(0xDEAD_BEEF);
    for oid in 1..=3u64 {
        for _ in 0..6 {
            let idx = rng.below(26) as usize;
            bot.observe(&Event::AuctionResolved {
                winner: Some(oid),
                letter_idx: idx,
                paid: 2,
            });
        }
    }

    let mut durations: Vec<u64> = Vec::with_capacity(n);
    // Warm up.
    for _ in 0..1000 {
        let mut rack = Counts::new();
        for _ in 0..7 {
            rack.add(rng.below(26) as usize);
        }
        bot.my_rack = rack;
        std::hint::black_box(bot.decide_bid(rng.below(26) as usize));
    }
    for _ in 0..n {
        let mut rack = Counts::new();
        for _ in 0..7 {
            rack.add(rng.below(26) as usize);
        }
        bot.my_rack = rack;
        let letter = rng.below(26) as usize;
        let t = Instant::now();
        let bid = bot.decide_bid(letter);
        let d = t.elapsed();
        std::hint::black_box(bid);
        durations.push(d.as_nanos() as u64);
    }

    durations.sort_unstable();
    let us = |ns: u64| ns as f64 / 1000.0;
    let mean = durations.iter().sum::<u64>() as f64 / n as f64;
    let p50 = durations[n / 2];
    let p99 = durations[n * 99 / 100];
    let max = *durations.last().unwrap();

    println!("decide_bid latency over {n} random mid-game states");
    println!("(Shakespeare persona, 3 modelled opponents, 7-tile rack):\n");
    println!("  mean  {:.2} µs", us(mean as u64));
    println!("  p50   {:.2} µs", us(p50));
    println!("  p99   {:.2} µs", us(p99));
    println!("  max   {:.2} µs", us(max));
    let max_us = us(max).max(0.001);
    println!(
        "\n  server window 1000 ms; user target 15 ms -> {:.0}x headroom vs the 15 ms target",
        15_000.0 / max_us
    );
}

fn cmd_play(_args: &[String]) {
    #[cfg(feature = "live")]
    {
        bard::net::run_live(_args);
    }
    #[cfg(not(feature = "live"))]
    {
        println!(
            "Live play requires the `live` feature and generated SpacetimeDB bindings.\n\
             \n\
             One-time setup:\n  \
               1. Install the SpacetimeDB CLI:  curl -sSf https://install.spacetimedb.com | sh\n  \
               2. Generate Rust bindings for the module:\n     \
                  spacetime generate --lang rust --out-dir src/net/module_bindings \\\n       \
                    --project-path <path-to>/scrabblebot/spacetimedb\n  \
               3. Get your team JWT from the challenge site and save it to .token-bard\n  \
               4. Build & run:\n     \
                  cargo run --release --features live -- play\n\
             \n\
             Connection: https://maincloud.spacetimedb.com  module `scrabblebot`\n\
             Reducers used: join_lobby(), submit_bid(auction_id, amount), submit_word(match_id, word)\n\
             \n\
             See README.md (\"Going live\") for the full walkthrough and the ready-to-fill\n\
             client in src/net/spacetime.rs."
        );
    }
}
