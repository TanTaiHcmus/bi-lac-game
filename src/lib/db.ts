import "server-only";
import { mkdirSync } from "node:fs";
import type { Client } from "@libsql/client";

const SCHEMA = `
CREATE TABLE IF NOT EXISTS players (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  name_key TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  deleted_at INTEGER
);
CREATE UNIQUE INDEX IF NOT EXISTS players_active_name_key
  ON players (name_key) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS matches (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed')),
  winner TEXT CHECK (winner IN ('A', 'B')),
  source TEXT NOT NULL CHECK (source IN ('random', 'manual')),
  played_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  CHECK ((status = 'pending') = (winner IS NULL))
);
CREATE INDEX IF NOT EXISTS matches_status_played_at
  ON matches (status, played_at);

CREATE TABLE IF NOT EXISTS match_players (
  match_id TEXT NOT NULL REFERENCES matches (id) ON DELETE CASCADE,
  player_id INTEGER NOT NULL REFERENCES players (id),
  team TEXT NOT NULL CHECK (team IN ('A', 'B')),
  PRIMARY KEY (match_id, player_id)
);
CREATE INDEX IF NOT EXISTS match_players_player_id
  ON match_players (player_id);

CREATE TABLE IF NOT EXISTS player_stats (
  player_id INTEGER PRIMARY KEY REFERENCES players (id),
  played INTEGER NOT NULL,
  wins INTEGER NOT NULL,
  points INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS meta (
  key TEXT PRIMARY KEY,
  value INTEGER NOT NULL
);
`;

// Bump when the schema or the scoring rule changes: each database rebuilds its derived data on
// the next start, and a dev server that hot-reloaded the new code opens a fresh client.
const SCHEMA_VERSION = 1;

/**
 * Recomputes player_stats and the completed-match count from the match history. Every change to
 * a finished match runs this in the same write batch, so the leaderboard reads one row per player
 * instead of the whole history (Turso bills by rows read), and the totals can't drift from it.
 * Scoring rule (lib/scoring.ts): a match is worth the bigger team's size, split evenly per side.
 */
export const REBUILD_STATS = [
  "DELETE FROM player_stats",
  `WITH team_sizes AS (
     SELECT match_id, SUM(team = 'A') AS a, SUM(team = 'B') AS b
     FROM match_players
     GROUP BY match_id
   )
   INSERT INTO player_stats (player_id, played, wins, points)
   SELECT mp.player_id,
          COUNT(*),
          SUM(m.winner = mp.team),
          SUM(CASE WHEN m.winner = mp.team THEN 1 ELSE -1 END
              * MAX(s.a, s.b) / CASE mp.team WHEN 'A' THEN s.a ELSE s.b END)
   FROM match_players mp
   JOIN matches m ON m.id = mp.match_id AND m.status = 'completed'
   JOIN team_sizes s ON s.match_id = m.id
   GROUP BY mp.player_id`,
  `INSERT INTO meta (key, value)
   VALUES ('completed_matches', (SELECT COUNT(*) FROM matches WHERE status = 'completed'))
   ON CONFLICT (key) DO UPDATE SET value = excluded.value`,
];

async function connect(): Promise<Client> {
  const url = process.env.TURSO_DATABASE_URL;
  if (url) {
    // The HTTP client is pure JS, so serverless runtimes never load the native SQLite binding.
    const { createClient } = await import("@libsql/client/http");
    return createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
  }
  if (process.env.VERCEL) {
    throw new Error(
      "Thiếu TURSO_DATABASE_URL: Vercel không lưu được file SQLite, hãy cấu hình Turso (xem README).",
    );
  }
  const { createClient } = await import("@libsql/client/sqlite3");
  mkdirSync("data", { recursive: true });
  const client = createClient({ url: "file:data/bilac.db" });
  await client.executeMultiple("PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;");
  return client;
}

async function init(): Promise<Client> {
  const client = await connect();
  await client.executeMultiple(SCHEMA);
  // Fills player_stats for databases made before it existed, or before a scoring rule change.
  const { rows } = await client.execute("SELECT value FROM meta WHERE key = 'schema_version'");
  if (Number(rows[0]?.value) !== SCHEMA_VERSION) {
    await client.batch(
      [
        ...REBUILD_STATS,
        {
          sql: `INSERT INTO meta (key, value) VALUES ('schema_version', ?)
                ON CONFLICT (key) DO UPDATE SET value = excluded.value`,
          args: [SCHEMA_VERSION],
        },
      ],
      "write",
    );
  }
  return client;
}

const globalForDb = globalThis as typeof globalThis & {
  bilacDb?: { version: number; client: Promise<Client> };
};

/**
 * One client per server process; tables are created on first use. `next dev` keeps globalThis
 * across hot reloads, so the version check stops new code from reusing a client set up for an
 * older schema.
 */
export function getDb(): Promise<Client> {
  if (globalForDb.bilacDb?.version !== SCHEMA_VERSION) {
    const client = init().catch((error: unknown) => {
      globalForDb.bilacDb = undefined;
      throw error;
    });
    globalForDb.bilacDb = { version: SCHEMA_VERSION, client };
  }
  return globalForDb.bilacDb.client;
}
