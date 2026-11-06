"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Goal, LayoutGrid, Trophy, type LucideIcon } from "lucide-react";
import { BrandMark, cn } from "./ui";

type Tab = { href: string; label: string; icon: LucideIcon; isActive: (pathname: string) => boolean };

const TABS: Tab[] = [
  { href: "/", label: "Chơi", icon: Goal, isActive: (p) => p === "/" },
  { href: "/leaderboard", label: "Xếp hạng", icon: Trophy, isActive: (p) => p === "/leaderboard" },
  {
    href: "/more",
    label: "Thêm",
    icon: LayoutGrid,
    isActive: (p) => ["/more", "/matches", "/players"].some((section) => p.startsWith(section)),
  },
];

const DESKTOP_LINKS = [
  { href: "/", label: "Chơi" },
  { href: "/leaderboard", label: "Xếp hạng" },
  { href: "/matches", label: "Lịch sử" },
  { href: "/matches/record", label: "Ghi tay" },
  { href: "/players", label: "Người chơi" },
];

/** Phones: three tabs pinned to the bottom. */
export function TabBar() {
  const pathname = usePathname();
  if (pathname === "/login") return null;

  return (
    // h-16 is load-bearing: <Dock> sticks at bottom-[calc(4rem+safe-area)].
    <nav
      aria-label="Điều hướng"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-pitch-950 pb-[env(safe-area-inset-bottom)] sm:hidden"
    >
      <div className="px-safe grid h-16 grid-cols-3">
        {TABS.map(({ href, label, icon: Icon, isActive }) => {
          const active = isActive(pathname);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex flex-col items-center justify-center gap-0.5 font-display text-sm font-semibold tracking-wider uppercase",
                active ? "text-yellow-300" : "text-white/55",
              )}
            >
              {active && (
                <span aria-hidden className="absolute top-0 h-1 w-10 rounded-b-full bg-yellow-300" />
              )}
              <Icon aria-hidden className="size-6" strokeWidth={active ? 2.5 : 2} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

/** Wider screens: a slim top bar with every section. */
export function SiteHeader() {
  const pathname = usePathname();
  if (pathname === "/login") return null;

  return (
    <header className="sticky top-0 z-30 hidden bg-pitch-950 text-white sm:block">
      <div className="px-safe mx-auto flex h-14 max-w-4xl items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2">
          <BrandMark />
          <span className="font-display text-2xl font-extrabold uppercase italic">Bi Lắc</span>
        </Link>
        <nav className="flex items-center gap-1">
          {DESKTOP_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              aria-current={pathname === href ? "page" : undefined}
              className={cn(
                "rounded-lg px-3 py-1.5 font-display text-lg font-semibold tracking-wide uppercase transition-colors",
                pathname === href ? "bg-white/10 text-yellow-300" : "text-white/70 hover:text-white",
              )}
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
