import {
  formatCurrency,
  formatDistanceKmValue,
  formatFuelEfficiency,
} from "@/lib/fuel-display";
import type { FuelDashboardStats } from "@/lib/fuel-stats";
import { formatDateJa, formatOdometer } from "@/lib/vehicle-display";

import { FuelPriceTrendChart } from "@/components/fuel-price-trend-chart";

type FuelMileageSummaryProps = {
  totalOdometerKm: number | null;
  distanceSinceRegistrationKm: number;
};

export function FuelMileageSummary({
  totalOdometerKm,
  distanceSinceRegistrationKm,
}: FuelMileageSummaryProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="app-card border-l-4 border-l-violet-500 p-4">
        <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">
          総走行距離
        </p>
        <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
          {totalOdometerKm !== null ? formatOdometer(totalOdometerKm) : "—"}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          {totalOdometerKm !== null
            ? "最新のオドメーター"
            : "登録時走行距離または給油記録が必要"}
        </p>
      </div>

      <div className="app-card border-l-4 border-l-sky-500 p-4">
        <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">
          登録以降の走行距離
        </p>
        <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
          {formatDistanceKmValue(distanceSinceRegistrationKm)}
        </p>
        <p className="mt-1 text-xs text-slate-500">給油記録の走行距離合計</p>
      </div>
    </div>
  );
}

type FuelDashboardProps = {
  stats: FuelDashboardStats;
};

function BarChart({
  items,
  valueKey,
  labelKey,
  formatValue,
  colorClassName,
}: {
  items: Array<Record<string, string | number>>;
  valueKey: string;
  labelKey: string;
  formatValue: (value: number) => string;
  colorClassName: string;
}) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-slate-500">表示するデータがありません</p>
    );
  }

  const maxValue = Math.max(
    ...items.map((item) => Number(item[valueKey])),
    1,
  );

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const value = Number(item[valueKey]);
        const widthPercent = Math.max((value / maxValue) * 100, 4);

        return (
          <div key={String(item[labelKey])}>
            <div className="mb-1 flex items-center justify-between gap-2 text-xs">
              <span className="truncate text-slate-600 dark:text-slate-400">
                {item[labelKey]}
              </span>
              <span className="shrink-0 font-medium text-slate-800 dark:text-slate-200">
                {formatValue(value)}
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
              <div
                className={`h-full rounded-full ${colorClassName}`}
                style={{ width: `${widthPercent}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function FuelDashboard({ stats }: FuelDashboardProps) {
  const monthlyChartItems = stats.monthlyCosts.map((item) => ({
    label: item.label,
    totalCost: item.totalCost,
  }));

  const efficiencyChartItems = stats.efficiencyHistory.map((item) => ({
    label: formatDateJa(item.date),
    kmPerLiter: item.kmPerLiter,
  }));

  return (
    <section className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="app-card border-l-4 border-l-emerald-500 p-4">
          <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">
            直近の燃費
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
            {stats.latestEfficiency !== null
              ? formatFuelEfficiency(stats.latestEfficiency)
              : "—"}
          </p>
          <p className="mt-1 text-xs text-slate-500">満タン給油ベース</p>
        </div>

        <div className="app-card border-l-4 border-l-blue-500 p-4">
          <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">
            平均燃費
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
            {stats.averageEfficiency !== null
              ? formatFuelEfficiency(stats.averageEfficiency)
              : "—"}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {stats.efficiencyHistory.length}回分
          </p>
        </div>

        <div className="app-card border-l-4 border-l-amber-500 p-4">
          <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">
            累計給油費
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
            {formatCurrency(stats.totalCost)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {stats.logCount}件の記録
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="app-card p-5">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            月別給油費
          </h3>
          <div className="mt-4">
            <BarChart
              items={monthlyChartItems}
              valueKey="totalCost"
              labelKey="label"
              formatValue={(value) => formatCurrency(value)}
              colorClassName="bg-amber-500"
            />
          </div>
        </div>

        <div className="app-card p-5">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            単価推移
          </h3>
          <div className="mt-4">
            <FuelPriceTrendChart
              priceTrend={stats.priceTrend.map((point) => ({
                date: point.date.toISOString(),
                pricePerLiter: point.pricePerLiter,
              }))}
              priceTrendByStation={stats.priceTrendByStation.map((station) => ({
                key: station.key,
                label: station.label,
                points: station.points.map((point) => ({
                  date: point.date.toISOString(),
                  pricePerLiter: point.pricePerLiter,
                })),
              }))}
            />
          </div>
        </div>
      </div>

      {stats.efficiencyHistory.length > 0 && (
        <div className="app-card p-5">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            燃費の推移
          </h3>
          <div className="mt-4">
            <BarChart
              items={efficiencyChartItems}
              valueKey="kmPerLiter"
              labelKey="label"
              formatValue={(value) => formatFuelEfficiency(value)}
              colorClassName="bg-emerald-500"
            />
          </div>
        </div>
      )}
    </section>
  );
}
