"use client";

import { useMemo } from "react";

import { ScrollableTrendLineChart } from "@/components/scrollable-trend-line-chart";
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
    <ScrollableTrendLineChart
      points={points}
      ariaLabel="燃費推移グラフ"
      yAxisLabel="燃費（km/L）"
      formatYTick={formatEfficiencyTick}
      colorClassName="text-emerald-500"
      minValueRange={1}
    />
  );
}
