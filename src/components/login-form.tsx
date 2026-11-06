"use client";

import { useActionState } from "react";
import { login } from "@/app/actions";
import { Button, ErrorText, inputClass } from "./ui";

export function LoginForm({ next }: { next: string }) {
  const [error, formAction, pending] = useActionState(login, null);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="next" value={next} />
      <label htmlFor="passcode" className="sr-only">
        Mật khẩu
      </label>
      <input
        id="passcode"
        name="passcode"
        type="password"
        required
        autoFocus
        autoComplete="current-password"
        placeholder="Mật khẩu"
        className={inputClass}
      />
      {error && <ErrorText>{error}</ErrorText>}
      <Button type="submit" size="xl" loading={pending} className="w-full">
        Vào sân
      </Button>
    </form>
  );
}
