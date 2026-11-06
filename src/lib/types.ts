export type Team = "A" | "B";
export type MatchStatus = "pending" | "completed";
export type MatchSource = "random" | "manual";

export type Player = {
  id: number;
  name: string;
};

export type Standing = Player & {
  rank: number;
  points: number;
  played: number;
  wins: number;
  losses: number;
};

export type MatchView = {
  id: string;
  status: MatchStatus;
  winner: Team | null;
  source: MatchSource;
  playedAt: number;
  teamA: Player[];
  teamB: Player[];
};

export type ActionResult = { ok: true } | { ok: false; error: string };
