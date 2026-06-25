"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import {
  getMaintenanceCategoryColor,
  getMaintenanceCategoryColorStyle,
} from "@/lib/maintenance-category-colors";
import { formatOdometer } from "@/lib/vehicle-display";
import type {
  MaintenanceChartMarker,
  OdometerTimelinePoint,
} from "@/lib/maintenance-stats";

type MaintenanceOdometerChartProps = {
  timeline: OdometerTimelinePoint[];
  markers: MaintenanceChartMarker[];
};

const AREA_CHART_STROKE = "#64748b";
const AREA_CHART_FILL_CLASS = "fill-slate-500/15 dark:fill-slate-400/20";

function formatMonthDay(isoDate: string): string {
  return new Intl.DateTimeFormat("ja-JP", {
    month: "numeric",
    day: "numeric",
    timeZone: "Asia/Tokyo",
  }).format(new Date(isoDate));
}

function formatOdometerTick(km: number): string {
  if (km >= 10_000) {
    return `${Math.round(km / 1000)}k`;
  }

  return `${Math.round(km / 1000) * 1000}`;
}

export function MaintenanceOdometerChart({
  timeline,
  markers,
}: MaintenanceOdometerChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [chartWidth, setChartWidth] = useState(360);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

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

  const sortedTimeline = useMemo(
    () =>
      [...timeline].sort(
        (left, right) => new Date(left.date).getTime() - new Date(right.date).getTime(),
      ),
    [timeline],
  );

  const legendCategories = useMemo(
    () =>
      Array.from(
        new Map(markers.map((marker) => [marker.categoryId, marker])).values(),
      ),
    [markers],
  );

  const visibleMarkers = useMemo(() => {
    if (!selectedCategoryId) {
      return markers;
    }

    return markers.filter((marker) => marker.categoryId === selectedCategoryId);
  }, [markers, selectedCategoryId]);

  function handleLegendClick(categoryId: string) {
    setSelectedCategoryId((current) => (current === categoryId ? null : categoryId));
  }

  if (sortedTimeline.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        走行距離の推移を表示するには、給油またはメンテナンス記録が必要です。
      </p>
    );
  }

  const odometerValues = sortedTimeline.map((point) => point.odometer);
  const minOdometer = Math.min(...odometerValues);
  const maxOdometer = Math.max(...odometerValues);
  const odometerRange = Math.max(maxOdometer - minOdometer, 1_000);

  const times = sortedTimeline.map((point) => new Date(point.date).getTime());
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);
  const timeRange = Math.max(maxTime - minTime, 1);

  const height = 220;
  const paddingLeft = 56;
  const paddingRight = 16;
  const paddingTop = 16;
  const paddingBottom = 40;
  const plotWidth = chartWidth - paddingLeft - paddingRight;
  const plotHeight = height - paddingTop - paddingBottom;

  const coordinates = sortedTimeline.map((point) => {
    const timeRatio =
      sortedTimeline.length === 1
        ? 0.5
        : (new Date(point.date).getTime() - minTime) / timeRange;
    const x = paddingLeft + timeRatio * plotWidth;
    const y =
      paddingTop +
      plotHeight -
      ((point.odometer - minOdometer) / odometerRange) * plotHeight;

    return { x, y, point };
  });

  const areaPath = [
    `M ${coordinates[0]?.x ?? paddingLeft} ${paddingTop + plotHeight}`,
    ...coordinates.map((coord) => `L ${coord.x} ${coord.y}`),
    `L ${coordinates[coordinates.length - 1]?.x ?? paddingLeft} ${paddingTop + plotHeight}`,
    "Z",
  ].join(" ");

  const polyline = coordinates.map((coord) => `${coord.x},${coord.y}`).join(" ");

  const markerCoordinates = visibleMarkers.map((marker) => {
    const timeRatio =
      sortedTimeline.length === 1
        ? 0.5
        : (new Date(marker.date).getTime() - minTime) / timeRange;
    const x = paddingLeft + timeRatio * plotWidth;
    const y =
      paddingTop +
      plotHeight -
      ((marker.odometer - minOdometer) / odometerRange) * plotHeight;

    return { x, y, marker };
  });

  const yTicks = [maxOdometer, minOdometer + odometerRange / 2, minOdometer];
  const xLabelIndices =
    sortedTimeline.length <= 3
      ? sortedTimeline.map((_, index) => index)
      : [0, Math.floor((sortedTimeline.length - 1) / 2), sortedTimeline.length - 1];

  const chartAriaLabel =
    selectedCategoryId == null
      ? "日付と総走行距離の推移グラフ。メンテナンス実施地点をプロット表示"
      : `日付と総走行距離の推移グラフ。${
          legendCategories.find((item) => item.categoryId === selectedCategoryId)
            ?.categoryName ?? "選択中のカテゴリ"
        }のみ表示`;

  return (
    <div ref={containerRef} className="w-full">
      <svg
        viewBox={`0 0 ${chartWidth} ${height}`}
        className="h-56 w-full"
        role="img"
        aria-label={chartAriaLabel}
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
            ((value - minOdometer) / odometerRange) * plotHeight;

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
                {formatOdometerTick(value)}
              </text>
            </g>
          );
        })}

        {sortedTimeline.length > 0 && (
          <path
            d={areaPath}
            className={AREA_CHART_FILL_CLASS}
          />
        )}

        {sortedTimeline.length > 1 && (
          <polyline
            fill="none"
            stroke={AREA_CHART_STROKE}
            strokeWidth="2.5"
            points={polyline}
          />
        )}

        {markerCoordinates.map(({ x, y, marker }) => (
          <g key={marker.id}>
            <circle
              cx={x}
              cy={y}
              r="6"
              fill={getMaintenanceCategoryColor(marker.colorIndex)}
              stroke="#ffffff"
              strokeWidth="2"
            />
            <title>
              {marker.categoryName} · {formatMonthDay(marker.date)} ·{" "}
              {formatOdometer(marker.odometer)}
            </title>
          </g>
        ))}

        {xLabelIndices.map((index) => {
          const coord = coordinates[index];

          if (!coord) {
            return null;
          }

          return (
            <text
              key={`x-label-${index}`}
              x={coord.x}
              y={height - 10}
              textAnchor="middle"
              className="fill-slate-500 text-[10px]"
            >
              {formatMonthDay(coord.point.date)}
            </text>
          );
        })}
      </svg>

      <div className="mt-1 flex justify-between px-1 text-[10px] text-slate-400">
        <span>総走行距離（km）</span>
        <span>日付</span>
      </div>

      {legendCategories.length > 0 && (
        <div className="mt-3 space-y-2">
          <p className="text-xs text-slate-500">
            {selectedCategoryId
              ? "同じカテゴリをもう一度タップするとすべて表示に戻ります"
              : "カテゴリをタップすると、その整備記録だけを表示します"}
          </p>
          <ul className="flex flex-wrap gap-2">
            {legendCategories.map((marker) => {
              const isSelected = selectedCategoryId === marker.categoryId;
              const isDimmed =
                selectedCategoryId != null && selectedCategoryId !== marker.categoryId;
              const colorStyle = getMaintenanceCategoryColorStyle(marker.colorIndex);

              return (
                <li key={marker.categoryId}>
                  <button
                    type="button"
                    onClick={() => handleLegendClick(marker.categoryId)}
                    aria-pressed={isSelected}
                    className="inline-flex min-h-9 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs transition"
                    style={
                      isSelected
                        ? {
                            backgroundColor: colorStyle.filterSelectedBackground,
                            color: colorStyle.filterSelectedText,
                            boxShadow: `0 0 0 2px ${colorStyle.color}`,
                          }
                        : isDimmed
                          ? {
                              backgroundColor: colorStyle.filterDimmedBackground,
                              color: colorStyle.filterDimmedText,
                            }
                          : {
                              backgroundColor: colorStyle.filterIdleBackground,
                              color: colorStyle.filterIdleText,
                            }
                    }
                  >
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: colorStyle.color }}
                      aria-hidden
                    />
                    {marker.categoryName}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
