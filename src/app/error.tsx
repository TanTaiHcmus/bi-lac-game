"use client";

import { useEffect } from "react";
import { Button, Content, Hero, Screen } from "@/components/ui";

export default function Error({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Screen>
      <Hero title="Có lỗi" />
      <Content className="text-center">
        <p className="text-sm text-zinc-600">
          Không tải được dữ liệu. Nếu vừa deploy, hãy kiểm tra biến môi trường{" "}
          <code className="text-zinc-800">TURSO_DATABASE_URL</code> và{" "}
          <code className="text-zinc-800">TURSO_AUTH_TOKEN</code>.
        </p>
        <Button size="xl" className="mt-6" onClick={() => retry()}>
          Thử lại
        </Button>
      </Content>
    </Screen>
  );
}
