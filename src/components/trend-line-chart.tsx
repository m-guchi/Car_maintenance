"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export type TrendLineChartPoint = {
  date: Date;
  value: number;
};

type TrendLineChartProps = {
  points: TrendLineChartPoint[];
  ariaLabel: string;
  yAxisLabel: string;
  formatYTick: (value: number) => string;
  colorClassName?: string;
  minValueRange?: number;
};

function formatMonthDay(date: Date): string {
  return new Intl.DateTimeFormat("ja-JP", {
    month: "numeric",
    day: "numeric",
    timeZone: "Asia/Tokyo",
  }).format(date);
}

export function TrendLineChart({
  points,
  ariaLabel,
  yAxisLabel,
  formatYTick,
  colorClassName = "text-amber-500",
  minValueRange = 1,
}: TrendLineChartProps) {
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

  const values = sortedPoints.map((point) => point.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const range = Math.max(maxValue - minValue, minValueRange);

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
      ((point.value - minValue) / range) * plotHeight;

    return { x, y, point };
  });

  const yTicks = maxValue === minValue ? [maxValue] : [maxValue, minValue];
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
        aria-label={ariaLabel}
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

        {yTicks.map((value, tickIndex) => {
          const y =
            paddingTop +
            plotHeight -
            ((value - minValue) / range) * plotHeight;

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
                {formatYTick(value)}
              </text>
            </g>
          );
        })}

        {sortedPoints.length > 1 && (
          <polyline
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            className={colorClassName}
            points={polyline}
          />
        )}

        {coordinates.map((coord, index) => (
          <circle
            key={`point-${index}`}
            cx={coord.x}
            cy={coord.y}
            r="3.5"
            className={`fill-current ${colorClassName}`}
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
        <span>{yAxisLabel}</span>
        <span>月日</span>
      </div>
    </div>
  );
}
