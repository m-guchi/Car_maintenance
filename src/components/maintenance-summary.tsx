import { formatCurrency } from "@/lib/fuel-display";
import type { MaintenanceSummary } from "@/lib/maintenance-types";

type MaintenanceSummaryProps = {
  stats: MaintenanceSummary;
};

export function MaintenanceSummary({ stats }: MaintenanceSummaryProps) {
  return (
    <section className="app-card grid gap-4 sm:grid-cols-2">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          記録件数
        </p>
        <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">
          {stats.logCount.toLocaleString("ja-JP")}件
        </p>
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          累計費用
        </p>
        <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">
          {formatCurrency(stats.totalCost)}
        </p>
      </div>
    </section>
  );
}
