/* =============================================================================
 * src/lib/db.ts
 * -----------------------------------------------------------------------------
 * RESPONSIBILITY
 *   The ONLY module that touches the database. It owns the SQLite file, the
 *   `scores` table, and the prepared statements that read/write it. Everything
 *   else (the API route, the UI) goes through the small functions exported here,
 *   so the storage engine stays swappable behind this one file — e.g. switching
 *   to a hosted Postgres for a Vercel deploy would only change THIS file.
 *
 * WHY A SINGLETON
 *   Next.js dev mode hot-reloads modules on every edit. Re-opening the SQLite
 *   file each time would leak file handles, so we cache the connection on
 *   `globalThis` and reuse it across reloads.
 *
 * RANKING (the heart of the leaderboard)
 *   ORDER BY won DESC,                                -- winners first
 *            wave_reached DESC,                       -- then deepest progress
 *            CASE WHEN won = 1 THEN time_ms END ASC,  -- winners: fastest first
 *            created_at DESC                          -- losers: most recent first
 *   So: players who cleared all 3 waves rank on top by fastest time; everyone
 *   else is grouped by how far they got (wave 3 → 2 → 1), newest run first.
 * ============================================================================= */

import path from "node:path";
import fs from "node:fs";
import Database from "better-sqlite3";
import type { NewScore, Score } from "@/types/score";

/** The DB lives in a local file under `data/` (gitignored). */
const DB_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "leaderboard.sqlite");

/** Shape of a row as stored (snake_case). Mapped to the camelCase `Score` before
 *  it leaves this module. `won` is stored as 0/1 (SQLite has no boolean). */
interface ScoreRow {
  id: number;
  name: string;
  time_ms: number;
  wave_reached: number;
  won: number;
  created_at: number;
}

/** Open (or create) the database and ensure the schema exists. */
function openDatabase(): Database.Database {
  fs.mkdirSync(DB_DIR, { recursive: true });
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL"); // better concurrent read/write behaviour
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

/* Cache the connection across dev hot-reloads (see WHY A SINGLETON above). */
const globalForDb = globalThis as unknown as { __leaderboardDb?: Database.Database };
const db = globalForDb.__leaderboardDb ?? openDatabase();
if (process.env.NODE_ENV !== "production") globalForDb.__leaderboardDb = db;

/* Prepared statements (compiled once, reused per call). */
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
const listStmt = db.prepare(
  `SELECT id, name, time_ms, wave_reached, won, created_at
     FROM scores
    ORDER BY won DESC,
             wave_reached DESC,
             CASE WHEN won = 1 THEN time_ms END ASC,
             created_at DESC
    LIMIT @limit`,
);

/** Convert a stored row into the wire shape. `rank` is filled in by the caller
 *  (it depends on position within the returned, already-sorted list). */
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

/** Record a finished run and return the stored row (with its rank in the board). */
export function insertScore(entry: NewScore): Score {
  const createdAt = Date.now();
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

/** Read the leaderboard, already ranked, capped at `limit` rows. */
export function listScores(limit = 20): Score[] {
  const rows = listStmt.all({ limit }) as ScoreRow[];
  return rows.map((row, i) => toScore(row, i + 1));
}
