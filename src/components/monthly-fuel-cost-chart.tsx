"use client";

import { useState } from "react";

import { BarChart } from "@/components/bar-chart";
import { formatCurrency } from "@/lib/fuel-display";
import {
  MONTHLY_FUEL_COST_INITIAL_VISIBLE,
  type MonthlyFuelCost,
} from "@/lib/fuel-stats";

type MonthlyFuelCostChartProps = {
  items: MonthlyFuelCost[];
};

export function MonthlyFuelCostChart({ items }: MonthlyFuelCostChartProps) {
  const [expanded, setExpanded] = useState(false);
  const hasHiddenItems = items.length > MONTHLY_FUEL_COST_INITIAL_VISIBLE;
  const visibleItems = expanded
    ? items
    : items.slice(0, MONTHLY_FUEL_COST_INITIAL_VISIBLE);
  const maxValue = Math.max(...items.map((item) => item.totalCost), 1);

  const chartItems = visibleItems.map((item) => ({
    label: item.label,
    totalCost: item.totalCost,
  }));

  return (
    <div>
      <BarChart
        items={chartItems}
        valueKey="totalCost"
        labelKey="label"
        formatValue={(value) => formatCurrency(value)}
        colorClassName="bg-amber-500"
        maxValue={maxValue}
      />
      {!expanded && hasHiddenItems ? (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="mt-3 w-full text-center text-sm font-medium text-blue-600 transition hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          さらに表示
        </button>
      ) : null}
    </div>
  );
}
