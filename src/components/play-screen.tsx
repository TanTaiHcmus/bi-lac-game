"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Armchair,
  Check,
  ChevronLeft,
  ClipboardPen,
  Dices,
  Play,
  Plus,
  RefreshCw,
  UserPlus,
} from "lucide-react";
import { startMatch } from "@/app/actions";
import { MAX_TEAM_SIZE, MIN_RANDOM_TEAM_SIZE } from "@/lib/format";
import { drawTeams } from "@/lib/shuffle";
import type { MatchView, Player } from "@/lib/types";
import { LiveMatch } from "./live-match";
import { joinNames, Pitch } from "./match-view";
import { useToast } from "./toast";
import {
  Avatar,
  Button,
  Content,
  Dock,
  ErrorText,
  Hero,
  HeroStat,
  Screen,
  SectionTitle,
  buttonClass,
  cn,
} from "./ui";
import { useAction } from "./use-action";

type Draw = { teamA: Player[]; teamB: Player[]; bench: Player[] };
export type LiveMatchView = MatchView & { startedAt: string };

const MIN_PLAYERS = MIN_RANDOM_TEAM_SIZE * 2;

/** The home screen: who is here → random teams → match in progress → winner, and round again. */
export function PlayScreen({ players, live }: { players: Player[]; live: LiveMatchView[] }) {
  const [selected, setSelected] = useState<ReadonlySet<number>>(new Set());
  const [teamSize, setTeamSize] = useState(MIN_RANDOM_TEAM_SIZE);
  const [draw, setDraw] = useState<Draw | null>(null);
  // While a match is live the screen is about that match; this opens a draw for a second table.
  const [drawingAnother, setDrawingAnother] = useState(false);
  const { pending, error, setError, run } = useAction();
  const toast = useToast();

  // Filtering against the current list drops anyone deleted since they were ticked.
  const present = players.filter((p) => selected.has(p.id));
  const maxSize = Math.min(Math.floor(present.length / 2), MAX_TEAM_SIZE);
  const canDraw = maxSize >= MIN_RANDOM_TEAM_SIZE;
  const size = Math.max(MIN_RANDOM_TEAM_SIZE, Math.min(teamSize, maxSize));
  const sizeOptions = Array.from(
    { length: Math.max(1, maxSize - MIN_RANDOM_TEAM_SIZE + 1) },
    (_, i) => i + MIN_RANDOM_TEAM_SIZE,
  );
  const benchCount = Math.max(0, present.length - size * 2);
  const allSelected = players.length > 0 && present.length === players.length;

  function select(next: ReadonlySet<number>) {
    setSelected(next);
    setError(null);
  }

  function toggle(id: number) {
    const next = new Set(selected);
    if (!next.delete(id)) next.add(id);
    select(next);
  }

  function shuffle() {
    setDraw(drawTeams(present, size));
    setError(null);
    window.scrollTo({ top: 0 });
  }

  function start(current: Draw) {
    run(
      () => startMatch(current.teamA.map((p) => p.id), current.teamB.map((p) => p.id)),
      () => {
        setDraw(null);
        setDrawingAnother(false);
        toast("Vào trận! Bấm đội thắng khi đá xong.");
        window.scrollTo({ top: 0, behavior: "smooth" });
      },
    );
  }

  if (live.length > 0 && !drawingAnother) {
    return (
      <Screen>
        <Hero eyebrow="Bi Lắc" title="Trận đấu" />
        <Content className="space-y-8">
          {live.map((match) => (
            <LiveMatch key={match.id} match={match} startedAt={match.startedAt} />
          ))}
          <div className="text-center">
            <Button variant="ghost" onClick={() => setDrawingAnother(true)}>
              <Plus aria-hidden className="size-4" />
              Chia đội cho bàn khác
            </Button>
          </div>
        </Content>
      </Screen>
    );
  }

  if (draw) {
    return (
      <Screen>
        <Hero
          eyebrow="Bốc thăm xong"
          title="Đội hình"
          aside={<HeroStat value={`${size}–${size}`} label="Đỏ – Xanh" />}
        />
        <Content>
          <div className="mx-auto max-w-xl space-y-4">
            <Pitch teamA={draw.teamA} teamB={draw.teamB} />
            {draw.bench.length > 0 && (
              <p className="flex items-center gap-2 px-1 text-sm text-zinc-600">
                <Armchair aria-hidden className="size-4 shrink-0" />
                <span>
                  Ngồi ngoài:{" "}
                  <strong className="font-semibold text-zinc-900">{joinNames(draw.bench)}</strong>
                </span>
              </p>
            )}
            <Button variant="ghost" onClick={() => setDraw(null)}>
              <ChevronLeft aria-hidden className="size-4" />
              Chọn lại người có mặt
            </Button>
          </div>
        </Content>
        <Dock>
          {error && <ErrorText tone="dark">{error}</ErrorText>}
          <div className="grid grid-cols-[auto_1fr] gap-2">
            <Button variant="dark" size="xl" disabled={pending} onClick={shuffle}>
              <RefreshCw aria-hidden className="size-5" />
              Chia lại
            </Button>
            <Button size="xl" loading={pending} onClick={() => start(draw)}>
              {!pending && <Play aria-hidden className="size-5 fill-current" />}
              Bắt đầu
            </Button>
          </div>
        </Dock>
      </Screen>
    );
  }

  const enoughPlayers = players.length >= MIN_PLAYERS;
  const info = !canDraw
    ? `Chọn ít nhất ${MIN_PLAYERS} người`
    : benchCount > 0
      ? `${benchCount} người ngồi ngoài`
      : `Vừa đủ ${size * 2} người`;

  return (
    <Screen>
      <Hero
        eyebrow="Bi Lắc"
        title="Ai ra sân?"
        aside={
          players.length > 0 && (
            <HeroStat value={present.length} suffix={`/${players.length}`} label="có mặt" />
          )
        }
      />
      <Content>
        {drawingAnother && (
          <Button variant="ghost" className="mb-2" onClick={() => setDrawingAnother(false)}>
            <ChevronLeft aria-hidden className="size-4" />
            Về trận đang đá
          </Button>
        )}
        {enoughPlayers ? (
          <>
            <SectionTitle
              aside={
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => select(allSelected ? new Set() : new Set(players.map((p) => p.id)))}
                >
                  {allSelected ? "Bỏ chọn hết" : "Chọn hết"}
                </Button>
              }
            >
              Chạm để điểm danh
            </SectionTitle>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {players.map((player) => (
                <PlayerChip
                  key={player.id}
                  player={player}
                  selected={selected.has(player.id)}
                  onToggle={() => toggle(player.id)}
                />
              ))}
            </div>
            <p className="mt-5 text-center text-sm text-zinc-500">
              1 chọi 1 hay lệch người?{" "}
              <Link href="/matches/record" className="font-semibold text-pitch-700 underline">
                Ghi tay
              </Link>
            </p>
          </>
        ) : (
          <NotEnoughPlayers count={players.length} />
        )}
      </Content>
      {enoughPlayers && (
        <Dock>
          <div className="flex items-center justify-between gap-3">
            <div role="group" aria-label="Số người mỗi đội" className="flex min-w-0 gap-1.5 overflow-x-auto">
              {sizeOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={option === size && canDraw}
                  disabled={option > maxSize}
                  onClick={() => setTeamSize(option)}
                  className={cn(
                    "h-10 shrink-0 rounded-full px-4 font-display text-lg font-bold tabular-nums transition-colors disabled:opacity-35",
                    option === size && canDraw ? "bg-white text-pitch-950" : "bg-white/10 text-white/80",
                  )}
                >
                  {option} vs {option}
                </button>
              ))}
            </div>
            <p className="shrink-0 text-right text-sm text-white/65">{info}</p>
          </div>
          <Button size="xl" className="w-full" disabled={!canDraw} onClick={shuffle}>
            <Dices aria-hidden className="size-6" />
            Chia đội
          </Button>
        </Dock>
      )}
    </Screen>
  );
}

function PlayerChip({
  player,
  selected,
  onToggle,
}: {
  player: Player;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onToggle}
      className={cn(
        "relative flex min-w-0 flex-col items-center gap-1.5 rounded-2xl px-1.5 pt-3 pb-2.5 transition active:scale-95",
        selected
          ? "bg-pitch-700 text-white shadow-md ring-2 ring-yellow-300"
          : "bg-white text-zinc-700 shadow-sm ring-1 ring-black/5",
      )}
    >
      <Avatar player={player} className={cn("size-12 text-2xl", !selected && "opacity-60 grayscale")} />
      <span className="max-w-full truncate text-sm font-semibold">{player.name}</span>
      {selected && (
        <span
          aria-hidden
          className="absolute top-1.5 right-1.5 grid size-5 place-items-center rounded-full bg-yellow-300 text-pitch-950"
        >
          <Check className="size-3.5" strokeWidth={3} />
        </span>
      )}
    </button>
  );
}

function NotEnoughPlayers({ count }: { count: number }) {
  return (
    <div className="rounded-3xl bg-white p-6 text-center shadow-sm ring-1 ring-black/5">
      <p className="font-display text-2xl font-bold uppercase">Cần ít nhất {MIN_PLAYERS} người</p>
      <p className="mt-1 text-sm text-zinc-500">
        Đang có {count} người chơi. Thêm người để chia đội ngẫu nhiên, hoặc ghi tay trận 1 chọi 1.
      </p>
      <div className="mt-5 flex flex-col gap-2">
        <Link href="/players" className={buttonClass("pitch", "lg")}>
          <UserPlus aria-hidden className="size-5" />
          Thêm người chơi
        </Link>
        <Link href="/matches/record" className={buttonClass("secondary", "lg")}>
          <ClipboardPen aria-hidden className="size-5" />
          Ghi tay 1 chọi 1
        </Link>
      </div>
    </div>
  );
}
