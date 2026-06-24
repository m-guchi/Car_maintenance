"use client";

import Link from "next/link";
import { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { bottomNavItems, isNavActive, type NavItem } from "@/lib/nav-items";

function BottomNavLinkContent({ item }: { item: NavItem }) {
  const { pending } = useLinkStatus();

  return (
    <>
      <span
        className={`text-xl leading-none transition-opacity ${
          pending ? "opacity-70" : ""
        }`}
        aria-hidden="true"
      >
        {item.emoji}
      </span>
      <span className="max-w-full truncate px-0.5">{item.title}</span>
      <span
        aria-hidden
        className={`app-bottom-nav-hint ${pending ? "is-pending" : ""}`}
      />
    </>
  );
}

function BottomNavItem({
  item,
  pathname,
  highlighted,
  onNavigate,
}: {
  item: NavItem;
  pathname: string;
  highlighted: boolean;
  onNavigate: (href: string) => void;
}) {
  const active = item.href ? isNavActive(pathname, item.href) : false;

  return (
    <li className="min-w-0 flex-1">
      <Link
        href={item.href!}
        onClick={() => onNavigate(item.href!)}
        className={`relative flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 py-2 text-[10px] font-medium transition active:scale-[0.97] sm:px-2 sm:text-xs ${
          highlighted
            ? "text-blue-600 dark:text-blue-400"
            : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        }`}
        aria-current={active && highlighted ? "page" : undefined}
      >
        <BottomNavLinkContent item={item} />
      </Link>
    </li>
  );
}

export function AppBottomNav() {
  const pathname = usePathname();
  const [optimisticHref, setOptimisticHref] = useState<string | null>(null);
  const navigationSettled =
    optimisticHref !== null && isNavActive(pathname, optimisticHref);
  const pendingHref = navigationSettled ? null : optimisticHref;

  return (
    <nav
      className="app-bottom-nav fixed inset-x-0 bottom-0 z-50 border-t border-slate-200/80 bg-white/95 backdrop-blur-md dark:border-slate-700/80 dark:bg-slate-900/95 lg:hidden"
      aria-label="メインナビゲーション"
    >
      <ul className="mx-auto flex w-full max-w-2xl items-stretch justify-around">
        {bottomNavItems.map((item) => {
          const href = item.href!;
          const pathnameActive = isNavActive(pathname, href);
          const highlighted = pendingHref ? pendingHref === href : pathnameActive;

          return (
            <BottomNavItem
              key={href}
              item={item}
              pathname={pathname}
              highlighted={highlighted}
              onNavigate={setOptimisticHref}
            />
          );
        })}
      </ul>
    </nav>
  );
}
