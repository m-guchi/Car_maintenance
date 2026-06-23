import { formatMonthLabel, getMonthKey } from "@/lib/fuel-stats";

export type VehicleMonthlyCost = {
  monthKey: string;
  label: string;
  fuelCost: number;
  maintenanceCost: number;
  totalCost: number;
};

function sumCostsByMonth(entries: { date: Date; cost: number }[]): Map<string, number> {
  const totals = new Map<string, number>();

  for (const entry of entries) {
    const monthKey = getMonthKey(entry.date);
    totals.set(monthKey, (totals.get(monthKey) ?? 0) + entry.cost);
  }

  return totals;
}

function getPreviousMonthKey(monthKey: string): string {
  const [year, month] = monthKey.split("-").map(Number);
  let prevMonth = month - 1;
  let prevYear = year;

  if (prevMonth <= 0) {
    prevMonth = 12;
    prevYear -= 1;
  }

  return `${prevYear}-${String(prevMonth).padStart(2, "0")}`;
}

function buildMonthlyCost(
  monthKey: string,
  fuelTotals: Map<string, number>,
  maintenanceTotals: Map<string, number>,
): VehicleMonthlyCost {
  const fuelCost = fuelTotals.get(monthKey) ?? 0;
  const maintenanceCost = maintenanceTotals.get(monthKey) ?? 0;

  return {
    monthKey,
    label: formatMonthLabel(monthKey),
    fuelCost,
    maintenanceCost,
    totalCost: fuelCost + maintenanceCost,
  };
}

export function computeVehicleMonthlyCosts(
  fuelLogs: { date: Date; totalCost: number }[],
  maintenanceLogs: { date: Date; cost: number }[],
  today: Date = new Date(),
): { currentMonth: VehicleMonthlyCost; previousMonth: VehicleMonthlyCost } {
  const fuelTotals = sumCostsByMonth(
    fuelLogs.map((log) => ({ date: log.date, cost: log.totalCost })),
  );
  const maintenanceTotals = sumCostsByMonth(
    maintenanceLogs.map((log) => ({ date: log.date, cost: log.cost })),
  );

  const currentMonthKey = getMonthKey(today);
  const previousMonthKey = getPreviousMonthKey(currentMonthKey);

  return {
    currentMonth: buildMonthlyCost(currentMonthKey, fuelTotals, maintenanceTotals),
    previousMonth: buildMonthlyCost(previousMonthKey, fuelTotals, maintenanceTotals),
  };
}
