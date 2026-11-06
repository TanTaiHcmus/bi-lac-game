import { Trophy } from "lucide-react";
import { TEAM_SHORT, formatPoints } from "@/lib/format";
import { pointsEach } from "@/lib/scoring";
import type { MatchView, Player, Team } from "@/lib/types";
import { cn } from "./ui";

export const TEAMS: Team[] = ["A", "B"];

// Red plays from the left, blue from the right, like the two sides of the table.
export const TEAM_STYLE: Record<
  Team,
  { token: string; soft: string; text: string; bar: string; ring: string; label: string }
> = {
  A: {
    token: "bg-rose-600 text-white",
    soft: "bg-rose-50",
    text: "text-rose-600",
    bar: "bg-rose-500",
    ring: "ring-rose-500",
    label: "text-rose-200",
  },
  B: {
    token: "bg-sky-600 text-white",
    soft: "bg-sky-50",
    text: "text-sky-600",
    bar: "bg-sky-500",
    ring: "ring-sky-500",
    label: "text-sky-200",
  },
};

export function joinNames(players: Player[]) {
  return players.map((p) => p.name).join(", ");
}

/** Both lineups drawn on a foosball pitch: red on the left half, blue on the right. */
export function Pitch({ teamA, teamB }: { teamA: Player[]; teamB: Player[] }) {
  return (
    <div className="pitch-stripes relative overflow-hidden rounded-3xl bg-pitch-700 p-4 text-white shadow-lg ring-4 ring-pitch-900/15">
      <div aria-hidden className="absolute inset-2.5 rounded-[1.25rem] border-2 border-white/20" />
      <div aria-hidden className="absolute inset-y-2.5 left-1/2 w-0.5 -translate-x-1/2 bg-white/20" />
      <div
        aria-hidden
        className="absolute top-1/2 left-1/2 size-24 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/20"
      />
      <div className="relative grid min-h-48 grid-cols-2 items-center gap-12 py-3">
        <Lineup team="A" players={teamA} />
        <Lineup team="B" players={teamB} />
      </div>
      <span className="absolute top-1/2 left-1/2 grid size-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white font-display text-lg font-extrabold text-pitch-800 italic shadow-md">
        VS
      </span>
    </div>
  );
}

function Lineup({ team, players }: { team: Team; players: Player[] }) {
  const style = TEAM_STYLE[team];
  return (
    <div className={cn("flex min-w-0 flex-col gap-2", team === "B" ? "items-end" : "items-start")}>
      <span className={cn("font-display text-sm font-bold tracking-[0.2em] uppercase", style.label)}>
        Đội {TEAM_SHORT[team]}
      </span>
      <ul aria-label={`Đội ${TEAM_SHORT[team]}`} className="contents">
        {players.map((player) => (
          <li
            key={player.id}
            className={cn(
              "max-w-full truncate rounded-full px-4 py-2 text-lg leading-tight font-semibold shadow-md ring-2 ring-white/25",
              style.token,
            )}
          >
            {player.name}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** What a result does to the table: "+1 mỗi người: Đệ, Tài, Phước" / "−3: Bảo". */
export function ScoreLines({
  winners,
  losers,
  tone = "light",
}: {
  winners: Player[];
  losers: Player[];
  tone?: "light" | "dark";
}) {
  const dark = tone === "dark";
  const lines = [
    { key: "win", players: winners, points: pointsEach(winners.length, losers.length) },
    { key: "lose", players: losers, points: -pointsEach(losers.length, winners.length) },
  ];
  return (
    <ul className={cn("space-y-0.5 text-sm", dark ? "text-white/80" : "text-zinc-600")}>
      {lines.map(({ key, players, points }) => (
        <li key={key}>
          <span
            className={cn(
              "font-display text-lg font-bold tabular-nums",
              points > 0
                ? dark ? "text-lime-300" : "text-pitch-600"
                : dark ? "text-rose-300" : "text-rose-600",
            )}
          >
            {formatPoints(points)}
          </span>
          {players.length > 1 && " mỗi người"}: {joinNames(players)}
        </li>
      ))}
    </ul>
  );
}

/** One line per team with the points each member got. */
export function MatchResult({ match }: { match: MatchView }) {
  return (
    <div className="space-y-1.5">
      {TEAMS.map((team) => {
        const won = match.winner === team;
        const players = team === "A" ? match.teamA : match.teamB;
        const opponents = team === "A" ? match.teamB : match.teamA;
        const points = pointsEach(players.length, opponents.length);
        return (
          <div key={team} className="flex items-center gap-2.5">
            <span
              aria-hidden
              className={cn("h-6 w-1 shrink-0 rounded-full", TEAM_STYLE[team].bar, !won && "opacity-35")}
            />
            <p className={cn("min-w-0 flex-1 text-sm", won ? "font-semibold text-zinc-900" : "text-zinc-500")}>
              <span
                className={cn(
                  "mr-1.5 font-display text-sm font-bold tracking-wider uppercase",
                  TEAM_STYLE[team].text,
                  !won && "opacity-60",
                )}
              >
                {TEAM_SHORT[team]}
              </span>
              {joinNames(players)}
            </p>
            {won ? (
              <span className="flex shrink-0 items-center gap-1 font-display text-lg font-bold text-pitch-600">
                <Trophy aria-hidden className="size-4" />
                Thắng {formatPoints(points)}
              </span>
            ) : (
              <span className="shrink-0 font-display text-lg font-semibold text-zinc-400">
                Thua {formatPoints(-points)}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
