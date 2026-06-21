"use client";

import { useMemo, useState } from "react";

import { TrendLineChart } from "@/components/trend-line-chart";
import type { PriceTrendByStation, PriceTrendPoint } from "@/lib/fuel-stats";

type SerializablePriceTrendPoint = Omit<PriceTrendPoint, "date"> & {
  date: string;
};

type SerializablePriceTrendByStation = Omit<PriceTrendByStation, "points"> & {
  points: SerializablePriceTrendPoint[];
};

type FuelPriceTrendChartProps = {
  priceTrend: SerializablePriceTrendPoint[];
  priceTrendByStation: SerializablePriceTrendByStation[];
};

const ALL_STATIONS_KEY = "__all__";

function toDatePoints(
  points: SerializablePriceTrendPoint[],
): Array<{ date: Date; value: number }> {
  return points.map((point) => ({
    date: new Date(point.date),
    value: point.pricePerLiter,
  }));
}

export function FuelPriceTrendChart({
  priceTrend,
  priceTrendByStation,
}: FuelPriceTrendChartProps) {
  const options = useMemo(
    () => [
      { key: ALL_STATIONS_KEY, label: "すべて" },
      ...priceTrendByStation.map((station) => ({
        key: station.key,
        label: station.label,
      })),
    ],
    [priceTrendByStation],
  );

  const [selectedKey, setSelectedKey] = useState(ALL_STATIONS_KEY);

  const activePoints = useMemo(() => {
    if (selectedKey === ALL_STATIONS_KEY) {
      return toDatePoints(priceTrend);
    }

    const station = priceTrendByStation.find((item) => item.key === selectedKey);
    return station ? toDatePoints(station.points) : [];
  }, [priceTrend, priceTrendByStation, selectedKey]);

  return (
    <div className="space-y-3">
      {options.length > 1 && (
        <div>
          <label htmlFor="price-trend-station" className="sr-only">
            店舗
          </label>
          <select
            id="price-trend-station"
            value={selectedKey}
            onChange={(event) => setSelectedKey(event.target.value)}
            className="app-input max-w-full text-sm"
          >
            {options.map((option) => (
              <option key={option.key} value={option.key}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      )}

      <TrendLineChart
        points={activePoints}
        ariaLabel="単価推移グラフ"
        yAxisLabel="単価（円/L）"
        formatYTick={(value) => value.toLocaleString("ja-JP")}
        colorClassName="text-amber-500"
      />

      {activePoints.length > 0 && (
        <p className="text-xs text-slate-500">
          {activePoints.length}件の記録
          {selectedKey !== ALL_STATIONS_KEY
            ? `（${options.find((option) => option.key === selectedKey)?.label ?? ""}）`
            : ""}
        </p>
      )}
    </div>
  );
}
