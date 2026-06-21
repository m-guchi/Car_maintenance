import Link from "next/link";

import { SidebarMenuButton } from "@/components/sidebar-menu-button";
import { UserMenu } from "@/components/user-menu";

type AppHeaderUser = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

type AppHeaderProps = {
  title: string;
  subtitle?: string;
  showHomeLink?: boolean;
  user?: AppHeaderUser;
};

export function AppHeader({
  title,
  subtitle,
  showHomeLink = false,
  user,
}: AppHeaderProps) {
  return (
    <header className="border-b border-blue-800/20 bg-gradient-to-r from-blue-800 via-blue-700 to-blue-600 px-4 py-4 shadow-md shadow-blue-900/10 dark:border-slate-700/50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 dark:shadow-black/20">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4 lg:max-w-5xl">
        <div className="flex min-w-0 items-center">
          <SidebarMenuButton />
          <div className="min-w-0">
            {showHomeLink && (
              <Link
                href="/"
                className="mb-1 inline-flex items-center text-sm text-blue-100 transition hover:text-white"
              >
                ← ホーム
              </Link>
            )}
            <h1 className="truncate text-lg font-bold text-white">{title}</h1>
            {subtitle && (
              <p className="truncate text-sm text-blue-100/90">{subtitle}</p>
            )}
          </div>
        </div>
        <UserMenu
          name={user?.name}
          email={user?.email}
          image={user?.image}
        />
      </div>
    </header>
  );
}
