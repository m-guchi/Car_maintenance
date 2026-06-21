import Link from "next/link";

import { SignOutButton } from "@/components/sign-out-button";

type AppHeaderProps = {
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
};

export function AppHeader({
  title,
  subtitle,
  backHref,
  backLabel = "戻る",
}: AppHeaderProps) {
  return (
    <header className="border-b border-blue-800/20 bg-gradient-to-r from-blue-800 via-blue-700 to-blue-600 px-4 py-4 shadow-md shadow-blue-900/10 dark:border-slate-700/50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 dark:shadow-black/20">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4 lg:max-w-4xl">
        <div className="min-w-0">
          {backHref && (
            <Link
              href={backHref}
              className="mb-1 inline-flex items-center text-sm text-blue-100 transition hover:text-white"
            >
              ← {backLabel}
            </Link>
          )}
          <h1 className="truncate text-lg font-bold text-white">{title}</h1>
          {subtitle && (
            <p className="truncate text-sm text-blue-100/90">{subtitle}</p>
          )}
        </div>
        <SignOutButton variant="header" />
      </div>
    </header>
  );
}
