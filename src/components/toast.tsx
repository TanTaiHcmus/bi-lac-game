"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { Check, CircleAlert } from "lucide-react";

type Tone = "success" | "error";
type Toast = { id: number; message: string; tone: Tone };

const ToastContext = createContext<(message: string, tone?: Tone) => void>(() => {});

/** Lives in the root layout so a message survives the component that raised it. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((message: string, tone: Tone = "success") => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, message, tone }]);
    setTimeout(() => setToasts((current) => current.filter((t) => t.id !== id)), 4000);
  }, []);

  return (
    <ToastContext value={show}>
      {children}
      {/* Top on phones, clear of the dock and tab bar at the bottom. */}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 top-[calc(env(safe-area-inset-top)+0.75rem)] z-50 flex flex-col items-center gap-2 px-4 sm:top-auto sm:bottom-6"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role={toast.tone === "error" ? "alert" : "status"}
            className="flex max-w-full items-center gap-2.5 rounded-2xl bg-pitch-950 px-4 py-3 text-sm font-semibold text-white shadow-xl ring-1 ring-white/10"
          >
            {toast.tone === "error" ? (
              <CircleAlert aria-hidden className="size-5 shrink-0 text-rose-400" />
            ) : (
              <Check aria-hidden className="size-5 shrink-0 text-yellow-300" strokeWidth={3} />
            )}
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
