"use client";

import { useState } from "react";
import Link from "next/link";
import { Clock, Plus, Save, Trophy, X } from "lucide-react";
import { recordMatch } from "@/app/actions";
import { MAX_TEAM_SIZE, TEAM_NAME, TEAM_SHORT } from "@/lib/format";
import { isValidSplit } from "@/lib/scoring";
import type { Player, Team } from "@/lib/types";
import { ScoreLines, TEAM_STYLE, TEAMS } from "./match-view";
import { useToast } from "./toast";
import {
  Avatar,
  Button,
  Content,
  Dock,
  EmptyState,
  ErrorText,
  Hero,
  HeroStat,
  Screen,
  cn,
  inputClass,
} from "./ui";
import { useAction } from "./use-action";

const BACK = { href: "/more", label: "Thêm" };

/**
 * Enter a match played without the random draw: tap names into the red or
 * blue column, pick the winner, save. Teams may be uneven when the bigger one
 * is a multiple of the smaller; points are then split evenly.
 */
export function MatchRecorder({ players }: { players: Player[] }) {
  const [assigned, setAssigned] = useState<ReadonlyMap<number, Team>>(new Map());
  // The column a tapped name goes into.
  const [target, setTarget] = useState<Team>("A");
  const [winner, setWinner] = useState<Team | null>(null);
  // null means "now"; otherwise the datetime-local value.
  const [playedAt, setPlayedAt] = useState<string | null>(null);
  const { pending, error, setError, run } = useAction();
  const toast = useToast();

  const members: Record<Team, Player[]> = {
    A: players.filter((p) => assigned.get(p.id) === "A"),
    B: players.filter((p) => assigned.get(p.id) === "B"),
  };
  const unassigned = players.filter((p) => !assigned.has(p.id));
  const sizeA = members.A.length;
  const sizeB = members.B.length;

  const problem =
    sizeA + sizeB === 0
      ? "Chạm tên để xếp người vào hai đội."
      : sizeA === 0 || sizeB === 0
        ? "Mỗi đội cần ít nhất 1 người."
        : !isValidSplit(sizeA, sizeB)
          ? `${sizeA} – ${sizeB} không chia đều được: đội đông phải gấp 1, 2, 3… lần đội ít.`
          : Math.max(sizeA, sizeB) > MAX_TEAM_SIZE
            ? `Mỗi đội tối đa ${MAX_TEAM_SIZE} người.`
            : winner === null
              ? "Chọn đội thắng."
              : null;

  function place(id: number, team: Team | null) {
    const next = new Map(assigned);
    if (team) next.set(id, team);
    else next.delete(id);
    setAssigned(next);
    setError(null);
  }

  function save() {
    if (problem || winner === null) return;
    run(
      () =>
        recordMatch({
          teamA: members.A.map((p) => p.id),
          teamB: members.B.map((p) => p.id),
          winner,
          // datetime-local has no zone; the browser reads it as local time.
          playedAt: playedAt ? new Date(playedAt).getTime() : undefined,
        }),
      () => {
        toast(`Đã lưu: ${TEAM_NAME[winner]} thắng.`);
        setAssigned(new Map());
        setTarget("A");
        setWinner(null);
        setPlayedAt(null);
      },
    );
  }

  const hero = (
    <Hero
      title="Ghi tay"
      back={BACK}
      aside={<HeroStat value={`${sizeA}–${sizeB}`} label="Đỏ – Xanh" />}
    />
  );

  if (players.length < 2) {
    return (
      <Screen>
        {hero}
        <Content>
          <EmptyState>
            Cần ít nhất 2 người chơi.{" "}
            <Link href="/players" className="font-semibold text-pitch-700 underline">
              Thêm người chơi
            </Link>
          </EmptyState>
        </Content>
      </Screen>
    );
  }

  return (
    <Screen>
      {hero}
      <Content className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          {TEAMS.map((team) => (
            <TeamColumn
              key={team}
              team={team}
              players={members[team]}
              active={target === team}
              onActivate={() => setTarget(team)}
              onRemove={(id) => place(id, null)}
            />
          ))}
        </div>

        <section>
          <p className="mb-2 px-1 text-sm text-zinc-500">
            {unassigned.length > 0 ? (
              <>
                Chạm tên để thêm vào{" "}
                <strong className={cn("font-display text-base font-bold uppercase", TEAM_STYLE[target].text)}>
                  {TEAM_NAME[target]}
                </strong>
              </>
            ) : (
              "Đã xếp hết người chơi."
            )}
          </p>
          <div className="flex flex-wrap gap-2">
            {unassigned.map((player) => (
              <button
                key={player.id}
                type="button"
                onClick={() => place(player.id, target)}
                className="flex h-11 items-center gap-2 rounded-full bg-white py-1 pr-4 pl-1 text-sm font-semibold text-zinc-800 shadow-sm ring-1 ring-black/5 transition active:scale-95"
              >
                <Avatar player={player} className="size-9 text-lg" />
                {player.name}
              </button>
            ))}
          </div>
        </section>

        <div className="flex min-h-12 items-center gap-2 px-1 text-sm text-zinc-600">
          <Clock aria-hidden className="size-4 shrink-0" />
          {playedAt === null ? (
            <>
              <span>Đá lúc: bây giờ</span>
              <Button variant="ghost" size="sm" className="text-pitch-700" onClick={() => setPlayedAt("")}>
                Đổi giờ
              </Button>
            </>
          ) : (
            <>
              <label htmlFor="played-at" className="sr-only">
                Thời gian thi đấu
              </label>
              <input
                id="played-at"
                type="datetime-local"
                value={playedAt}
                onChange={(event) => setPlayedAt(event.target.value)}
                className={cn(inputClass, "h-11")}
              />
              <Button variant="ghost" size="icon" aria-label="Dùng giờ hiện tại" onClick={() => setPlayedAt(null)}>
                <X aria-hidden className="size-4" />
              </Button>
            </>
          )}
        </div>
      </Content>

      <Dock>
        {error ? (
          <ErrorText tone="dark">{error}</ErrorText>
        ) : problem ? (
          <p className="text-center text-sm text-white/70">{problem}</p>
        ) : (
          winner && (
            <ScoreLines
              tone="dark"
              winners={members[winner]}
              losers={members[winner === "A" ? "B" : "A"]}
            />
          )
        )}
        <div role="group" aria-label="Đội thắng" className="grid grid-cols-2 gap-2">
          {TEAMS.map((team) => (
            <button
              key={team}
              type="button"
              aria-pressed={winner === team}
              onClick={() => {
                setWinner(team);
                setError(null);
              }}
              className={cn(
                "flex h-12 items-center justify-center gap-2 rounded-xl font-display text-lg font-bold tracking-wide uppercase transition",
                winner === team
                  ? cn(TEAM_STYLE[team].token, "ring-2 ring-yellow-300")
                  : "bg-white/10 text-white/75",
              )}
            >
              <Trophy aria-hidden className="size-4" />
              {TEAM_SHORT[team]} thắng
            </button>
          ))}
        </div>
        <Button size="xl" className="w-full" loading={pending} disabled={problem !== null} onClick={save}>
          {!pending && <Save aria-hidden className="size-5" />}
          Lưu kết quả
        </Button>
      </Dock>
    </Screen>
  );
}

function TeamColumn({
  team,
  players,
  active,
  onActivate,
  onRemove,
}: {
  team: Team;
  players: Player[];
  active: boolean;
  onActivate: () => void;
  onRemove: (id: number) => void;
}) {
  const style = TEAM_STYLE[team];
  return (
    <div
      className={cn(
        "flex min-h-44 flex-col rounded-2xl p-2 ring-2 transition-colors",
        style.soft,
        active ? style.ring : "ring-transparent",
      )}
    >
      <button
        type="button"
        aria-pressed={active}
        aria-label={`Thêm người vào ${TEAM_NAME[team]}`}
        onClick={onActivate}
        className="flex items-center justify-between gap-1.5 rounded-xl px-2 py-1"
      >
        <span className={cn("font-display text-2xl font-extrabold uppercase italic", style.text)}>
          {TEAM_SHORT[team]}
        </span>
        {active ? (
          <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-bold whitespace-nowrap uppercase", style.token)}>
            Đang chọn
          </span>
        ) : (
          <span className="grid size-7 place-items-center rounded-full bg-white text-zinc-500 shadow-sm">
            <Plus aria-hidden className="size-4" strokeWidth={2.5} />
          </span>
        )}
      </button>
      <ul className="mt-1.5 flex flex-1 flex-col gap-1.5">
        {players.map((player) => (
          <li key={player.id}>
            <button
              type="button"
              aria-label={`Bỏ ${player.name} khỏi ${TEAM_NAME[team]}`}
              onClick={() => onRemove(player.id)}
              className={cn(
                "flex h-10 w-full items-center justify-between gap-1 rounded-xl pr-2 pl-3 text-sm font-semibold shadow-sm transition active:scale-95",
                style.token,
              )}
            >
              <span className="truncate">{player.name}</span>
              <X aria-hidden className="size-4 shrink-0 opacity-70" />
            </button>
          </li>
        ))}
        {players.length === 0 && (
          <li className="flex flex-1">
            <button
              type="button"
              onClick={onActivate}
              className="flex flex-1 items-center justify-center rounded-xl border-2 border-dashed border-zinc-300 px-2 text-center text-xs text-zinc-500"
            >
              {active ? "Chạm tên bên dưới" : "Chạm để xếp vào đây"}
            </button>
          </li>
        )}
      </ul>
    </div>
  );
}
