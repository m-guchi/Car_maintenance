export type MenuItem = {
  title: string;
  desc: string;
  emoji: string;
  href?: string;
  ready?: boolean;
  accent: string;
  iconBg: string;
};

export const menuItems: MenuItem[] = [
  {
    title: "給油記録",
    desc: "燃費・ガソリン代の管理",
    emoji: "⛽",
    href: "/fuel",
    ready: true,
    accent:
      "border-l-amber-400 bg-amber-50/50 hover:border-amber-300 dark:border-l-amber-500 dark:bg-amber-950/30 dark:hover:border-amber-400",
    iconBg: "bg-amber-100 dark:bg-amber-900/40",
  },
  {
    title: "メンテナンス",
    desc: "カテゴリ別の整備履歴",
    emoji: "🔧",
    accent:
      "border-l-violet-400 bg-violet-50/50 hover:border-violet-300 dark:border-l-violet-500 dark:bg-violet-950/30 dark:hover:border-violet-400",
    iconBg: "bg-violet-100 dark:bg-violet-900/40",
  },
  {
    title: "車両管理",
    desc: "複数台・買い替え対応",
    emoji: "🚙",
    href: "/vehicles",
    ready: true,
    accent:
      "border-l-emerald-400 bg-emerald-50/50 hover:border-emerald-300 dark:border-l-emerald-500 dark:bg-emerald-950/30 dark:hover:border-emerald-400",
    iconBg: "bg-emerald-100 dark:bg-emerald-900/40",
  },
  {
    title: "設定",
    desc: "カテゴリ・パスキー管理",
    emoji: "⚙️",
    accent:
      "border-l-slate-300 bg-slate-50/50 dark:border-l-slate-500 dark:bg-slate-800/50",
    iconBg: "bg-slate-100 dark:bg-slate-700",
  },
];

export type NavItem = {
  title: string;
  href?: string;
  emoji: string;
  ready?: boolean;
};

export const navItems: NavItem[] = [
  { title: "ホーム", href: "/", emoji: "🏠" },
  ...menuItems.map(({ title, href, emoji, ready }) => ({
    title,
    href,
    emoji,
    ready,
  })),
];
