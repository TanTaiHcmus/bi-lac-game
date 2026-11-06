import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { LoginForm } from "@/components/login-form";
import { BrandMark } from "@/components/ui";
import { passcodeEnabled, safeNextPath } from "@/lib/auth";

export const metadata: Metadata = { title: "Nhập mật khẩu" };

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    // Covers the whole screen: the tab bar and header hide themselves on this route.
    <div className="pitch-stripes fixed inset-0 z-40 overflow-y-auto bg-pitch-700">
      <div className="px-safe flex min-h-full flex-col items-center justify-center pt-[calc(env(safe-area-inset-top)+2rem)] pb-10">
        <BrandMark className="size-16 drop-shadow-lg" />
        <p className="mt-3 font-display text-5xl font-extrabold text-white uppercase italic">Bi Lắc</p>
        <div className="mt-6 w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl">
          <h1 className="font-display text-2xl font-bold uppercase">Mật khẩu của nhóm</h1>
          <p className="mt-1 mb-4 text-sm text-zinc-500">Chỉ cần nhập một lần trên mỗi thiết bị.</p>
          <Suspense>
            <LoginGate searchParams={searchParams} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

async function LoginGate({ searchParams }: Pick<PageProps<"/login">, "searchParams">) {
  // Awaiting searchParams makes this run per request, so APP_PASSCODE is read at runtime.
  const next = safeNextPath((await searchParams).next);
  if (!passcodeEnabled()) redirect(next);
  return <LoginForm next={next} />;
}
