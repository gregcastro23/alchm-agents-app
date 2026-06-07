import { expect, test } from "bun:test";
import { Brain } from "./game";
import { Lexicon } from "./lexicon";
import { AuctionType, NaiveBot, runMatch } from "./sim";
import { Counts, PERSONAS, ScoreModel, Valuator, decideBid } from "./strategy";
import { letterIndex } from "./tiles";

const lex = new Lexicon(["RETINA", "RETINAS", "RETAINS", "QI", "CAT", "CATS", "STAINER"]);
const S = letterIndex(83);
const Z = letterIndex(90);

test("finds the highest-reward bingo", () => {
  const p = lex.bestPlay(Counts.fromLetters("RETINAS").n);
  expect(p?.len).toBe(7);
  expect(p?.reward).toBe(21); // base 7 * 3
});

test("S is a bingo hook for RETINA", () => {
  const mask = lex.bingoHookMask(Counts.fromLetters("RETINA").n, 7);
  expect(mask & (1 << S)).toBeGreaterThan(0);
});

test("bids more for a bingo hook than a clunk", () => {
  const v = new Valuator(lex, PERSONAS.shakespeare());
  const rack = Counts.fromLetters("RETINA");
  const bid = (i: number) =>
    decideBid({
      valuator: v,
      rack,
      letterIdx: i,
      myBalance: 100,
      reserve: 1,
      opponents: [],
      tilesRemaining: 60,
      scoreModel: ScoreModel.CumulativeWordScore,
    });
  expect(bid(S)).toBeGreaterThan(bid(Z));
});

test("plays an in-hand bingo rather than hoarding", () => {
  const v = new Valuator(lex, PERSONAS.shakespeare());
  const play = v.chooseWord(Counts.fromLetters("RETINAS"));
  expect(play?.len).toBe(7);
});

test("a full match runs and ranks a winner", () => {
  const players = [
    new Brain(0, lex, PERSONAS.shakespeare()),
    new NaiveBot(1, lex),
    new NaiveBot(2, lex),
    new NaiveBot(3, lex),
  ];
  const standings = runMatch(players, AuctionType.Vickrey, 123);
  expect(standings.length).toBe(4);
  expect(standings[0].score).toBeGreaterThanOrEqual(standings[3].score);
});
