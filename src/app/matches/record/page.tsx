import type { Metadata } from "next";
import { Suspense } from "react";
import { MatchRecorder } from "@/components/match-recorder";
import { Content, Hero, ListSkeleton, Screen } from "@/components/ui";
import { getPlayers } from "@/lib/data";

export const metadata: Metadata = { title: "Ghi tay" };

export default function RecordMatchPage() {
  return (
    <Suspense
      fallback={
        <Screen>
          <Hero title="Ghi tay" back={{ href: "/more", label: "Thêm" }} />
          <Content>
            <ListSkeleton rows={3} />
          </Content>
        </Screen>
      }
    >
      <Recorder />
    </Suspense>
  );
}

async function Recorder() {
  return <MatchRecorder players={await getPlayers()} />;
}
