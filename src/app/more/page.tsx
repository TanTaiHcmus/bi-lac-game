import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, ClipboardPen, History, Users, type LucideIcon } from "lucide-react";
import { Content, Hero, ListGroup, Screen, SectionTitle, cn } from "@/components/ui";

export const metadata: Metadata = { title: "Thêm" };

const ITEMS: { href: string; icon: LucideIcon; tone: string; title: string; subtitle: string }[] = [
  {
    href: "/matches",
    icon: History,
    tone: "bg-amber-100 text-amber-700",
    title: "Lịch sử trận đấu",
    subtitle: "Xem lại, xóa trận ghi nhầm",
  },
  {
    href: "/matches/record",
    icon: ClipboardPen,
    tone: "bg-rose-100 text-rose-700",
    title: "Ghi kết quả tay",
    subtitle: "1 chọi 1, lệch người, trận đá ngoài app",
  },
  {
    href: "/players",
    icon: Users,
    tone: "bg-sky-100 text-sky-700",
    title: "Người chơi",
    subtitle: "Thêm, đổi tên, xóa thành viên",
  },
];

export default function MorePage() {
  return (
    <Screen>
      <Hero title="Thêm" />
      <Content className="space-y-8">
        <ListGroup>
          {ITEMS.map(({ href, icon: Icon, tone, title, subtitle }) => (
            <li key={href}>
              <Link href={href} className="flex items-center gap-3 px-4 py-3.5 active:bg-zinc-50">
                <span className={cn("grid size-11 shrink-0 place-items-center rounded-xl", tone)}>
                  <Icon aria-hidden className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-zinc-900">{title}</span>
                  <span className="block truncate text-sm text-zinc-500">{subtitle}</span>
                </span>
                <ChevronRight aria-hidden className="size-5 shrink-0 text-zinc-300" />
              </Link>
            </li>
          ))}
        </ListGroup>

        <section>
          <SectionTitle>Cách tính điểm</SectionTitle>
          <ul className="space-y-2 rounded-2xl bg-white p-4 text-sm leading-relaxed text-zinc-600 shadow-sm ring-1 ring-black/5">
            <li>
              Đội thắng <strong className="text-pitch-700">+1</strong>, đội thua{" "}
              <strong className="text-rose-600">−1</strong> cho mỗi người.
            </li>
            <li>
              Trận lệch người (ghi tay) chia đều cho cân: bên ít người được/mất gấp bội. Vd Bảo thua Đệ,
              Tài, Phước: Bảo −3, ba người kia +1 mỗi người.
            </li>
            <li>Xóa một trận trong lịch sử là điểm tự hoàn lại.</li>
          </ul>
        </section>
      </Content>
    </Screen>
  );
}
