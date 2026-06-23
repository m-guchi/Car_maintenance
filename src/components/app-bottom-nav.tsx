"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { bottomNavItems, isNavActive } from "@/lib/nav-items";

export function AppBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="app-bottom-nav fixed inset-x-0 bottom-0 z-50 border-t border-slate-200/80 bg-white/95 backdrop-blur-md dark:border-slate-700/80 dark:bg-slate-900/95 lg:hidden"
      aria-label="メインナビゲーション"
    >
      <ul className="mx-auto flex w-full max-w-2xl items-stretch justify-around">
        {bottomNavItems.map((item) => {
          const active = item.href ? isNavActive(pathname, item.href) : false;

          return (
            <li key={item.href} className="min-w-0 flex-1">
              <Link
                href={item.href!}
                className={`flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 py-2 text-[10px] font-medium transition active:scale-[0.97] sm:px-2 sm:text-xs ${
                  active
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
                aria-current={active ? "page" : undefined}
              >
                <span className="text-xl leading-none" aria-hidden="true">
                  {item.emoji}
                </span>
                <span className="max-w-full truncate px-0.5">{item.title}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
