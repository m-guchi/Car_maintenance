import type { FuelLog } from "@prisma/client";

export type FuelEfficiencyPoint = {
  date: Date;
  kmPerLiter: number;
  distanceKm: number;
};

export type MonthlyFuelCost = {
  monthKey: string;
  label: string;
  totalCost: number;
};

export type PriceTrendPoint = {
  date: Date;
  pricePerLiter: number;
};

export type FuelDashboardStats = {
  averageEfficiency: number | null;
  latestEfficiency: number | null;
  totalCost: number;
  totalFuelAmount: number;
  totalDistanceKm: number;
  logCount: number;
  efficiencyHistory: FuelEfficiencyPoint[];
  monthlyCosts: MonthlyFuelCost[];
  priceTrend: PriceTrendPoint[];
};

type FuelLogLike = Pick<
  FuelLog,
  | "date"
  | "distanceKm"
  | "fuelAmount"
  | "pricePerLiter"
  | "totalCost"
  | "isFull"
>;

function toNumber(
  value: FuelLogLike["fuelAmount"] | FuelLogLike["distanceKm"],
): number {
  return Number(value);
}

function sortLogsAsc(logs: FuelLogLike[]): FuelLogLike[] {
  return [...logs].sort((a, b) => {
    const dateDiff = a.date.getTime() - b.date.getTime();
    if (dateDiff !== 0) {
      return dateDiff;
    }

    return toNumber(a.distanceKm) - toNumber(b.distanceKm);
  });
}

export function computeFuelEfficiencyHistory(
  logs: FuelLogLike[],
): FuelEfficiencyPoint[] {
  return sortLogsAsc(logs).flatMap((log) => {
    if (!log.isFull) {
      return [];
    }

    const distance = toNumber(log.distanceKm);
    const fuelAmount = toNumber(log.fuelAmount);

    if (distance <= 0 || fuelAmount <= 0) {
      return [];
    }

    return [
      {
        date: log.date,
        kmPerLiter: distance / fuelAmount,
        distanceKm: distance,
      },
    ];
  });
}

export function computeMonthlyCosts(logs: FuelLogLike[]): MonthlyFuelCost[] {
  const totals = new Map<string, number>();

  for (const log of logs) {
    const parts = new Intl.DateTimeFormat("en-CA", {
      year: "numeric",
      month: "2-digit",
      timeZone: "Asia/Tokyo",
    }).formatToParts(log.date);

    const year = parts.find((part) => part.type === "year")?.value ?? "";
    const month = parts.find((part) => part.type === "month")?.value ?? "";
    const monthKey = `${year}-${month}`;

    totals.set(monthKey, (totals.get(monthKey) ?? 0) + log.totalCost);
  }

  return [...totals.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .slice(-6)
    .map(([monthKey, totalCost]) => {
      const [year, month] = monthKey.split("-");
      const label = new Intl.DateTimeFormat("ja-JP", {
        year: "numeric",
        month: "short",
        timeZone: "Asia/Tokyo",
      }).format(new Date(`${year}-${month}-01T12:00:00+09:00`));

      return { monthKey, label, totalCost };
    });
}

export function computePriceTrend(logs: FuelLogLike[]): PriceTrendPoint[] {
  return sortLogsAsc(logs)
    .slice(-12)
    .map((log) => ({
      date: log.date,
      pricePerLiter: log.pricePerLiter,
    }));
}

export function computeFuelEfficiencyForLog(
  log: Pick<FuelLog, "isFull" | "distanceKm" | "fuelAmount">,
): number | null {
  if (!log.isFull) {
    return null;
  }

  const distance = toNumber(log.distanceKm);
  const fuelAmount = toNumber(log.fuelAmount);

  if (distance <= 0 || fuelAmount <= 0) {
    return null;
  }

  return distance / fuelAmount;
}

export function computeFuelDashboardStats(logs: FuelLogLike[]): FuelDashboardStats {
  const efficiencyHistory = computeFuelEfficiencyHistory(logs);
  const efficiencies = efficiencyHistory.map((point) => point.kmPerLiter);
  const averageEfficiency =
    efficiencies.length > 0
      ? efficiencies.reduce((sum, value) => sum + value, 0) / efficiencies.length
      : null;
  const latestEfficiency =
    efficiencies.length > 0 ? efficiencies[efficiencies.length - 1] : null;

  return {
    averageEfficiency,
    latestEfficiency,
    totalCost: logs.reduce((sum, log) => sum + log.totalCost, 0),
    totalFuelAmount: logs.reduce((sum, log) => sum + toNumber(log.fuelAmount), 0),
    totalDistanceKm: logs.reduce(
      (sum, log) => sum + toNumber(log.distanceKm),
      0,
    ),
    logCount: logs.length,
    efficiencyHistory: efficiencyHistory.slice(-6),
    monthlyCosts: computeMonthlyCosts(logs),
    priceTrend: computePriceTrend(logs),
  };
}
