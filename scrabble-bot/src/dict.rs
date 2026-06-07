//! The lexicon: a trie over the ENABLE word list with fast "what can I build from
//! this rack" search. This module *is* Shakespeare's **Linguistic Mastery** gift
//! made literal — "unparalleled command of language ... creating phrases" — only
//! here the phrases are scoring words found in microseconds.
//!
//! The trie is built once at startup from the embedded `assets/wordlist.txt`
//! (172,820 ENABLE words — the exact list the SpacetimeDB module validates
//! against). All searches are rack-bounded DFS, so cost scales with the number
//! of *formable* words, not the size of the dictionary.

use crate::rack::Counts;
use crate::tiles::{index_letter, letter_index, reward_exact, value_of, NLETTERS};

const NONE: u32 = u32::MAX;

#[derive(Clone)]
struct Node {
    children: [u32; NLETTERS],
    terminal: bool,
}

impl Node {
    fn new() -> Self {
        Node {
            children: [NONE; NLETTERS],
            terminal: false,
        }
    }
}

/// A trie lexicon supporting validity checks and rack-bounded best-word search.
pub struct Lexicon {
    nodes: Vec<Node>,
    word_count: usize,
}

/// A concrete word the bot could play, with its scoring already resolved.
#[derive(Clone, Debug, PartialEq)]
pub struct Play {
    pub word: String,
    pub base_score: u32,
    pub len: usize,
    /// `base_score * length_multiplier(len)` — the currency reward for playing it.
    pub reward: f64,
}

impl Lexicon {
    /// Build a lexicon from any iterator of words.
    pub fn from_words<I, S>(words: I) -> Self
    where
        I: IntoIterator<Item = S>,
        S: AsRef<str>,
    {
        let mut nodes = vec![Node::new()]; // node 0 = root
        let mut word_count = 0usize;
        for w in words {
            let w = w.as_ref().trim();
            if w.is_empty() {
                continue;
            }
            let mut cur = 0usize;
            let mut ok = true;
            for b in w.bytes() {
                let idx = match letter_index(b) {
                    Some(i) => i,
                    None => {
                        ok = false;
                        break;
                    }
                };
                let next = nodes[cur].children[idx];
                cur = if next == NONE {
                    let new_id = nodes.len() as u32;
                    nodes.push(Node::new());
                    nodes[cur].children[idx] = new_id;
                    new_id as usize
                } else {
                    next as usize
                };
            }
            if ok && !nodes[cur].terminal {
                nodes[cur].terminal = true;
                word_count += 1;
            }
        }
        Lexicon { nodes, word_count }
    }

    /// Build from the wordlist embedded at compile time (the ENABLE list).
    pub fn load_embedded() -> Self {
        let raw = include_str!("../assets/wordlist.txt");
        Self::from_words(raw.lines())
    }

    pub fn word_count(&self) -> usize {
        self.word_count
    }

    pub fn node_count(&self) -> usize {
        self.nodes.len()
    }

    /// Is `word` in the lexicon? (Used to validate our own and opponents' plays.)
    pub fn contains(&self, word: &str) -> bool {
        let mut cur = 0usize;
        for b in word.bytes() {
            let idx = match letter_index(b) {
                Some(i) => i,
                None => return false,
            };
            let next = self.nodes[cur].children[idx];
            if next == NONE {
                return false;
            }
            cur = next as usize;
        }
        self.nodes[cur].terminal
    }

    // --- Rack-bounded search ------------------------------------------------

    /// The single highest-*reward* word formable from `rack`.
    pub fn best_play(&self, rack: &Counts) -> Option<Play> {
        let mut avail = rack.n;
        let mut path: Vec<u8> = Vec::with_capacity(16);
        let mut best: Option<Play> = None;
        self.dfs_best(0, &mut avail, &mut path, 0, &mut best);
        best
    }

    fn dfs_best(
        &self,
        node: usize,
        avail: &mut [u8; NLETTERS],
        path: &mut Vec<u8>,
        score: u32,
        best: &mut Option<Play>,
    ) {
        if self.nodes[node].terminal {
            let len = path.len();
            let reward = reward_exact(score as i64, len) as f64;
            let better = match best {
                Some(b) => reward > b.reward,
                None => true,
            };
            if better {
                let word: String = path.iter().map(|&i| index_letter(i as usize) as char).collect();
                *best = Some(Play {
                    word,
                    base_score: score,
                    len,
                    reward,
                });
            }
        }
        for i in 0..NLETTERS {
            if avail[i] == 0 {
                continue;
            }
            let child = self.nodes[node].children[i];
            if child == NONE {
                continue;
            }
            avail[i] -= 1;
            path.push(i as u8);
            self.dfs_best(child as usize, avail, path, score + value_of(i), best);
            path.pop();
            avail[i] += 1;
        }
    }

    /// Visit every word formable from `rack`, calling `visit(word_indices, base_score)`.
    /// Used by the word-chooser to weigh reward against the leave it implies.
    pub fn for_each_play<F: FnMut(&[u8], u32)>(&self, rack: &Counts, mut visit: F) {
        let mut avail = rack.n;
        let mut path: Vec<u8> = Vec::with_capacity(16);
        self.dfs_all(0, &mut avail, &mut path, 0, &mut visit);
    }

    fn dfs_all<F: FnMut(&[u8], u32)>(
        &self,
        node: usize,
        avail: &mut [u8; NLETTERS],
        path: &mut Vec<u8>,
        score: u32,
        visit: &mut F,
    ) {
        if self.nodes[node].terminal {
            visit(path, score);
        }
        for i in 0..NLETTERS {
            if avail[i] == 0 {
                continue;
            }
            let child = self.nodes[node].children[i];
            if child == NONE {
                continue;
            }
            avail[i] -= 1;
            path.push(i as u8);
            self.dfs_all(child as usize, avail, path, score + value_of(i), visit);
            path.pop();
            avail[i] += 1;
        }
    }

    /// "Bingo proximity": the set of single letters that, if added to `rack`,
    /// would complete at least one word of length >= `min_len` (default 7).
    /// Returned as a 26-bit mask; `popcount` is a strong rack-potential signal.
    ///
    /// Implementation: a DFS allowing exactly **one** "deficit" tile (a letter we
    /// don't physically hold). When a deficit path reaches a long terminal, the
    /// deficit letter is the hook that would complete a bingo. Because only one
    /// deficit is ever spent per path, the search stays tightly bounded.
    pub fn bingo_hook_mask(&self, rack: &Counts, min_len: usize) -> u32 {
        let mut avail = rack.n;
        let mut mask = 0u32;
        self.dfs_hooks(0, &mut avail, None, 0, min_len, &mut mask);
        mask
    }

    fn dfs_hooks(
        &self,
        node: usize,
        avail: &mut [u8; NLETTERS],
        deficit_letter: Option<usize>,
        depth: usize,
        min_len: usize,
        mask: &mut u32,
    ) {
        if depth >= min_len && self.nodes[node].terminal {
            if let Some(l) = deficit_letter {
                *mask |= 1 << l;
            }
            // If deficit_letter is None we can already make this bingo with the
            // rack alone; that is captured separately by `best_play`.
        }
        // Cap depth: hooks for 7-8 letter words are what matter for the next bingo.
        if depth >= min_len + 1 {
            return;
        }
        for i in 0..NLETTERS {
            let child = self.nodes[node].children[i];
            if child == NONE {
                continue;
            }
            if avail[i] > 0 {
                avail[i] -= 1;
                self.dfs_hooks(child as usize, avail, deficit_letter, depth + 1, min_len, mask);
                avail[i] += 1;
            } else if deficit_letter.is_none() {
                // Spend our single deficit on letter `i`.
                self.dfs_hooks(child as usize, avail, Some(i), depth + 1, min_len, mask);
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn tiny() -> Lexicon {
        Lexicon::from_words(["CAT", "CATS", "ACT", "ACTS", "SCAT", "QUIZ", "RETINAS", "RETAINS", "AI"])
    }

    #[test]
    fn validity() {
        let lex = tiny();
        assert!(lex.contains("CAT"));
        assert!(lex.contains("retinas")); // case-insensitive
        assert!(!lex.contains("DOG"));
        assert!(!lex.contains("CA"));
    }

    #[test]
    fn best_play_prefers_high_reward() {
        let lex = tiny();
        // From these tiles the 7-letter bingo (3x) should beat any short word.
        let rack = Counts::from_letters("RETINAS");
        let p = lex.best_play(&rack).unwrap();
        assert_eq!(p.len, 7);
        assert!(p.word == "RETINAS" || p.word == "RETAINS");
        // base score of RETINAS = R1 E1 T1 I1 N1 A1 S1 = 7, times 3.0 = 21.
        assert_eq!(p.base_score, 7);
        assert_eq!(p.reward, 21.0);
    }

    #[test]
    fn best_play_none_when_unformable() {
        let lex = tiny();
        let rack = Counts::from_letters("ZZ");
        assert!(lex.best_play(&rack).is_none());
    }

    #[test]
    fn hooks_detect_one_away_bingo() {
        let lex = tiny();
        // RETINA + (S) completes RETINAS/RETAINS.
        let rack = Counts::from_letters("RETINA");
        let mask = lex.bingo_hook_mask(&rack, 7);
        let s = letter_index(b'S').unwrap();
        assert!(mask & (1 << s) != 0, "S should be a bingo hook for RETINA");
    }
}
