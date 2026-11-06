"use server";

import { refresh } from "next/cache";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  isValidSession,
  passcodeMatches,
  safeNextPath,
  sessionToken,
} from "@/lib/auth";
import {
  completeMatch,
  countActivePlayers,
  deleteMatch,
  deletePlayer,
  insertMatch,
  insertPlayer,
  updatePlayerName,
} from "@/lib/data";
import { MAX_NAME_LENGTH, MAX_TEAM_SIZE, MIN_RANDOM_TEAM_SIZE } from "@/lib/format";
import { isValidSplit } from "@/lib/scoring";
import type { ActionResult, MatchSource, Team } from "@/lib/types";

// Server Actions are public POST endpoints: every argument is untrusted and
// every action re-checks the session instead of relying on proxy.ts.

const OK: ActionResult = { ok: true };
const fail = (error: string): ActionResult => ({ ok: false, error });
const UNAUTHORIZED = fail("Phiên đã hết hạn. Hãy tải lại trang và nhập mật khẩu.");
const INVALID = fail("Dữ liệu không hợp lệ.");
const NOT_PENDING = fail("Trận này đã có kết quả hoặc đã bị hủy.");

async function authorized() {
  return isValidSession((await cookies()).get(SESSION_COOKIE)?.value);
}

const isPlayerId = (value: unknown): value is number =>
  Number.isSafeInteger(value) && (value as number) > 0;
const isTeam = (value: unknown): value is Team => value === "A" || value === "B";
const isMatchId = (value: unknown): value is string =>
  typeof value === "string" && /^[0-9a-f-]{36}$/i.test(value);

function parseName(value: unknown) {
  if (typeof value !== "string") return null;
  const name = value.normalize("NFC").replace(/\s+/g, " ").trim();
  return name.length > 0 && name.length <= MAX_NAME_LENGTH ? name : null;
}

function parseIds(value: unknown) {
  return Array.isArray(value) && value.every(isPlayerId) ? value : null;
}

/**
 * Valid teams, or the message to show when they are not. Random draws need
 * equal teams of at least MIN_RANDOM_TEAM_SIZE; manual results may be uneven.
 */
async function parseTeams(
  rawA: unknown,
  rawB: unknown,
  source: MatchSource,
): Promise<{ teamA: number[]; teamB: number[] } | string> {
  const teamA = parseIds(rawA);
  const teamB = parseIds(rawB);
  if (!teamA || !teamB) return "Dữ liệu đội không hợp lệ.";
  if (teamA.length === 0 || teamB.length === 0) return "Mỗi đội cần ít nhất 1 người.";
  if (teamA.length > MAX_TEAM_SIZE || teamB.length > MAX_TEAM_SIZE) {
    return `Mỗi đội tối đa ${MAX_TEAM_SIZE} người.`;
  }
  if (source === "random") {
    if (teamA.length !== teamB.length) return "Hai đội phải có số người bằng nhau.";
    if (teamA.length < MIN_RANDOM_TEAM_SIZE) {
      return `Trận ngẫu nhiên cần ít nhất ${MIN_RANDOM_TEAM_SIZE} người mỗi đội.`;
    }
  } else if (!isValidSplit(teamA.length, teamB.length)) {
    return "Số người đội đông phải chia hết cho đội ít (vd 1–2, 1–3, 2–4).";
  }
  const ids = [...teamA, ...teamB];
  if (new Set(ids).size !== ids.length) return "Một người không thể ở cả hai đội.";
  if ((await countActivePlayers(ids)) !== ids.length) {
    return "Có người chơi vừa bị xóa khỏi danh sách. Hãy tải lại trang.";
  }
  return { teamA, teamB };
}

// --- Players ---------------------------------------------------------------

export async function addPlayer(rawName: unknown): Promise<ActionResult> {
  if (!(await authorized())) return UNAUTHORIZED;
  const name = parseName(rawName);
  if (!name) return fail(`Tên phải dài từ 1 đến ${MAX_NAME_LENGTH} ký tự.`);
  if (!(await insertPlayer(name))) return fail(`Đã có người chơi tên “${name}”.`);
  refresh();
  return OK;
}

export async function renamePlayer(id: unknown, rawName: unknown): Promise<ActionResult> {
  if (!(await authorized())) return UNAUTHORIZED;
  if (!isPlayerId(id)) return INVALID;
  const name = parseName(rawName);
  if (!name) return fail(`Tên phải dài từ 1 đến ${MAX_NAME_LENGTH} ký tự.`);
  const result = await updatePlayerName(id, name);
  if (result === "duplicate") return fail(`Đã có người chơi tên “${name}”.`);
  refresh();
  return result === "ok" ? OK : fail("Người chơi này đã bị xóa.");
}

export async function removePlayer(id: unknown): Promise<ActionResult> {
  if (!(await authorized())) return UNAUTHORIZED;
  if (!isPlayerId(id)) return INVALID;
  await deletePlayer(id);
  refresh();
  return OK;
}

// --- Matches ---------------------------------------------------------------

export async function startMatch(teamA: unknown, teamB: unknown): Promise<ActionResult> {
  if (!(await authorized())) return UNAUTHORIZED;
  const teams = await parseTeams(teamA, teamB, "random");
  if (typeof teams === "string") return fail(teams);
  await insertMatch({ ...teams, source: "random", winner: null, playedAt: Date.now() });
  refresh();
  return OK;
}

export async function finishMatch(matchId: unknown, winner: unknown): Promise<ActionResult> {
  if (!(await authorized())) return UNAUTHORIZED;
  if (!isMatchId(matchId) || !isTeam(winner)) return INVALID;
  const finished = await completeMatch(matchId, winner);
  refresh();
  return finished ? OK : NOT_PENDING;
}

export async function cancelMatch(matchId: unknown): Promise<ActionResult> {
  if (!(await authorized())) return UNAUTHORIZED;
  if (!isMatchId(matchId)) return INVALID;
  const cancelled = await deleteMatch(matchId, true);
  refresh();
  return cancelled ? OK : NOT_PENDING;
}

export async function recordMatch(input: unknown): Promise<ActionResult> {
  if (!(await authorized())) return UNAUTHORIZED;
  const { teamA, teamB, winner, playedAt } = (input ?? {}) as Record<string, unknown>;
  if (!isTeam(winner)) return fail("Hãy chọn đội thắng.");
  const teams = await parseTeams(teamA, teamB, "manual");
  if (typeof teams === "string") return fail(teams);

  const now = Date.now();
  const time = playedAt ?? now;
  if (typeof time !== "number" || !Number.isSafeInteger(time) || time < Date.UTC(2000, 0, 1)) {
    return fail("Thời gian không hợp lệ.");
  }
  if (time > now + 5 * 60_000) return fail("Thời gian thi đấu không thể ở tương lai.");

  await insertMatch({ ...teams, source: "manual", winner, playedAt: time });
  refresh();
  return OK;
}

export async function removeMatch(matchId: unknown): Promise<ActionResult> {
  if (!(await authorized())) return UNAUTHORIZED;
  if (!isMatchId(matchId)) return INVALID;
  await deleteMatch(matchId);
  refresh();
  return OK;
}

// --- Passcode --------------------------------------------------------------

export async function login(_prev: string | null, formData: FormData): Promise<string | null> {
  const passcode = process.env.APP_PASSCODE;
  if (passcode) {
    const input = formData.get("passcode");
    if (typeof input !== "string" || !(await passcodeMatches(input))) {
      await new Promise((resolve) => setTimeout(resolve, 500)); // slows down guessing
      return "Mật khẩu không đúng.";
    }
    const secure = (await headers()).get("x-forwarded-proto")?.startsWith("https") ?? false;
    (await cookies()).set(SESSION_COOKIE, await sessionToken(passcode), {
      httpOnly: true,
      sameSite: "lax",
      secure,
      path: "/",
      maxAge: SESSION_MAX_AGE,
    });
  }
  redirect(safeNextPath(formData.get("next")));
}
