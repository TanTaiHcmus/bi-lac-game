import type { Metadata } from "next";
import { Suspense } from "react";
import { PlayerManager } from "@/components/player-manager";
import { Content, Hero, HeroStat, ListSkeleton, Screen } from "@/components/ui";
import { getStandings } from "@/lib/data";

export const metadata: Metadata = { title: "Người chơi" };

const BACK = { href: "/more", label: "Thêm" };

export default function PlayersPage() {
  return (
    <Screen>
      <Suspense
        fallback={
          <>
            <Hero title="Người chơi" back={BACK} />
            <Content>
              <ListSkeleton />
            </Content>
          </>
        }
      >
        <Players />
      </Suspense>
    </Screen>
  );
}

const collator = new Intl.Collator("vi");

async function Players() {
  const standings = await getStandings();
  const players = standings
    .map(({ id, name, played, points }) => ({ id, name, played, points }))
    .sort((a, b) => collator.compare(a.name, b.name));
  return (
    <>
      <Hero
        title="Người chơi"
        back={BACK}
        aside={<HeroStat value={players.length} label="người" />}
      />
      <Content>
        <PlayerManager players={players} />
      </Content>
    </>
  );
}
