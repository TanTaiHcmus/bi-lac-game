import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Crown } from "lucide-react";
import { AutoRefresh } from "@/components/auto-refresh";
import {
  Avatar,
  Content,
  EmptyState,
  Hero,
  ListGroup,
  ListSkeleton,
  Screen,
  cn,
} from "@/components/ui";
import { getStandings } from "@/lib/data";
import { formatPoints } from "@/lib/format";
import type { Standing } from "@/lib/types";

export const metadata: Metadata = { title: "Xếp hạng" };

export default function LeaderboardPage() {
  return (
    <Screen>
      <Suspense
        fallback={
          <>
            <Hero title="Xếp hạng" />
            <Content>
              <ListSkeleton rows={6} />
            </Content>
          </>
        }
      >
        <Leaderboard />
      </Suspense>
      <AutoRefresh />
    </Screen>
  );
}

async function Leaderboard() {
  const standings = await getStandings();
  // The podium is for people who have played and rank in the top 3. A tie goes up whole or not
  // at all, so one of four players tied for 3rd isn't picked at random.
  const tieSize = (rank: number) => standings.filter((player) => player.rank === rank).length;
  const podium = standings.filter(
    (player) => player.played > 0 && player.rank + tieSize(player.rank) - 1 <= 3,
  );
  const rest = standings.filter((player) => !podium.includes(player));
  const anyPlayed = standings.some((player) => player.played > 0);

  return (
    <>
      <Hero title="Xếp hạng">
        {podium.length > 0 && <Podium players={podium} />}
      </Hero>
      <Content>
        {standings.length === 0 ? (
          <EmptyState>
            Chưa có người chơi nào.{" "}
            <Link href="/players" className="font-semibold text-pitch-700 underline">
              Thêm người chơi
            </Link>
          </EmptyState>
        ) : (
          <>
            {!anyPlayed && (
              <p className="mb-3 px-1 text-sm text-zinc-500">
                Chưa ai đá trận nào.{" "}
                <Link href="/" className="font-semibold text-pitch-700 underline">
                  Ra sân thôi
                </Link>
              </p>
            )}
            {rest.length > 0 && (
              <ListGroup label="Bảng điểm">
                {rest.map((player) => (
                  <StandingRow key={player.id} player={player} />
                ))}
              </ListGroup>
            )}
            <p className="mt-6 px-4 text-center text-xs leading-relaxed text-zinc-400">
              Thắng +1, thua −1 mỗi người. Trận lệch người chia đều cho cân: 1 chọi 3 thì người lẻ
              được/mất 3.
            </p>
          </>
        )}
      </Content>
    </>
  );
}

// The first player stands in the middle, the second on the left, the third on the right.
const SPOT_ORDER = ["order-2", "order-1", "order-3"];

// Gold, silver, bronze by rank, so two players tied for 1st both get gold.
const RANK_STYLE: Record<number, { avatar: string; block: string }> = {
  1: { avatar: "size-16 text-3xl ring-yellow-300", block: "h-20 bg-yellow-300 text-pitch-950" },
  2: { avatar: "size-14 text-2xl ring-zinc-200", block: "h-14 bg-zinc-200 text-zinc-700" },
  3: { avatar: "size-14 text-2xl ring-orange-300", block: "h-10 bg-orange-300 text-orange-950" },
};

function Podium({ players }: { players: Standing[] }) {
  return (
    <ol aria-label="Top 3" className="mt-6 flex items-end justify-center gap-2">
      {players.map((player, i) => {
        const spot = RANK_STYLE[player.rank];
        return (
          <li key={player.id} className={cn("flex w-1/3 max-w-40 min-w-0 flex-col items-center", SPOT_ORDER[i])}>
            {player.rank === 1 && <Crown aria-hidden className="mb-1 size-6 fill-yellow-300 text-yellow-300" />}
            <Avatar player={player} className={cn("ring-4", spot.avatar)} />
            <p className="mt-2 w-full truncate text-center text-sm font-semibold">{player.name}</p>
            <p className="font-display text-3xl leading-tight font-extrabold tabular-nums">
              {formatPoints(player.points)}
            </p>
            <div
              className={cn(
                "mt-1 flex w-full justify-center rounded-t-xl pt-1 font-display text-2xl font-extrabold",
                spot.block,
              )}
            >
              {player.rank}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function StandingRow({ player }: { player: Standing }) {
  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <span className="w-6 shrink-0 text-center font-display text-xl font-bold text-zinc-400 tabular-nums">
        {player.rank}
      </span>
      <Avatar player={player} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-zinc-900">{player.name}</p>
        <p className="text-xs text-zinc-500 tabular-nums">
          {player.played > 0
            ? `${player.wins} thắng · ${player.losses} thua · ${Math.round((player.wins / player.played) * 100)}%`
            : "Chưa đá trận nào"}
        </p>
      </div>
      <p className={cn("font-display text-3xl font-extrabold tabular-nums", pointsColor(player.points))}>
        {formatPoints(player.points)}
      </p>
    </li>
  );
}

function pointsColor(points: number) {
  if (points > 0) return "text-pitch-600";
  if (points < 0) return "text-rose-600";
  return "text-zinc-400";
}
