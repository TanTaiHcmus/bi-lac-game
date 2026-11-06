"use client";

import { useState, type ReactNode } from "react";
import { Trophy } from "lucide-react";
import { cancelMatch, finishMatch } from "@/app/actions";
import { TEAM_NAME } from "@/lib/format";
import type { MatchView, Team } from "@/lib/types";
import { Pitch, ScoreLines } from "./match-view";
import { useToast } from "./toast";
import { Button } from "./ui";
import { useAction } from "./use-action";

export function LiveBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-600 px-2.5 py-1 font-display text-sm font-bold tracking-wider text-white uppercase">
      <span className="relative flex size-2">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-white opacity-75" />
        <span className="relative inline-flex size-2 rounded-full bg-white" />
      </span>
      Đang đá
    </span>
  );
}

/** A match in progress. The winner takes two taps so a slip doesn't cost anyone points. */
export function LiveMatch({ match, startedAt }: { match: MatchView; startedAt: string }) {
  const [confirming, setConfirming] = useState<Team | "cancel" | null>(null);
  const { pending, run } = useAction();
  const toast = useToast();
  // A toast, because when someone else already settled the match the refresh removes this card.
  const showError = (message: string) => toast(message, "error");

  function finish(winner: Team) {
    run(
      () => finishMatch(match.id, winner),
      () => toast(`${TEAM_NAME[winner]} thắng! Đã cập nhật điểm.`),
      showError,
    );
  }

  return (
    <article aria-label="Trận đang đá" className="mx-auto w-full max-w-xl space-y-3">
      <div className="flex min-h-9 items-center justify-between gap-2">
        <p className="flex items-center gap-2">
          <LiveBadge />
          <span className="text-sm text-zinc-500">từ {startedAt}</span>
        </p>
        {confirming === null && (
          <Button variant="ghost" size="sm" onClick={() => setConfirming("cancel")}>
            Hủy trận
          </Button>
        )}
      </div>

      <Pitch teamA={match.teamA} teamB={match.teamB} />

      {confirming === null && (
        <div className="grid grid-cols-2 gap-3">
          <Button variant="teamA" size="xl" onClick={() => setConfirming("A")}>
            <Trophy aria-hidden className="size-5" />
            Đỏ thắng
          </Button>
          <Button variant="teamB" size="xl" onClick={() => setConfirming("B")}>
            <Trophy aria-hidden className="size-5" />
            Xanh thắng
          </Button>
        </div>
      )}

      {(confirming === "A" || confirming === "B") && (
        <ConfirmPanel
          title={`${TEAM_NAME[confirming]} thắng?`}
          onBack={() => setConfirming(null)}
          pending={pending}
          confirm={
            <Button
              variant={confirming === "A" ? "teamA" : "teamB"}
              size="xl"
              loading={pending}
              onClick={() => finish(confirming)}
            >
              Xác nhận
            </Button>
          }
        >
          <ScoreLines
            tone="dark"
            winners={confirming === "A" ? match.teamA : match.teamB}
            losers={confirming === "A" ? match.teamB : match.teamA}
          />
        </ConfirmPanel>
      )}

      {confirming === "cancel" && (
        <ConfirmPanel
          title="Hủy trận này?"
          onBack={() => setConfirming(null)}
          pending={pending}
          confirm={
            <Button
              variant="danger"
              size="xl"
              loading={pending}
              onClick={() => run(() => cancelMatch(match.id), () => toast("Đã hủy trận."), showError)}
            >
              Hủy trận
            </Button>
          }
        >
          <p className="text-sm text-white/75">Không ai bị cộng hay trừ điểm.</p>
        </ConfirmPanel>
      )}
    </article>
  );
}

function ConfirmPanel({
  title,
  onBack,
  pending,
  confirm,
  children,
}: {
  title: string;
  onBack: () => void;
  pending: boolean;
  confirm: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="space-y-3 rounded-3xl bg-pitch-950 p-4 text-white">
      <p className="font-display text-3xl leading-none font-extrabold uppercase italic">{title}</p>
      {children}
      <div className="grid grid-cols-2 gap-2">
        <Button variant="dark" size="xl" disabled={pending} onClick={onBack}>
          Quay lại
        </Button>
        {confirm}
      </div>
    </div>
  );
}
