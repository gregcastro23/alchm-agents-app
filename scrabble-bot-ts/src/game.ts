// Event-driven state machine (the "Brain") + the Player seam the simulator and
// live client drive. Port of scrabble-bot/src/game.rs.

import type { Lexicon, Play } from "./lexicon";
import {
  Counts,
  decideBid as decideBidPolicy,
  type Persona,
  ScoreModel,
  TableModel,
  Valuator,
} from "./strategy";

export type Event =
  | { t: "MatchStart"; me: number; players: number[]; startBalance: number; tilesToAuction: number }
  | { t: "AuctionResolved"; winner: number | null; letterIdx: number; paid: number }
  | { t: "WordPlayed"; botId: number; word: string; reward: number }
  | { t: "Participant"; botId: number; balance: number; score: number }
  | { t: "RackSnapshot"; rack: Counts; balance: number; score: number };

export interface Player {
  observe(ev: Event): void;
  decideBid(letterIdx: number): number;
  chooseWord(): Play | null;
  bestForcedWord(): Play | null;
  id(): number;
  name(): string;
  score(): number;
  balance(): number;
  words(): number;
}

export class Brain implements Player {
  me: number;
  myRack = new Counts();
  myBalance = 0;
  myScore = 0;
  myWords = 0;
  startBalance = 0;
  tilesRemaining = 0;
  table = new TableModel(0, []);
  reserve = 1;

  constructor(
    me: number,
    public lex: Lexicon,
    public persona: Persona,
    public scoreModel: ScoreModel = ScoreModel.CumulativeWordScore,
  ) {
    this.me = me;
  }

  private valuator(): Valuator {
    return new Valuator(this.lex, this.persona);
  }

  observe(ev: Event): void {
    switch (ev.t) {
      case "MatchStart": {
        this.me = ev.me;
        this.startBalance = ev.startBalance;
        this.myBalance = ev.startBalance;
        this.myScore = 0;
        this.myWords = 0;
        this.myRack = new Counts();
        this.tilesRemaining = ev.tilesToAuction;
        this.table = new TableModel(
          ev.startBalance,
          ev.players.filter((p) => p !== ev.me),
        );
        break;
      }
      case "AuctionResolved": {
        if (this.tilesRemaining > 0) this.tilesRemaining--;
        if (ev.winner !== null) {
          this.table.onAuctionWon(ev.winner, ev.letterIdx, ev.paid, this.me);
          if (ev.winner === this.me) {
            this.myRack.add(ev.letterIdx);
            this.myBalance -= ev.paid;
          }
        }
        break;
      }
      case "WordPlayed": {
        this.table.onWordPlayed(ev.botId, ev.word, ev.reward, this.me);
        if (ev.botId === this.me) {
          const leave = this.myRack.tryRemoveWord(ev.word);
          if (leave) this.myRack = leave;
          this.myBalance += ev.reward;
          this.myScore += ev.reward;
          this.myWords++;
        }
        break;
      }
      case "Participant": {
        if (ev.botId === this.me) {
          this.myBalance = ev.balance;
          this.myScore = ev.score;
        } else {
          this.table.opponent(ev.botId)?.setPublic(ev.balance, ev.score);
        }
        break;
      }
      case "RackSnapshot": {
        this.myRack = ev.rack;
        this.myBalance = ev.balance;
        this.myScore = ev.score;
        break;
      }
    }
  }

  decideBid(letterIdx: number): number {
    return decideBidPolicy({
      valuator: this.valuator(),
      rack: this.myRack,
      letterIdx,
      myBalance: this.myBalance,
      reserve: this.reserve,
      opponents: this.table.opponents,
      tilesRemaining: this.tilesRemaining,
      scoreModel: this.scoreModel,
    });
  }

  chooseWord(): Play | null {
    return this.valuator().chooseWord(this.myRack);
  }

  bestForcedWord(): Play | null {
    return this.valuator().bestForcedWord(this.myRack);
  }

  id(): number {
    return this.me;
  }
  name(): string {
    return this.persona.name;
  }
  score(): number {
    return this.myScore;
  }
  balance(): number {
    return this.myBalance;
  }
  words(): number {
    return this.myWords;
  }
}
