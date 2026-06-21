import {
  formatCurrency,
  formatDistanceKmValue,
  formatFuelEfficiency,
} from "@/lib/fuel-display";
import type { FuelDashboardStats } from "@/lib/fuel-stats";
import { formatOdometer } from "@/lib/vehicle-display";

import { FuelEfficiencyTrendChart } from "@/components/fuel-efficiency-trend-chart";
import { FuelPriceTrendChart } from "@/components/fuel-price-trend-chart";
import { MonthlyFuelCostChart } from "@/components/monthly-fuel-cost-chart";

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

export function FuelDashboard({ stats }: FuelDashboardProps) {
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
            <MonthlyFuelCostChart items={stats.monthlyCosts} />
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
            <FuelEfficiencyTrendChart
              efficiencyHistory={stats.efficiencyHistory.map((point) => ({
                date: point.date.toISOString(),
                kmPerLiter: point.kmPerLiter,
                distanceKm: point.distanceKm,
              }))}
            />
          </div>
        </div>
      )}
    </section>
  );
}
