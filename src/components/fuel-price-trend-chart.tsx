"use client";

import { useMemo } from "react";

import { ScrollableTrendLineChart } from "@/components/scrollable-trend-line-chart";
import type { PriceTrendPoint } from "@/lib/fuel-stats";

type SerializablePriceTrendPoint = Omit<PriceTrendPoint, "date"> & {
  date: string;
};

type FuelPriceTrendChartProps = {
  priceTrend: SerializablePriceTrendPoint[];
};

export function FuelPriceTrendChart({ priceTrend }: FuelPriceTrendChartProps) {
  const points = useMemo(
    () =>
      priceTrend.map((point) => ({
        date: new Date(point.date),
        value: point.pricePerLiter,
      })),
    [priceTrend],
  );

  return (
    <ScrollableTrendLineChart
      points={points}
      ariaLabel="ガソリン単価推移グラフ"
      yAxisLabel="単価（円/L）"
      formatYTick={(value) => value.toLocaleString("ja-JP")}
      colorClassName="text-amber-500"
    />
  );
}
