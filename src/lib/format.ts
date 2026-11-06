import type { MatchSource, Team } from "./types";

export const MAX_TEAM_SIZE = 10;
/** Random draws start at 2 vs 2; 1 vs 1 and uneven games go through manual recording. */
export const MIN_RANDOM_TEAM_SIZE = 2;
export const MAX_NAME_LENGTH = 40;

export const TEAM_NAME: Record<Team, string> = { A: "Đội Đỏ", B: "Đội Xanh" };
export const TEAM_SHORT: Record<Team, string> = { A: "Đỏ", B: "Xanh" };
export const SOURCE_LABEL: Record<MatchSource, string> = {
  random: "Ngẫu nhiên",
  manual: "Ghi tay",
};

/** +3, 0, −2 */
export function formatPoints(points: number) {
  if (points > 0) return `+${points}`;
  if (points < 0) return `−${Math.abs(points)}`;
  return "0";
}

// Times are formatted on the server (in a fixed time zone) and passed down as
// strings, so hydration never depends on the browser's clock or locale data.
const TIME_ZONE = "Asia/Ho_Chi_Minh";
const timeOnly = new Intl.DateTimeFormat("vi-VN", {
  timeZone: TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
});
const dayKeyFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const dayLabelFormat = new Intl.DateTimeFormat("vi-VN", {
  timeZone: TIME_ZONE,
  weekday: "long",
  day: "2-digit",
  month: "2-digit",
});

export function formatTime(ms: number) {
  return timeOnly.format(ms);
}

/** Calendar day in Vietnam, e.g. "2026-11-05"; used to group matches by day. */
export function dayKey(ms: number) {
  return dayKeyFormat.format(ms);
}

/** "Hôm nay", "Hôm qua" or "Thứ Ba, 03/11". */
export function formatDay(ms: number, now: number) {
  const key = dayKey(ms);
  if (key === dayKey(now)) return "Hôm nay";
  if (key === dayKey(now - 86_400_000)) return "Hôm qua";
  return dayLabelFormat.format(ms);
}
