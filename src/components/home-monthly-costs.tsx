import { formatCurrency } from "@/lib/fuel-display";
import type { VehicleMonthlyCost } from "@/lib/vehicle-costs";

type HomeMonthlyCostsProps = {
  currentMonth: VehicleMonthlyCost;
  previousMonth: VehicleMonthlyCost;
};

function formatCostDiff(currentTotal: number, previousTotal: number): string {
  const diff = currentTotal - previousTotal;

  if (diff === 0) {
    return "先月と同じ";
  }

  const formatted = formatCurrency(Math.abs(diff));

  return diff > 0 ? `先月より +${formatted}` : `先月より -${formatted}`;
}

export function HomeMonthlyCosts({
  currentMonth,
  previousMonth,
}: HomeMonthlyCostsProps) {
  return (
    <section className="app-card space-y-4">
      <div>
        <h2 className="app-section-title">今月の維持費</h2>
        <p className="mt-1 text-sm app-text-muted">
          ガソリン代とメンテナンス費用の合計（{currentMonth.label}）
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-800/60">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            今月
          </p>
          <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">
            {formatCurrency(currentMonth.totalCost)}
          </p>
          <p className="mt-2 text-sm app-text-muted">
            ガソリン {formatCurrency(currentMonth.fuelCost)} + メンテ{" "}
            {formatCurrency(currentMonth.maintenanceCost)}
          </p>
          <p className="mt-2 text-xs app-text-subtle">
            {formatCostDiff(currentMonth.totalCost, previousMonth.totalCost)}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800/40">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            先月（{previousMonth.label}）
          </p>
          <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">
            {formatCurrency(previousMonth.totalCost)}
          </p>
          <p className="mt-2 text-sm app-text-muted">
            ガソリン {formatCurrency(previousMonth.fuelCost)} + メンテ{" "}
            {formatCurrency(previousMonth.maintenanceCost)}
          </p>
        </div>
      </div>
    </section>
  );
}
