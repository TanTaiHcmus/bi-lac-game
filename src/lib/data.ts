import "server-only";
import { io } from "next/cache";
import type { Row } from "@libsql/client";
import { getDb, REBUILD_STATS } from "./db";
import type {
  MatchSource,
  MatchStatus,
  MatchView,
  Player,
  Standing,
  Team,
} from "./types";

const collator = new Intl.Collator("vi");
const byName = (a: Player, b: Player) => collator.compare(a.name, b.name);

/** Case-insensitive key used to keep active player names unique. */
export function nameKey(name: string) {
  return name.normalize("NFC").toLocaleLowerCase("vi");
}

// ---------------------------------------------------------------------------
// Reads. Each one awaits io() so its result never lands in the static shell.
// ---------------------------------------------------------------------------

export async function getPlayers(): Promise<Player[]> {
  await io();
  const db = await getDb();
  const { rows } = await db.execute(
    "SELECT id, name FROM players WHERE deleted_at IS NULL",
  );
  return rows
    .map((row) => ({ id: Number(row.id), name: String(row.name) }))
    .sort(byName);
}

/** Every active player with their record, best first. Records come from REBUILD_STATS in db.ts. */
export async function getStandings(): Promise<Standing[]> {
  await io();
  const db = await getDb();
  // No player_stats row yet means no finished match yet.
  const { rows } = await db.execute(`
    SELECT p.id, p.name,
           COALESCE(s.played, 0) AS played,
           COALESCE(s.wins, 0) AS wins,
           COALESCE(s.points, 0) AS points
    FROM players p
    LEFT JOIN player_stats s ON s.player_id = p.id
    WHERE p.deleted_at IS NULL
  `);

  const sorted = rows
    .map((row) => {
      const played = Number(row.played);
      const wins = Number(row.wins);
      return {
        id: Number(row.id),
        name: String(row.name),
        played,
        wins,
        losses: played - wins,
        points: Number(row.points),
      };
    })
    .sort((a, b) => b.points - a.points || b.wins - a.wins || byName(a, b));

  // Players on the same points share a rank (1, 2, 2, 4).
  const standings: Standing[] = [];
  for (const [i, player] of sorted.entries()) {
    const prev = standings[i - 1];
    standings.push({
      ...player,
      rank: prev && prev.points === player.points ? prev.rank : i + 1,
    });
  }
  return standings;
}

const MATCH_ROW_COLUMNS = `
  m.id, m.status, m.winner, m.source, m.played_at,
  mp.team, p.id AS player_id, p.name AS player_name
`;

/** Folds one row per participant into one MatchView per match, keeping row order. */
function groupMatches(rows: Row[]): MatchView[] {
  const matches = new Map<string, MatchView>();
  for (const row of rows) {
    const id = String(row.id);
    let match = matches.get(id);
    if (!match) {
      match = {
        id,
        status: row.status as MatchStatus,
        winner: (row.winner as Team | null) ?? null,
        source: row.source as MatchSource,
        playedAt: Number(row.played_at),
        teamA: [],
        teamB: [],
      };
      matches.set(id, match);
    }
    const player = { id: Number(row.player_id), name: String(row.player_name) };
    (row.team === "A" ? match.teamA : match.teamB).push(player);
  }
  for (const match of matches.values()) {
    match.teamA.sort(byName);
    match.teamB.sort(byName);
  }
  return [...matches.values()];
}

export async function getPendingMatches(): Promise<MatchView[]> {
  await io();
  const db = await getDb();
  const { rows } = await db.execute(`
    SELECT ${MATCH_ROW_COLUMNS}
    FROM matches m
    JOIN match_players mp ON mp.match_id = m.id
    JOIN players p ON p.id = mp.player_id
    WHERE m.status = 'pending'
    ORDER BY m.created_at DESC
  `);
  return groupMatches(rows);
}

export async function getMatchHistory(
  page: number,
  pageSize: number,
): Promise<{ matches: MatchView[]; total: number }> {
  await io();
  const db = await getDb();
  const [list, count] = await db.batch(
    [
      {
        sql: `
          SELECT ${MATCH_ROW_COLUMNS}
          FROM (
            SELECT * FROM matches
            WHERE status = 'completed'
            ORDER BY played_at DESC, created_at DESC
            LIMIT ? OFFSET ?
          ) m
          JOIN match_players mp ON mp.match_id = m.id
          JOIN players p ON p.id = mp.player_id
          ORDER BY m.played_at DESC, m.created_at DESC
        `,
        args: [pageSize, (page - 1) * pageSize],
      },
      // Kept by REBUILD_STATS, so paging doesn't count every match.
      "SELECT value AS total FROM meta WHERE key = 'completed_matches'",
    ],
    "deferred",
  );
  return { matches: groupMatches(list.rows), total: Number(count.rows[0]?.total ?? 0) };
}

// ---------------------------------------------------------------------------
// Writes. Called from Server Actions after input has been validated.
// ---------------------------------------------------------------------------

/** Returns false when an active player already uses this name. */
export async function insertPlayer(name: string): Promise<boolean> {
  const db = await getDb();
  const key = nameKey(name);
  const { rowsAffected } = await db.execute({
    sql: `
      INSERT INTO players (name, name_key, created_at)
      SELECT ?, ?, ?
      WHERE NOT EXISTS (
        SELECT 1 FROM players WHERE name_key = ? AND deleted_at IS NULL
      )
    `,
    args: [name, key, Date.now(), key],
  });
  return rowsAffected > 0;
}

export async function updatePlayerName(
  id: number,
  name: string,
): Promise<"ok" | "duplicate" | "not-found"> {
  const db = await getDb();
  const key = nameKey(name);
  const { rowsAffected } = await db.execute({
    sql: `
      UPDATE players SET name = ?, name_key = ?
      WHERE id = ? AND deleted_at IS NULL
        AND NOT EXISTS (
          SELECT 1 FROM players
          WHERE name_key = ? AND deleted_at IS NULL AND id != ?
        )
    `,
    args: [name, key, id, key, id],
  });
  if (rowsAffected > 0) return "ok";
  const { rows } = await db.execute({
    sql: "SELECT 1 FROM players WHERE id = ? AND deleted_at IS NULL",
    args: [id],
  });
  return rows.length > 0 ? "duplicate" : "not-found";
}

/** Soft delete: the player leaves lists and the leaderboard, past matches keep their name. */
export async function deletePlayer(id: number): Promise<boolean> {
  const db = await getDb();
  const { rowsAffected } = await db.execute({
    sql: "UPDATE players SET deleted_at = ? WHERE id = ? AND deleted_at IS NULL",
    args: [Date.now(), id],
  });
  return rowsAffected > 0;
}

export async function countActivePlayers(ids: number[]): Promise<number> {
  const db = await getDb();
  const { rows } = await db.execute({
    sql: `SELECT COUNT(*) AS n FROM players
          WHERE deleted_at IS NULL AND id IN (${ids.map(() => "?").join(", ")})`,
    args: ids,
  });
  return Number(rows[0].n);
}

export async function insertMatch(match: {
  teamA: number[];
  teamB: number[];
  source: MatchSource;
  winner: Team | null;
  playedAt: number;
}): Promise<void> {
  const db = await getDb();
  // The id is generated here so the match and its players go out in one atomic batch.
  const id = crypto.randomUUID();
  const addPlayer = (playerId: number, team: Team) => ({
    sql: "INSERT INTO match_players (match_id, player_id, team) VALUES (?, ?, ?)",
    args: [id, playerId, team],
  });
  await db.batch(
    [
      {
        sql: `INSERT INTO matches (id, status, winner, source, played_at, created_at)
              VALUES (?, ?, ?, ?, ?, ?)`,
        args: [
          id,
          match.winner ? "completed" : "pending",
          match.winner,
          match.source,
          match.playedAt,
          Date.now(),
        ],
      },
      ...match.teamA.map((playerId) => addPlayer(playerId, "A")),
      ...match.teamB.map((playerId) => addPlayer(playerId, "B")),
      // A match recorded with its result counts straight away.
      ...(match.winner ? REBUILD_STATS : []),
    ],
    "write",
  );
}

/** Returns false when the match is no longer pending (finished or cancelled elsewhere). */
export async function completeMatch(id: string, winner: Team): Promise<boolean> {
  const db = await getDb();
  const [{ rowsAffected }] = await db.batch(
    [
      {
        sql: `UPDATE matches SET status = 'completed', winner = ?, played_at = ?
              WHERE id = ? AND status = 'pending'`,
        args: [winner, Date.now(), id],
      },
      ...REBUILD_STATS,
    ],
    "write",
  );
  return rowsAffected > 0;
}

/** Deletes a match and its participants. With pendingOnly, finished matches are left alone. */
export async function deleteMatch(id: string, pendingOnly = false): Promise<boolean> {
  const db = await getDb();
  const statusFilter = pendingOnly ? "AND status = 'pending'" : "";
  const [, deleted] = await db.batch(
    [
      {
        sql: `DELETE FROM match_players
              WHERE match_id IN (SELECT id FROM matches WHERE id = ? ${statusFilter})`,
        args: [id],
      },
      { sql: `DELETE FROM matches WHERE id = ? ${statusFilter}`, args: [id] },
      // Cancelling a match that never finished leaves everyone's points as they were.
      ...(pendingOnly ? [] : REBUILD_STATS),
    ],
    "write",
  );
  return deleted.rowsAffected > 0;
}
