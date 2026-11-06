"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { removeMatch } from "@/app/actions";
import { useToast } from "./toast";
import { Button, ErrorText } from "./ui";
import { useAction } from "./use-action";

export function DeleteMatchButton({ matchId }: { matchId: string }) {
  const [confirming, setConfirming] = useState(false);
  const { pending, error, run } = useAction();
  const toast = useToast();

  if (!confirming) {
    return (
      <Button
        variant="ghostDanger"
        size="icon"
        className="-my-1.5 -mr-2"
        aria-label="Xóa trận"
        title="Xóa trận"
        onClick={() => setConfirming(true)}
      >
        <Trash2 aria-hidden className="size-4" />
      </Button>
    );
  }

  return (
    // Takes its own line on phones so it never squeezes the time beside it.
    <div className="flex w-full flex-col items-end gap-1 sm:w-auto">
      <div className="flex items-center gap-2">
        <span className="text-sm text-zinc-600">Xóa và hoàn điểm?</span>
        <Button variant="secondary" disabled={pending} onClick={() => setConfirming(false)}>
          Không
        </Button>
        <Button
          variant="danger"
          loading={pending}
          onClick={() => run(() => removeMatch(matchId), () => toast("Đã xóa trận, điểm đã được hoàn lại."))}
        >
          Xóa
        </Button>
      </div>
      {error && <ErrorText>{error}</ErrorText>}
    </div>
  );
}
