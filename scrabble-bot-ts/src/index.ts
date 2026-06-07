// @ts-nocheck — imports the generated `./module_bindings`, produced at setup time
// via `bun run generate` (see README). All game logic lives in the typechecked,
// tested Brain/strategy modules; this file is only SpacetimeDB SDK glue.
//
// Live client for the SpacetimeDB `scrabblebot` challenge. Matches the official
// bot-starter structure (camelCase reducers, BigInt amounts, lobby lifecycle) but
// drives the full opponent-aware engine instead of the toy strategy.

import * as fs from "node:fs";
import { DbConnection, Identity } from "./module_bindings";
import { Brain } from "./game";
import { Lexicon } from "./lexicon";
import { Counts, PERSONAS, ScoreModel, defaultWordlistPath, personaByName } from "./strategy";
import { letterIndex } from "./tiles";

const HOST = process.env.STDB_HOST ?? "https://maincloud.spacetimedb.com";
const DB_NAME = process.env.STDB_DB ?? "scrabblebot";
const BOT_NAME = process.env.BOT_NAME ?? "bard";
// Tournament registration (optional): REGISTER_TOURNAMENT=<id> registers on
// connect; UNREGISTER_TOURNAMENT=<id> backs out before it starts.
const REGISTER_TOURNAMENT = process.env.REGISTER_TOURNAMENT;
const UNREGISTER_TOURNAMENT = process.env.UNREGISTER_TOURNAMENT;
// In a tournament: register, then sit out the casual lobby (don't auto-join or
// rejoin), per the docs' pre-tournament checklist. Registering implies this mode.
const TOURNAMENT_MODE = process.env.TOURNAMENT_MODE === "1" || REGISTER_TOURNAMENT !== undefined;
// Optional one-time account link: the web identity to bind via connect_id.
const LINK_IDENTITY = process.env.LINK_IDENTITY;

const persona = personaByName(process.env.BARD_PERSONA ?? "shakespeare") ?? PERSONAS.shakespeare();
const lex = Lexicon.loadFromFile(defaultWordlistPath());

let brain: Brain | null = null;
let myBotId: bigint | null = null;
let currentMatchId: bigint | null = null;

const tokenPath = () => `.token-${BOT_NAME}`;
function loadToken(): string | undefined {
  if (process.env.BOT_TOKEN?.trim()) return process.env.BOT_TOKEN.trim();
  try {
    return fs.readFileSync(tokenPath(), "utf8").trim() || undefined;
  } catch {
    return undefined;
  }
}
const saveToken = (t: string) => {
  try {
    fs.writeFileSync(tokenPath(), t);
  } catch {}
};

function main(): void {
  console.log(`The Bard (TS) -> module \`${DB_NAME}\` @ ${HOST} as '${persona.name}'`);
  DbConnection.builder()
    .withUri(HOST)
    .withDatabaseName(DB_NAME)
    .withToken(loadToken())
    .onConnect(onConnect)
    .onConnectError((_ctx, err) => console.error("connect error:", err?.message ?? err))
    .onDisconnect(() => console.log("disconnected"))
    .build();
}

function onConnect(conn: DbConnection, identity: Identity, token: string): void {
  saveToken(token);
  const cred = conn.db.bot_credential.identity.find(identity);
  myBotId = cred?.botId ?? null;
  if (myBotId === null) {
    console.error("No bot for this token — generate a fresh one at /team.");
  } else {
    console.log(`connected as bot ${myBotId}`);
  }

  // Optional: link a spacetimedb.com web identity to this credential (one-time).
  // The reliable path is the CLI: `spacetime call scrabblebot connect_id '["0x…"]'`.
  if (LINK_IDENTITY) {
    try {
      conn.reducers.connectId({ webIdentity: Identity.fromString(LINK_IDENTITY) });
      console.log("called connect_id to link", LINK_IDENTITY);
    } catch (e) {
      console.error("connect_id failed (use the `spacetime call … connect_id` CLI instead):", e);
    }
  }

  registerCallbacks(conn);

  conn
    .subscriptionBuilder()
    .onApplied(() => {
      console.log("subscriptions applied");
      handleTournamentRegistration(conn);
      if (TOURNAMENT_MODE) {
        console.log("tournament mode: staying out of the casual lobby until matches start");
      } else {
        conn.reducers.joinLobby({});
        console.log("joined lobby");
      }
    })
    .subscribeToAllTables();
}

// Register / unregister for a tournament straight from the bot process. Tournament
// matches emit the same events as casual ones, so no other code changes are needed
// — ensureMatchStarted() picks them up when the admin starts each match.
function handleTournamentRegistration(conn: DbConnection): void {
  if (UNREGISTER_TOURNAMENT) {
    try {
      conn.reducers.unregisterFromTournament({ tournamentId: BigInt(UNREGISTER_TOURNAMENT) });
      console.log(`unregistered from tournament ${UNREGISTER_TOURNAMENT}`);
    } catch (e) {
      console.error("unregisterFromTournament failed:", e);
    }
  }
  if (REGISTER_TOURNAMENT) {
    try {
      conn.reducers.registerForTournament({ tournamentId: BigInt(REGISTER_TOURNAMENT) });
      console.log(`registered for tournament ${REGISTER_TOURNAMENT}; will play its matches as they start`);
    } catch (e) {
      console.error("registerForTournament failed:", e);
    }
  }
}

function registerCallbacks(conn: DbConnection): void {
  conn.db.match_state.onInsert((_c, m) => onMatchState(conn, m));
  conn.db.match_state.onUpdate((_c, _o, m) => onMatchState(conn, m));

  conn.db.match_participant.onInsert((_c, p) => onParticipant(conn, p));
  conn.db.match_participant.onUpdate((_c, _o, p) => onParticipant(conn, p));

  conn.db.auction.onInsert((_c, a) => onAuction(conn, a));

  conn.db.auction_result.onInsert((_c, r) => onAuctionResult(conn, r));

  conn.db.word_play.onInsert((_c, wp) => onWordPlay(wp));

  conn.db.my_rack.onInsert(() => syncRack(conn));
  conn.db.my_rack.onUpdate(() => syncRack(conn));
}

function onMatchState(conn: DbConnection, m): void {
  const status = m.status.tag;
  if (status === "Running") {
    ensureMatchStarted(conn, m);
  } else if (status === "Ended") {
    if (currentMatchId !== null && m.id === currentMatchId) {
      console.log(`match ${m.id} ended; final score ${brain?.myScore ?? "?"}`);
      brain = null;
      currentMatchId = null;
    }
    if (!TOURNAMENT_MODE) conn.reducers.joinLobby({}); // roll into the next lobby
  }
}

function ensureMatchStarted(conn: DbConnection, m): void {
  if (myBotId === null || currentMatchId === m.id) return;
  const parts = [...conn.db.match_participant.iter()].filter((p) => p.matchId === m.id);
  if (!parts.some((p) => p.botId === myBotId)) return; // not our match

  const players = parts.map((p) => Number(p.botId));
  const me = Number(myBotId);
  const tilesToAuction = Math.max(0, Number(m.bagTotal) - players.length * 5);
  brain = new Brain(me, lex, persona, ScoreModel.CumulativeWordScore);
  brain.observe({ t: "MatchStart", me, players, startBalance: 100, tilesToAuction });
  currentMatchId = m.id;
  console.log(`match ${m.id} started: ${players.length} players, we are bot ${me}`);
  syncRack(conn);
}

function onParticipant(conn: DbConnection, p): void {
  if (brain && currentMatchId !== null && p.matchId === currentMatchId) {
    brain.observe({ t: "Participant", botId: Number(p.botId), balance: Number(p.balance), score: Number(p.score) });
  }
}

function onAuction(conn: DbConnection, a): void {
  if (!brain || currentMatchId === null || a.matchId !== currentMatchId) return;
  if (a.status.tag !== "Open") return;
  const idx = letterIndex(a.letter.charCodeAt(0));
  if (idx < 0) return;
  const bid = brain.decideBid(idx);
  if (bid > 0) {
    try {
      conn.reducers.submitBid({ auctionId: a.id, amount: BigInt(bid) });
    } catch (e) {
      console.error("submitBid failed:", e);
    }
  }
}

function onAuctionResult(conn: DbConnection, r): void {
  if (!brain || currentMatchId === null || r.matchId !== currentMatchId) return;
  const idx = letterIndex(r.letter.charCodeAt(0));
  const winner = r.winnerBotId == null ? null : Number(r.winnerBotId);
  brain.observe({ t: "AuctionResolved", winner, letterIdx: idx, paid: Number(r.paid) });
  trySubmitWord(conn);
}

function onWordPlay(wp): void {
  if (!brain || currentMatchId === null || wp.matchId !== currentMatchId) return;
  brain.observe({ t: "WordPlayed", botId: Number(wp.botId), word: wp.word, reward: Number(wp.totalReward) });
}

function syncRack(conn: DbConnection): void {
  if (!brain || currentMatchId === null) return;
  const counts = new Counts();
  for (const h of conn.db.my_rack.iter()) {
    if (h.matchId !== currentMatchId) continue; // my_rack spans all our matches
    const idx = letterIndex(h.letter.charCodeAt(0));
    if (idx >= 0) for (let k = 0; k < Number(h.count); k++) counts.add(idx);
  }
  let balance = brain.myBalance;
  let score = brain.myScore;
  for (const p of conn.db.match_participant.iter()) {
    if (p.matchId === currentMatchId && p.botId === myBotId) {
      balance = Number(p.balance);
      score = Number(p.score);
    }
  }
  brain.observe({ t: "RackSnapshot", rack: counts, balance, score });
  trySubmitWord(conn);
}

function trySubmitWord(conn: DbConnection): void {
  if (!brain || currentMatchId === null) return;
  const play = brain.tilesRemaining <= 10 ? brain.bestForcedWord() : brain.chooseWord();
  if (play) {
    try {
      conn.reducers.submitWord({ matchId: currentMatchId, word: play.word });
    } catch (e) {
      console.error("submitWord failed:", e);
    }
  }
}

main();
