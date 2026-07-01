// The backend for the leaderboard. Exporting GET and POST from this file is the
// API:
//   GET  /api/scores[?limit=N]  → the ranked leaderboard
//   POST /api/scores            → record one finished run
// Runs on the Node runtime because better-sqlite3 is a native module.

import { NextResponse } from "next/server";
import { insertScore, listScores } from "@/lib/db";
import type { NewScore } from "@/types/score";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 20;
const MAX_NAME_LENGTH = 20;
const TOTAL_WAVES = 3;

// GET /api/scores?limit=N — return the ranked leaderboard.
export function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const raw = Number(searchParams.get("limit"));
  const limit =
    Number.isFinite(raw) && raw > 0 ? Math.min(Math.floor(raw), MAX_LIMIT) : DEFAULT_LIMIT;

  const scores = listScores(limit);
  return NextResponse.json({ scores });
}

// Validate and normalise a POST body into a clean NewScore, or explain why not.
function parseBody(body: unknown): { ok: true; value: NewScore } | { ok: false; error: string } {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Request body must be a JSON object." };
  }
  const { name, timeMs, waveReached, won } = body as Record<string, unknown>;

  if (typeof name !== "string" || name.trim().length === 0) {
    return { ok: false, error: "`name` is required." };
  }
  if (typeof timeMs !== "number" || !Number.isFinite(timeMs) || timeMs <= 0) {
    return { ok: false, error: "`timeMs` must be a positive number." };
  }
  if (
    typeof waveReached !== "number" ||
    !Number.isInteger(waveReached) ||
    waveReached < 1 ||
    waveReached > TOTAL_WAVES
  ) {
    return { ok: false, error: `\`waveReached\` must be an integer 1..${TOTAL_WAVES}.` };
  }
  if (typeof won !== "boolean") {
    return { ok: false, error: "`won` must be a boolean." };
  }

  return {
    ok: true,
    value: {
      name: name.trim().slice(0, MAX_NAME_LENGTH),
      timeMs: Math.round(timeMs),
      waveReached,
      won,
    },
  };
}

// POST /api/scores — record a finished run, returning the stored entry.
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = parseBody(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const score = insertScore(parsed.value);
  return NextResponse.json({ score }, { status: 201 });
}
