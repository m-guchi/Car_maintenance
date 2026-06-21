"use client";

import { signOut } from "next-auth/react";

type SignOutButtonProps = {
  variant?: "default" | "header";
};

export function SignOutButton({ variant = "default" }: SignOutButtonProps) {
  const className =
    variant === "header"
      ? "rounded-lg border border-white/25 bg-white/10 px-3 py-1.5 text-sm text-white backdrop-blur-sm transition hover:bg-white/20"
      : "rounded-lg px-3 py-1.5 text-sm text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-50";

  return (
    <button type="button" onClick={() => signOut({ callbackUrl: "/login" })} className={className}>
      ログアウト
    </button>
  );
}
