//! Persona engine — bidding *temperament* derived from the alchm grammatical
//! master agents (`lib/agents/historical/*.ts`). The same valuation and bidding
//! math runs underneath every persona; a [`Persona`] is the bundle of weights
//! that decides how that math *expresses* itself.
//!
//! Shakespeare is the flagship and default. Every weight cites the persona data
//! it is derived from, so the mapping is principled, not decorative.

/// A bidding temperament. `Copy` so it is free to pass through the hot path.
#[derive(Clone, Copy, Debug)]
pub struct Persona {
    pub name: &'static str,
    pub signature: &'static str,

    // ---- valuation shaping -------------------------------------------------
    /// Weight on the best word playable *right now* (currency realisable soon).
    pub immediacy: f64,
    /// Weight on rack health: vowel/consonant balance, anti-duplication, no traps.
    pub balance: f64,
    /// Weight on bingo proximity — being one tile from a 3x (>=7 letter) word.
    pub potential: f64,
    /// Equity bonus per letter of word length; biases toward going long.
    pub length_bias: f64,

    // ---- bidding shaping ---------------------------------------------------
    /// Confidence multiplier on our marginal value (>1 = aggressive).
    pub aggression: f64,
    /// How hard to conserve currency as the balance thins (0..1).
    pub thrift: f64,
    /// Willingness to pay a premium to deny a pivotal tile to a rival (0..1).
    pub deprivation: f64,
    /// Trust in opponent-rack inference when sizing deprivation premiums (0..1).
    pub insight: f64,
}

impl Default for Persona {
    fn default() -> Self {
        Self::shakespeare()
    }
}

impl Persona {
    /// **William Shakespeare** — "Master of Human Nature" (the flagship champion).
    /// Source: `lib/agents/historical/william-shakespeare.ts`. The weights are
    /// both persona-faithful *and* the profile self-play selected as strongest
    /// (aggressive, opponent-aware accumulation — see README "Tuning").
    ///   * gift "Linguistic Mastery ... creating phrases that become part of
    ///     eternal human vocabulary" + trait "Master of linguistic innovation and
    ///     wordplay" -> high `length_bias` and `potential` (build the long, 3x words).
    ///   * essence 0.95 "authentic voice of humanity" + uniquePower "Can see into
    ///     the heart of any human situation" -> maxed `insight` and strong
    ///     `deprivation`: he reads each rival's rack and denies the pivotal tile.
    ///   * resonanceScore 0.96 + trait "Theatrical visionary with commercial
    ///     savvy" -> confident `aggression` above the truthful baseline.
    ///   * dominantModality `Fixed`, monicaConstant 5.12, "Patient craftsman" ->
    ///     `potential` stays high; balance is renewable so `thrift` is light.
    pub const fn shakespeare() -> Self {
        Self {
            name: "The Bard (Shakespeare)",
            signature: "SHAKESPEARE-1564-WORDSMITH-GENIUS",
            immediacy: 1.0,
            balance: 0.9,
            potential: 1.4,
            length_bias: 0.9,
            aggression: 1.15,
            thrift: 0.4,
            deprivation: 0.65,
            insight: 1.0,
        }
    }

    /// **Cicero** — "The Great Orator". `lib/agents/historical/cicero.ts`.
    /// Air/Cardinal, "Eloquent speech is the highest achievement of humanity" ->
    /// initiating, high-tempo, charismatic: aggressive and immediate.
    pub const fn cicero() -> Self {
        Self {
            name: "Cicero",
            signature: "CICERO-SIGNATURE",
            immediacy: 1.2,
            balance: 0.8,
            potential: 1.0,
            length_bias: 0.7,
            aggression: 1.2,
            thrift: 0.4,
            deprivation: 0.3,
            insight: 0.7,
        }
    }

    /// **Voltaire** — "The Enlightenment Wit". `lib/agents/historical/voltaire.ts`.
    /// Satirical, "expose folly", "those who can make you believe absurdities..."
    /// -> contrarian blocker: high `deprivation` and `insight`.
    pub const fn voltaire() -> Self {
        Self {
            name: "Voltaire",
            signature: "VOLTAIRE-1694-ENLIGHTENMENT-WIT",
            immediacy: 1.0,
            balance: 0.85,
            potential: 1.1,
            length_bias: 0.8,
            aggression: 1.0,
            thrift: 0.55,
            deprivation: 0.7,
            insight: 1.0,
        }
    }

    /// **Mark Twain** — "The American Humorist". `lib/agents/historical/mark-twain.ts`.
    /// Folksy, "common speech carries more wisdom than elevated rhetoric",
    /// practical-grounded -> patient value investor: high `thrift`, strong `balance`.
    pub const fn twain() -> Self {
        Self {
            name: "Mark Twain",
            signature: "TWAIN-1835-AMERICAN-HUMORIST",
            immediacy: 0.95,
            balance: 1.0,
            potential: 1.2,
            length_bias: 0.85,
            aggression: 0.9,
            thrift: 0.8,
            deprivation: 0.25,
            insight: 0.75,
        }
    }

    /// **Dante** — "The Divine Poet". `lib/agents/historical/dante-alighieri.ts`.
    /// "Spiritual Cartography ... detailed architecture", Water/Fixed -> the
    /// methodical structuralist: maximal `potential`/`balance`, very patient.
    pub const fn dante() -> Self {
        Self {
            name: "Dante",
            signature: "DANTE-1265-DIVINE-POET",
            immediacy: 0.85,
            balance: 1.1,
            potential: 1.5,
            length_bias: 1.0,
            aggression: 0.95,
            thrift: 0.6,
            deprivation: 0.3,
            insight: 0.8,
        }
    }

    /// The full roster of grammatical-master temperaments, for self-play tuning.
    pub fn roster() -> Vec<Persona> {
        vec![
            Self::shakespeare(),
            Self::cicero(),
            Self::voltaire(),
            Self::twain(),
            Self::dante(),
        ]
    }

    /// Look up a persona by (case-insensitive) short name.
    pub fn by_name(name: &str) -> Option<Persona> {
        match name.to_ascii_lowercase().as_str() {
            "shakespeare" | "bard" => Some(Self::shakespeare()),
            "cicero" => Some(Self::cicero()),
            "voltaire" => Some(Self::voltaire()),
            "twain" => Some(Self::twain()),
            "dante" => Some(Self::dante()),
            _ => None,
        }
    }
}
