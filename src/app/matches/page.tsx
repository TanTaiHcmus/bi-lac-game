import type { Metadata } from "next";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AutoRefresh } from "@/components/auto-refresh";
import { DeleteMatchButton } from "@/components/delete-match-button";
import { LiveBadge } from "@/components/live-match";
import { MatchResult, joinNames } from "@/components/match-view";
import {
  Content,
  EmptyState,
  Hero,
  HeroStat,
  ListGroup,
  ListSkeleton,
  Screen,
  SectionTitle,
  buttonClass,
  cn,
} from "@/components/ui";
import { getMatchHistory, getPendingMatches } from "@/lib/data";
import { SOURCE_LABEL, dayKey, formatDay, formatTime } from "@/lib/format";
import type { MatchView } from "@/lib/types";

export const metadata: Metadata = { title: "Lịch sử" };

const PAGE_SIZE = 20;
const BACK = { href: "/more", label: "Thêm" };

export default function HistoryPage({ searchParams }: PageProps<"/matches">) {
  return (
    <Screen>
      <Suspense
        fallback={
          <>
            <Hero title="Lịch sử" back={BACK} />
            <Content>
              <ListSkeleton />
            </Content>
          </>
        }
      >
        <History searchParams={searchParams} />
      </Suspense>
      <AutoRefresh />
    </Screen>
  );
}

async function History({ searchParams }: Pick<PageProps<"/matches">, "searchParams">) {
  const { page: rawPage } = await searchParams;
  const page = Math.max(1, Number.parseInt(String(rawPage ?? "1"), 10) || 1);
  const [live, { matches, total }] = await Promise.all([
    getPendingMatches(),
    getMatchHistory(page, PAGE_SIZE),
  ]);
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <Hero
        title="Lịch sử"
        back={BACK}
        aside={<HeroStat value={total} label="trận đã đá" />}
      />
      <Content className="space-y-6">
        {live.map((match) => (
          <LiveBanner key={match.id} match={match} />
        ))}

        {total === 0 ? (
          <EmptyState>
            Chưa có trận nào.{" "}
            <Link href="/" className="font-semibold text-pitch-700 underline">
              Ra sân
            </Link>{" "}
            hoặc{" "}
            <Link href="/matches/record" className="font-semibold text-pitch-700 underline">
              ghi tay
            </Link>
            .
          </EmptyState>
        ) : matches.length === 0 ? (
          <EmptyState>
            Trang này không có trận nào.{" "}
            <Link href={`/matches?page=${pageCount}`} className="font-semibold text-pitch-700 underline">
              Về trang cuối
            </Link>
          </EmptyState>
        ) : (
          <>
            {groupByDay(matches).map(({ key, label, matches: dayMatches }) => (
              <section key={key}>
                <SectionTitle>{label}</SectionTitle>
                <ListGroup>
                  {dayMatches.map((match) => (
                    <li key={match.id} className="space-y-1.5 px-4 py-3">
                      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                        <p className="text-xs text-zinc-500 tabular-nums">
                          {formatTime(match.playedAt)} · {SOURCE_LABEL[match.source]}
                        </p>
                        <DeleteMatchButton matchId={match.id} />
                      </div>
                      <MatchResult match={match} />
                    </li>
                  ))}
                </ListGroup>
              </section>
            ))}

            {pageCount > 1 && (
              <nav aria-label="Phân trang" className="flex items-center justify-between gap-2">
                <PageLink page={page - 1} disabled={page <= 1}>
                  <ChevronLeft aria-hidden className="size-4" />
                  Mới hơn
                </PageLink>
                <span className="text-sm text-zinc-500 tabular-nums">
                  Trang {page}/{pageCount}
                </span>
                <PageLink page={page + 1} disabled={page >= pageCount}>
                  Cũ hơn
                  <ChevronRight aria-hidden className="size-4" />
                </PageLink>
              </nav>
            )}
          </>
        )}
      </Content>
    </>
  );
}

/** A match still being played; its result is entered on the Play screen. */
function LiveBanner({ match }: { match: MatchView }) {
  return (
    <Link
      href="/"
      className="flex items-center gap-3 rounded-2xl bg-pitch-950 py-3 pr-3 pl-3.5 text-white shadow-sm"
    >
      <LiveBadge />
      <span className="min-w-0 flex-1 truncate text-sm">
        <span className="font-semibold text-rose-300">{joinNames(match.teamA)}</span>
        <span className="text-white/50"> vs </span>
        <span className="font-semibold text-sky-300">{joinNames(match.teamB)}</span>
      </span>
      <ChevronRight aria-hidden className="size-5 shrink-0 text-white/50" />
    </Link>
  );
}

function groupByDay(matches: MatchView[]) {
  const now = Date.now();
  const groups: { key: string; label: string; matches: MatchView[] }[] = [];
  for (const match of matches) {
    const key = dayKey(match.playedAt);
    const last = groups.at(-1);
    if (last?.key === key) last.matches.push(match);
    else groups.push({ key, label: formatDay(match.playedAt, now), matches: [match] });
  }
  return groups;
}

function PageLink({
  page,
  disabled,
  children,
}: {
  page: number;
  disabled: boolean;
  children: ReactNode;
}) {
  const className = buttonClass("secondary", "md");
  if (disabled) {
    return (
      <span aria-disabled className={cn(className, "pointer-events-none opacity-40")}>
        {children}
      </span>
    );
  }
  return (
    <Link href={page === 1 ? "/matches" : `/matches?page=${page}`} className={className}>
      {children}
    </Link>
  );
}
