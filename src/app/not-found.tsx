import Link from "next/link";
import { Content, Hero, Screen, buttonClass, cn } from "@/components/ui";

export default function NotFound() {
  return (
    <Screen>
      <Hero eyebrow="404" title="Lạc sân rồi" />
      <Content className="text-center">
        <p className="text-sm text-zinc-600">Không tìm thấy trang này.</p>
        <Link href="/" className={cn(buttonClass("primary", "xl"), "mt-6")}>
          Về sân chơi
        </Link>
      </Content>
    </Screen>
  );
}
