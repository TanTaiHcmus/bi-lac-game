import type { Metadata } from "next";
import { Suspense } from "react";
import { AutoRefresh } from "@/components/auto-refresh";
import { PlayScreen } from "@/components/play-screen";
import { Content, Hero, Screen } from "@/components/ui";
import { getPendingMatches, getPlayers } from "@/lib/data";
import { formatTime } from "@/lib/format";

// The root page shares the layout segment, so the title template does not apply here.
export const metadata: Metadata = { title: { absolute: "Bi Lắc" } };

export default function PlayPage() {
  return (
    <>
      <Suspense fallback={<PlaySkeleton />}>
        <Play />
      </Suspense>
      {/* Picks up results entered on other phones. */}
      <AutoRefresh seconds={20} />
    </>
  );
}

async function Play() {
  const [players, pending] = await Promise.all([getPlayers(), getPendingMatches()]);
  const live = pending.map((match) => ({ ...match, startedAt: formatTime(match.playedAt) }));
  return <PlayScreen players={players} live={live} />;
}

function PlaySkeleton() {
  return (
    <Screen>
      <Hero eyebrow="Bi Lắc" title="Ai ra sân?" />
      <Content>
        <div aria-busy className="mt-11 grid grid-cols-3 gap-2 sm:grid-cols-5">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-zinc-200/70" />
          ))}
        </div>
      </Content>
    </Screen>
  );
}
