"use client";

import { useMemo } from "react";

import { TrendLineChart } from "@/components/trend-line-chart";
import type { FuelEfficiencyPoint } from "@/lib/fuel-stats";

type SerializableFuelEfficiencyPoint = Omit<FuelEfficiencyPoint, "date"> & {
  date: string;
};

type FuelEfficiencyTrendChartProps = {
  efficiencyHistory: SerializableFuelEfficiencyPoint[];
};

function formatEfficiencyTick(value: number): string {
  return value.toLocaleString("ja-JP", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

export function FuelEfficiencyTrendChart({
  efficiencyHistory,
}: FuelEfficiencyTrendChartProps) {
  const points = useMemo(
    () =>
      efficiencyHistory.map((point) => ({
        date: new Date(point.date),
        value: point.kmPerLiter,
      })),
    [efficiencyHistory],
  );

  return (
    <div className="space-y-3">
      <TrendLineChart
        points={points}
        ariaLabel="燃費推移グラフ"
        yAxisLabel="燃費（km/L）"
        formatYTick={formatEfficiencyTick}
        colorClassName="text-emerald-500"
        minValueRange={1}
      />

      {points.length > 0 && (
        <p className="text-xs text-slate-500">{points.length}件の記録</p>
      )}
    </div>
  );
}
