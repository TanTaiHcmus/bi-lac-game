import type { ButtonHTMLAttributes, ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft, CircleAlert, LoaderCircle } from "lucide-react";
import type { Player } from "@/lib/types";

export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

// --- Buttons -----------------------------------------------------------------

const BUTTON_VARIANTS = {
  /** The one "go" action of a screen. */
  primary: "bg-yellow-400 text-pitch-950 shadow-sm hover:bg-yellow-300",
  pitch: "bg-pitch-700 text-white shadow-sm hover:bg-pitch-800",
  secondary: "bg-white text-zinc-800 ring-1 ring-zinc-300 ring-inset hover:bg-zinc-50",
  /** For use on the dark dock. */
  dark: "bg-white/10 text-white ring-1 ring-white/15 ring-inset hover:bg-white/15",
  ghost: "text-zinc-600 hover:bg-black/5 hover:text-zinc-900",
  ghostDanger: "text-zinc-500 hover:bg-rose-50 hover:text-rose-600",
  danger: "bg-rose-600 text-white shadow-sm hover:bg-rose-700",
  teamA: "bg-rose-600 text-white shadow-sm hover:bg-rose-700",
  teamB: "bg-sky-600 text-white shadow-sm hover:bg-sky-700",
};

const BUTTON_SIZES = {
  sm: "h-9 gap-1.5 rounded-lg px-3 text-sm font-medium",
  md: "h-11 gap-2 rounded-xl px-4 text-sm font-semibold",
  lg: "h-12 gap-2 rounded-xl px-5 text-base font-semibold",
  /** Big uppercase action in the scoreboard face. */
  xl: "h-14 gap-2 rounded-2xl px-6 font-display text-xl font-bold tracking-wide uppercase",
  icon: "size-10 rounded-xl",
};

export function buttonClass(
  variant: keyof typeof BUTTON_VARIANTS = "primary",
  size: keyof typeof BUTTON_SIZES = "md",
) {
  return cn(
    "inline-flex shrink-0 items-center justify-center whitespace-nowrap transition active:scale-[0.97]",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pitch-500",
    "disabled:pointer-events-none disabled:opacity-40",
    BUTTON_VARIANTS[variant],
    BUTTON_SIZES[size],
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof BUTTON_VARIANTS;
  size?: keyof typeof BUTTON_SIZES;
  loading?: boolean;
};

export function Button({
  variant,
  size,
  loading = false,
  className,
  children,
  disabled,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn(buttonClass(variant, size), className)}
      {...props}
    >
      {loading && <LoaderCircle aria-hidden className="size-5 animate-spin" />}
      {children}
    </button>
  );
}

export const inputClass = cn(
  "h-12 w-full min-w-0 rounded-xl bg-white px-4 text-base text-zinc-900 ring-1 ring-zinc-300 ring-inset",
  "placeholder:text-zinc-400 focus:ring-2 focus:ring-pitch-600 focus:outline-none",
);

// --- Page structure ----------------------------------------------------------

/**
 * A page as tall as the screen above the tab bar, so a <Dock> placed last
 * rests right on the tabs even when the content is short.
 */
export function Screen({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[calc(100dvh-4rem-env(safe-area-inset-bottom))] flex-col sm:min-h-0">
      {children}
    </div>
  );
}

/** Green striped header. Installed on a phone, it runs up under the status bar. */
export function Hero({
  eyebrow,
  title,
  back,
  aside,
  children,
}: {
  eyebrow?: string;
  title: string;
  back?: { href: string; label: string };
  aside?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="pitch-stripes relative overflow-hidden rounded-b-[2rem] bg-pitch-700 text-white sm:rounded-none">
      {/* Half-way line and centre circle, cropped at the right edge. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 w-40 sm:right-[10%] sm:w-64"
      >
        <div className="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-white/10" />
        <div className="absolute top-1/2 left-1/2 size-36 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/10" />
      </div>
      <div className="px-safe relative mx-auto max-w-4xl pt-[calc(env(safe-area-inset-top)+1rem)] pb-6 sm:pt-8">
        {back && (
          <Link
            href={back.href}
            className="-ml-1 mb-1 inline-flex items-center gap-0.5 text-sm font-medium text-white/75 sm:hidden"
          >
            <ChevronLeft aria-hidden className="size-4" />
            {back.label}
          </Link>
        )}
        <div className="flex items-end justify-between gap-4">
          <div className="min-w-0">
            {eyebrow && (
              <p className="font-display text-sm font-semibold tracking-[0.25em] text-yellow-300 uppercase">
                {eyebrow}
              </p>
            )}
            <h1 className="font-display text-[2.75rem] leading-[0.95] font-extrabold tracking-tight uppercase italic">
              {title}
            </h1>
          </div>
          {aside}
        </div>
        {children}
      </div>
    </header>
  );
}

/** A big number in the hero, e.g. "5/8 có mặt". */
export function HeroStat({
  value,
  suffix,
  label,
}: {
  value: ReactNode;
  suffix?: string;
  label: string;
}) {
  return (
    <p className="shrink-0 text-right font-display leading-none">
      <span className="text-5xl font-extrabold tabular-nums">{value}</span>
      {suffix && <span className="text-2xl font-bold text-white/55 tabular-nums">{suffix}</span>}
      <span className="mt-1 block text-xs font-semibold tracking-[0.2em] text-white/60 uppercase">
        {label}
      </span>
    </p>
  );
}

export function Content({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("px-safe mx-auto w-full max-w-4xl flex-1 pt-5 pb-6", className)}>
      {children}
    </div>
  );
}

/** The screen's main actions: pinned above the tab bar on phones, inline on wider screens. */
export function Dock({ children }: { children: ReactNode }) {
  return (
    <div className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom))] z-20 sm:static sm:px-safe sm:mx-auto sm:w-full sm:max-w-4xl sm:pb-6">
      <div className="rounded-t-[1.75rem] bg-pitch-950 text-white shadow-[0_-6px_20px_-10px_rgb(0_0_0/0.3)] sm:rounded-3xl">
        <div className="px-safe mx-auto max-w-4xl space-y-3 py-4 sm:px-5">{children}</div>
      </div>
    </div>
  );
}

export function SectionTitle({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="mb-2 flex min-h-9 items-center justify-between gap-2 px-1">
      <h2 className="font-display text-base font-bold tracking-[0.15em] text-zinc-500 uppercase">
        {children}
      </h2>
      {aside}
    </div>
  );
}

/** White rounded list with hairline dividers. */
export function ListGroup({ children, label }: { children: ReactNode; label?: string }) {
  return (
    <ul
      aria-label={label}
      className="divide-y divide-zinc-100 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5"
    >
      {children}
    </ul>
  );
}

// --- Small pieces ------------------------------------------------------------

// Avatar colours steer clear of the red and blue that mark the two teams.
const AVATAR_TONES = [
  "bg-amber-200 text-amber-900",
  "bg-lime-200 text-lime-900",
  "bg-teal-200 text-teal-900",
  "bg-violet-200 text-violet-900",
  "bg-orange-200 text-orange-900",
  "bg-emerald-200 text-emerald-900",
  "bg-fuchsia-200 text-fuchsia-900",
  "bg-yellow-200 text-yellow-900",
];

/** Initial of the given name (the last word of a Vietnamese name) on a stable colour. */
export function Avatar({ player, className }: { player: Player; className?: string }) {
  const initial = player.name.trim().split(/\s+/).at(-1)?.charAt(0).toLocaleUpperCase("vi");
  return (
    <span
      aria-hidden
      className={cn(
        "grid size-10 shrink-0 place-items-center rounded-full font-display text-xl font-bold",
        AVATAR_TONES[player.id % AVATAR_TONES.length],
        className,
      )}
    >
      {initial}
    </span>
  );
}

/** The app icon: a pitch with a red and a blue rod pair. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden className={cn("size-8", className)}>
      <rect width="64" height="64" rx="14" fill="#157038" />
      <rect x="31" y="10" width="2" height="44" fill="#fff" opacity="0.5" />
      <circle cx="32" cy="32" r="9" fill="none" stroke="#fff" strokeWidth="2" opacity="0.5" />
      <rect x="14" y="18" width="6" height="12" rx="3" fill="#f43f5e" />
      <rect x="14" y="34" width="6" height="12" rx="3" fill="#f43f5e" />
      <rect x="44" y="18" width="6" height="12" rx="3" fill="#0ea5e9" />
      <rect x="44" y="34" width="6" height="12" rx="3" fill="#0ea5e9" />
      <circle cx="32" cy="32" r="4.5" fill="#fff" />
    </svg>
  );
}

export function ErrorText({
  children,
  tone = "light",
}: {
  children: ReactNode;
  tone?: "light" | "dark";
}) {
  return (
    <p
      role="alert"
      className={cn(
        "flex items-start gap-1.5 text-sm",
        tone === "dark" ? "text-rose-300" : "text-rose-600",
      )}
    >
      <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
      <span>{children}</span>
    </p>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-zinc-300 px-4 py-10 text-center text-sm text-zinc-500">
      {children}
    </div>
  );
}

export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div aria-busy className="space-y-2">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="h-16 animate-pulse rounded-2xl bg-zinc-200/70" />
      ))}
    </div>
  );
}
