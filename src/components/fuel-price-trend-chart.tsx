"use client";

import { useEffect, useMemo, useRef, useState } from "react";

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

function formatMonthDay(date: Date): string {
  return new Intl.DateTimeFormat("ja-JP", {
    month: "numeric",
    day: "numeric",
    timeZone: "Asia/Tokyo",
  }).format(date);
}

function toDatePoints(
  points: SerializablePriceTrendPoint[],
): Array<{ date: Date; pricePerLiter: number }> {
  return points.map((point) => ({
    date: new Date(point.date),
    pricePerLiter: point.pricePerLiter,
  }));
}

function PriceTrendLineChart({
  points,
}: {
  points: Array<{ date: Date; pricePerLiter: number }>;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [chartWidth, setChartWidth] = useState(360);

  useEffect(() => {
    const element = containerRef.current;

    if (!element) {
      return;
    }

    const updateWidth = () => {
      const nextWidth = Math.round(element.getBoundingClientRect().width);

      if (nextWidth > 0) {
        setChartWidth(nextWidth);
      }
    };

    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  const sortedPoints = useMemo(
    () =>
      [...points].sort(
        (left, right) => left.date.getTime() - right.date.getTime(),
      ),
    [points],
  );

  if (sortedPoints.length === 0) {
    return (
      <p className="text-sm text-slate-500">表示するデータがありません</p>
    );
  }

  const prices = sortedPoints.map((point) => point.pricePerLiter);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const range = Math.max(maxPrice - minPrice, 1);

  const width = chartWidth;
  const height = 160;
  const paddingLeft = 52;
  const paddingRight = 12;
  const paddingTop = 12;
  const paddingBottom = 32;
  const plotWidth = width - paddingLeft - paddingRight;
  const plotHeight = height - paddingTop - paddingBottom;

  const times = sortedPoints.map((point) => point.date.getTime());
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);
  const timeRange = Math.max(maxTime - minTime, 1);

  const coordinates = sortedPoints.map((point) => {
    const timeRatio =
      sortedPoints.length === 1
        ? 0.5
        : (point.date.getTime() - minTime) / timeRange;
    const x = paddingLeft + timeRatio * plotWidth;
    const y =
      paddingTop +
      plotHeight -
      ((point.pricePerLiter - minPrice) / range) * plotHeight;

    return { x, y, point };
  });

  const yTicks =
    maxPrice === minPrice ? [maxPrice] : [maxPrice, minPrice];
  const xLabelIndices =
    sortedPoints.length <= 3
      ? sortedPoints.map((_, index) => index)
      : [0, Math.floor((sortedPoints.length - 1) / 2), sortedPoints.length - 1];

  const polyline = coordinates.map((coord) => `${coord.x},${coord.y}`).join(" ");

  return (
    <div ref={containerRef} className="w-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-44 w-full"
        role="img"
        aria-label="単価推移グラフ"
      >
        <line
          x1={paddingLeft}
          y1={paddingTop}
          x2={paddingLeft}
          y2={paddingTop + plotHeight}
          className="stroke-slate-200 dark:stroke-slate-600"
          strokeWidth="1"
        />
        <line
          x1={paddingLeft}
          y1={paddingTop + plotHeight}
          x2={paddingLeft + plotWidth}
          y2={paddingTop + plotHeight}
          className="stroke-slate-200 dark:stroke-slate-600"
          strokeWidth="1"
        />

        {yTicks.map((price, tickIndex) => {
          const y =
            paddingTop +
            plotHeight -
            ((price - minPrice) / range) * plotHeight;

          return (
            <g key={`y-tick-${tickIndex}`}>
              <line
                x1={paddingLeft}
                y1={y}
                x2={paddingLeft + plotWidth}
                y2={y}
                className="stroke-slate-100 dark:stroke-slate-700/80"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
              <text
                x={paddingLeft - 6}
                y={y + 4}
                textAnchor="end"
                className="fill-slate-500 text-[10px]"
              >
                {price.toLocaleString("ja-JP")}
              </text>
            </g>
          );
        })}

        {sortedPoints.length > 1 && (
          <polyline
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            className="text-amber-500"
            points={polyline}
          />
        )}

        {coordinates.map((coord, index) => (
          <circle
            key={`point-${index}`}
            cx={coord.x}
            cy={coord.y}
            r="3.5"
            className="fill-amber-500"
          />
        ))}

        {xLabelIndices.map((index) => {
          const coord = coordinates[index];

          return (
            <text
              key={`x-label-${index}`}
              x={coord.x}
              y={height - 8}
              textAnchor="middle"
              className="fill-slate-500 text-[10px]"
            >
              {formatMonthDay(coord.point.date)}
            </text>
          );
        })}
      </svg>

      <div className="mt-1 flex justify-between px-1 text-[10px] text-slate-400">
        <span>単価（円/L）</span>
        <span>月日</span>
      </div>
    </div>
  );
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

      <PriceTrendLineChart points={activePoints} />

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
