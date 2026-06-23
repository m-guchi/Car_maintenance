import Link from "next/link";

const fuelAccent =
  "border-l-amber-400 bg-amber-50/50 hover:border-amber-300 dark:border-l-amber-500 dark:bg-amber-950/30 dark:hover:border-amber-400";
const fuelIconBg = "bg-amber-100 dark:bg-amber-900/40";
const maintenanceAccent =
  "border-l-violet-400 bg-violet-50/50 hover:border-violet-300 dark:border-l-violet-500 dark:bg-violet-950/30 dark:hover:border-violet-400";
const maintenanceIconBg = "bg-violet-100 dark:bg-violet-900/40";

const actions = [
  {
    title: "給油を記録",
    desc: "給油量・料金を入力",
    emoji: "⛽",
    href: "/fuel/new",
    accent: fuelAccent,
    iconBg: fuelIconBg,
  },
  {
    title: "メンテナンスを記録",
    desc: "整備内容・費用を入力",
    emoji: "🔧",
    href: "/maintenance/new",
    accent: maintenanceAccent,
    iconBg: maintenanceIconBg,
  },
] as const;

export function HomeQuickActions() {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
        記録を追加
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {actions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className={`rounded-xl border border-slate-200/80 border-l-4 p-4 shadow-sm transition hover:shadow-md dark:border-slate-700/80 ${action.accent}`}
          >
            <div className="flex items-start gap-3">
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl ${action.iconBg}`}
                aria-hidden="true"
              >
                {action.emoji}
              </span>
              <div className="min-w-0">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                  {action.title}
                </h3>
                <p className="mt-0.5 text-sm app-text-muted">{action.desc}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
