"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { FUEL_CHART_ONE_YEAR_MS } from "@/lib/fuel-stats";

export type ScrollableTrendLineChartPoint = {
  date: Date;
  value: number;
};

type ScrollableTrendLineChartProps = {
  points: ScrollableTrendLineChartPoint[];
  ariaLabel: string;
  yAxisLabel: string;
  formatYTick: (value: number) => string;
  colorClassName?: string;
  minValueRange?: number;
};

const PADDING_LEFT = 52;
const PADDING_RIGHT = 16;
const PADDING_TOP = 12;
const PADDING_BOTTOM = 32;
const CHART_HEIGHT = 160;

function formatMonthDay(date: Date): string {
  return new Intl.DateTimeFormat("ja-JP", {
    month: "numeric",
    day: "numeric",
    timeZone: "Asia/Tokyo",
  }).format(date);
}

function incrementMonthKey(monthKey: string): string {
  const [year, month] = monthKey.split("-").map(Number);
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;

  return `${nextYear}-${String(nextMonth).padStart(2, "0")}`;
}

function buildMonthTicks(domainStart: number, domainEnd: number): number[] {
  const ticks: number[] = [];
  let currentKey = getMonthKeyFromTime(domainStart);
  const endKey = getMonthKeyFromTime(domainEnd);

  while (currentKey.localeCompare(endKey) <= 0) {
    const [year, month] = currentKey.split("-");
    ticks.push(new Date(`${year}-${month}-01T12:00:00+09:00`).getTime());
    currentKey = incrementMonthKey(currentKey);
  }

  if (ticks.length === 0) {
    ticks.push(domainStart, domainEnd);
  }

  return ticks;
}

function getMonthKeyFromTime(time: number): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    timeZone: "Asia/Tokyo",
  }).formatToParts(new Date(time));

  const year = parts.find((part) => part.type === "year")?.value ?? "";
  const month = parts.find((part) => part.type === "month")?.value ?? "";

  return `${year}-${month}`;
}

export function ScrollableTrendLineChart({
  points,
  ariaLabel,
  yAxisLabel,
  formatYTick,
  colorClassName = "text-amber-500",
  minValueRange = 1,
}: ScrollableTrendLineChartProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [viewportWidth, setViewportWidth] = useState(360);

  const sortedPoints = useMemo(
    () =>
      [...points].sort(
        (left, right) => left.date.getTime() - right.date.getTime(),
      ),
    [points],
  );

  useEffect(() => {
    const element = viewportRef.current;

    if (!element) {
      return;
    }

    const updateWidth = () => {
      const nextWidth = Math.round(element.getBoundingClientRect().width);

      if (nextWidth > 0) {
        setViewportWidth(nextWidth);
      }
    };

    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const element = viewportRef.current;

    if (!element) {
      return;
    }

    element.scrollLeft = element.scrollWidth - element.clientWidth;
  }, [sortedPoints, viewportWidth]);

  if (sortedPoints.length === 0) {
    return (
      <p className="text-sm text-slate-500">表示するデータがありません</p>
    );
  }

  const values = sortedPoints.map((point) => point.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const valueRange = Math.max(maxValue - minValue, minValueRange);

  const pointTimes = sortedPoints.map((point) => point.date.getTime());
  const dataStart = Math.min(...pointTimes);
  const dataEnd = Math.max(...pointTimes);
  const dataSpan = Math.max(dataEnd - dataStart, 1);
  const domainSpan = Math.max(dataSpan, FUEL_CHART_ONE_YEAR_MS);
  const domainEnd = dataEnd;
  const domainStart = domainEnd - domainSpan;

  const viewportPlotWidth = Math.max(viewportWidth - PADDING_LEFT, 120);
  const chartPlotWidth = viewportPlotWidth * (domainSpan / FUEL_CHART_ONE_YEAR_MS);
  const chartWidth = PADDING_LEFT + chartPlotWidth + PADDING_RIGHT;
  const plotHeight = CHART_HEIGHT - PADDING_TOP - PADDING_BOTTOM;

  const coordinates = sortedPoints.map((point) => {
    const timeRatio = (point.date.getTime() - domainStart) / domainSpan;
    const x = PADDING_LEFT + timeRatio * chartPlotWidth;
    const y =
      PADDING_TOP +
      plotHeight -
      ((point.value - minValue) / valueRange) * plotHeight;

    return { x, y, point };
  });

  const yTicks = maxValue === minValue ? [maxValue] : [maxValue, minValue];
  const monthTicks = buildMonthTicks(domainStart, domainEnd);

  const polyline = coordinates.map((coord) => `${coord.x},${coord.y}`).join(" ");

  return (
    <div className="w-full">
      <div className="flex">
        <div
          className="relative shrink-0"
          style={{ width: PADDING_LEFT, height: CHART_HEIGHT }}
          aria-hidden="true"
        >
          {yTicks.map((value, tickIndex) => {
            const y =
              PADDING_TOP +
              plotHeight -
              ((value - minValue) / valueRange) * plotHeight;

            return (
              <span
                key={`y-tick-${tickIndex}`}
                className="absolute right-1 -translate-y-1/2 text-[10px] text-slate-500"
                style={{ top: y }}
              >
                {formatYTick(value)}
              </span>
            );
          })}
        </div>

        <div
          ref={viewportRef}
          className="min-w-0 flex-1 overflow-x-auto overscroll-x-contain"
        >
          <svg
            viewBox={`0 0 ${chartWidth} ${CHART_HEIGHT}`}
            width={chartWidth}
            height={CHART_HEIGHT}
            className="block max-w-none"
            role="img"
            aria-label={ariaLabel}
          >
            <line
              x1={PADDING_LEFT}
              y1={PADDING_TOP}
              x2={PADDING_LEFT}
              y2={PADDING_TOP + plotHeight}
              className="stroke-slate-200 dark:stroke-slate-600"
              strokeWidth="1"
            />
            <line
              x1={PADDING_LEFT}
              y1={PADDING_TOP + plotHeight}
              x2={PADDING_LEFT + chartPlotWidth}
              y2={PADDING_TOP + plotHeight}
              className="stroke-slate-200 dark:stroke-slate-600"
              strokeWidth="1"
            />

            {yTicks.map((value, tickIndex) => {
              const y =
                PADDING_TOP +
                plotHeight -
                ((value - minValue) / valueRange) * plotHeight;

              return (
                <line
                  key={`grid-${tickIndex}`}
                  x1={PADDING_LEFT}
                  y1={y}
                  x2={PADDING_LEFT + chartPlotWidth}
                  y2={y}
                  className="stroke-slate-100 dark:stroke-slate-700/80"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
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

            {monthTicks.map((tickTime) => {
              const x =
                PADDING_LEFT +
                ((tickTime - domainStart) / domainSpan) * chartPlotWidth;

              return (
                <text
                  key={`x-label-${tickTime}`}
                  x={x}
                  y={CHART_HEIGHT - 8}
                  textAnchor="middle"
                  className="fill-slate-500 text-[10px]"
                >
                  {formatMonthDay(new Date(tickTime))}
                </text>
              );
            })}
          </svg>
        </div>
      </div>

      <div className="mt-1 flex justify-between px-1 text-[10px] text-slate-400">
        <span>{yAxisLabel}</span>
        <span>月日（1年表示・横スクロールで過去を表示）</span>
      </div>
    </div>
  );
}
