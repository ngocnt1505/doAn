// The only module that touches the database. It owns the SQLite file, the
// `scores` table, and the prepared statements, so the storage engine stays
// swappable behind this one file.

import path from "node:path";
import fs from "node:fs";
import Database from "better-sqlite3";
import type { NewScore, Score } from "@/types/score";

// The DB lives in a local file under `data/`.
const DB_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "leaderboard.sqlite");

// Shape of a row as stored (snake_case); `won` is 0/1.
interface ScoreRow {
  id: number;
  name: string;
  time_ms: number;
  wave_reached: number;
  won: number;
  created_at: number;
}

// Open (or create) the database and ensure the schema exists.
function openDatabase(): Database.Database {
  fs.mkdirSync(DB_DIR, { recursive: true });
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS scores (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      name         TEXT    NOT NULL,
      time_ms      INTEGER NOT NULL,
      wave_reached INTEGER NOT NULL,
      won          INTEGER NOT NULL,
      created_at   INTEGER NOT NULL
    );
  `);
  return db;
}

// Cache the connection across dev hot-reloads to avoid leaking file handles.
const globalForDb = globalThis as unknown as { __leaderboardDb?: Database.Database };
const db = globalForDb.__leaderboardDb ?? openDatabase();
if (process.env.NODE_ENV !== "production") globalForDb.__leaderboardDb = db;

// Prepared statements (compiled once, reused per call).
const insertStmt = db.prepare(
  `INSERT INTO scores (name, time_ms, wave_reached, won, created_at)
   VALUES (@name, @timeMs, @waveReached, @won, @createdAt)`,
);
const recentDuplicateStmt = db.prepare(
  `SELECT id, name, time_ms, wave_reached, won, created_at
     FROM scores
    WHERE name = @name
      AND time_ms = @timeMs
      AND wave_reached = @waveReached
      AND won = @won
      AND created_at >= @createdAfter
    ORDER BY created_at DESC
    LIMIT 1`,
);
// The ranking query: winners first, then deepest wave, then fastest time, then
// most recent.
const listStmt = db.prepare(
  `SELECT id, name, time_ms, wave_reached, won, created_at
     FROM scores
    ORDER BY won DESC,
             wave_reached DESC,
             CASE WHEN won = 1 THEN time_ms END ASC,
             created_at DESC
    LIMIT @limit`,
);

// Convert a stored row into the wire shape.
function toScore(row: ScoreRow, rank: number): Score {
  return {
    id: row.id,
    name: row.name,
    timeMs: row.time_ms,
    waveReached: row.wave_reached,
    won: row.won === 1,
    createdAt: row.created_at,
    rank,
  };
}

// Record a finished run and return the stored row (with its rank).
export function insertScore(entry: NewScore): Score {
  const createdAt = Date.now();
  // Guard against a duplicate submit within a short window.
  const duplicate = recentDuplicateStmt.get({
    name: entry.name,
    timeMs: entry.timeMs,
    waveReached: entry.waveReached,
    won: entry.won ? 1 : 0,
    createdAfter: createdAt - 10_000,
  }) as ScoreRow | undefined;
  if (duplicate) {
    const board = listScores(1000);
    return board.find((s) => s.id === duplicate.id) ?? toScore(duplicate, board.length + 1);
  }

  const info = insertStmt.run({
    name: entry.name,
    timeMs: entry.timeMs,
    waveReached: entry.waveReached,
    won: entry.won ? 1 : 0,
    createdAt,
  });
  const id = Number(info.lastInsertRowid);
  // Find this entry's rank by reading the board back and locating its id.
  const board = listScores(1000);
  const found = board.find((s) => s.id === id);
  return (
    found ?? {
      id,
      name: entry.name,
      timeMs: entry.timeMs,
      waveReached: entry.waveReached,
      won: entry.won,
      createdAt,
      rank: board.length + 1,
    }
  );
}

// Read the leaderboard, already ranked, capped at `limit` rows.
export function listScores(limit = 20): Score[] {
  const rows = listStmt.all({ limit }) as ScoreRow[];
  return rows.map((row, i) => toScore(row, i + 1));
}
