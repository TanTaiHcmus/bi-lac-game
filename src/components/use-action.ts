"use client";

import { useState, useTransition } from "react";
import type { ActionResult } from "@/lib/types";

/**
 * Runs a Server Action in a transition. Failures land in `error`, or go to
 * `onError` when the component may unmount before it could show them.
 */
export function useAction() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(
    action: () => Promise<ActionResult>,
    onSuccess?: () => void,
    onError: (message: string) => void = setError,
  ) {
    setError(null);
    startTransition(async () => {
      try {
        const result = await action();
        if (result.ok) onSuccess?.();
        else onError(result.error);
      } catch {
        onError("Không kết nối được máy chủ. Thử lại nhé.");
      }
    });
  }

  return { pending, error, setError, run };
}
