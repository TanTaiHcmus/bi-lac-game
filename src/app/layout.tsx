import type { Metadata, Viewport } from "next";
import { Barlow_Condensed, Geist } from "next/font/google";
import { SiteHeader, TabBar } from "@/components/nav";
import { ToastProvider } from "@/components/toast";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "vietnamese"],
});

// Scoreboard-style face for titles, numbers and the big buttons.
const barlowCondensed = Barlow_Condensed({
  variable: "--font-barlow-condensed",
  subsets: ["latin", "vietnamese"],
  weight: ["600", "700", "800"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: { default: "Bi Lắc", template: "%s · Bi Lắc" },
  description: "Chia đội ngẫu nhiên, ghi kết quả và bảng xếp hạng bi lắc cho cả nhóm.",
  // "Add to Home Screen" opens full screen; the green header runs under the status bar.
  appleWebApp: { capable: true, title: "Bi Lắc", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#157038",
  // Lets the layout reach under the notch / home indicator; env() paddings keep content clear.
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="vi"
      className={`${geistSans.variable} ${barlowCondensed.variable} h-full antialiased`}
    >
      <body className="min-h-full overflow-x-clip bg-paper font-sans text-zinc-900">
        <ToastProvider>
          {/* Keeps the status bar area green while content scrolls beneath it. */}
          <div
            aria-hidden
            className="fixed inset-x-0 top-0 z-50 h-[env(safe-area-inset-top)] bg-pitch-800"
          />
          <SiteHeader />
          <main className="pb-[calc(4rem+env(safe-area-inset-bottom))] sm:pb-0">{children}</main>
          <TabBar />
        </ToastProvider>
      </body>
    </html>
  );
}
