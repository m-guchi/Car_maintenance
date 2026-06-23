import type { FuelLog } from "@prisma/client";

import {
  computeDistanceSinceRegistration,
  computeTotalOdometerKm,
} from "@/lib/fuel-types";

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

export type MonthlyDistance = {
  monthKey: string;
  label: string;
  distanceKm: number;
  previousYearDistanceKm: number | null;
};

export const FUEL_CHART_ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;
export const MONTHLY_FUEL_COST_INITIAL_VISIBLE = 6;

export type PriceTrendPoint = {
  date: Date;
  pricePerLiter: number;
};

export type PriceTrendByStation = {
  key: string;
  label: string;
  points: PriceTrendPoint[];
};

export type FuelDashboardStats = {
  averageEfficiency: number | null;
  latestEfficiency: number | null;
  totalCost: number;
  totalFuelAmount: number;
  totalDistanceKm: number;
  totalOdometerKm: number | null;
  logCount: number;
  efficiencyRecordCount: number;
  efficiencyHistory: FuelEfficiencyPoint[];
  monthlyCosts: MonthlyFuelCost[];
  monthlyDistances: MonthlyDistance[];
  priceTrend: PriceTrendPoint[];
  priceTrendByStation: PriceTrendByStation[];
};

type NumericLike = number | FuelLog["distanceKm"] | FuelLog["fuelAmount"];

type FuelLogLike = {
  date: Date;
  distanceKm: NumericLike;
  odometer?: number | null;
  fuelAmount: NumericLike;
  pricePerLiter: number;
  totalCost: number;
  isFull: boolean;
  gasStationName?: string | null;
  gasStationBrands?: string | null;
  gasStationOsmId?: string | null;
};

function toNumber(value: NumericLike): number {
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

function getMonthKey(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    timeZone: "Asia/Tokyo",
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value ?? "";
  const month = parts.find((part) => part.type === "month")?.value ?? "";

  return `${year}-${month}`;
}

function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split("-");

  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "short",
    timeZone: "Asia/Tokyo",
  }).format(new Date(`${year}-${month}-01T12:00:00+09:00`));
}

function previousYearMonthKey(monthKey: string): string {
  const [year, month] = monthKey.split("-");

  return `${Number(year) - 1}-${month}`;
}

function compareMonthKeys(left: string, right: string): number {
  return left.localeCompare(right);
}

export function computeMonthlyDistances(logs: FuelLogLike[]): MonthlyDistance[] {
  const totals = new Map<string, number>();

  for (const log of logs) {
    const monthKey = getMonthKey(log.date);
    totals.set(monthKey, (totals.get(monthKey) ?? 0) + toNumber(log.distanceKm));
  }

  if (totals.size === 0) {
    return [];
  }

  const monthKeys = [...totals.keys()].sort(compareMonthKeys);
  const latestMonthKey = monthKeys[monthKeys.length - 1];
  const [latestYear, latestMonth] = latestMonthKey.split("-").map(Number);
  const visibleMonths: string[] = [];

  for (let index = 11; index >= 0; index -= 1) {
    let year = latestYear;
    let month = latestMonth - index;

    while (month <= 0) {
      month += 12;
      year -= 1;
    }

    visibleMonths.push(`${year}-${String(month).padStart(2, "0")}`);
  }

  return visibleMonths.map((monthKey) => ({
    monthKey,
    label: formatMonthLabel(monthKey),
    distanceKm: totals.get(monthKey) ?? 0,
    previousYearDistanceKm: totals.get(previousYearMonthKey(monthKey)) ?? null,
  }));
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
    .sort(([left], [right]) => right.localeCompare(left))
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

export function getGasStationKey(
  log: Pick<
    FuelLogLike,
    "gasStationName" | "gasStationBrands" | "gasStationOsmId"
  >,
): string | null {
  const osmId = log.gasStationOsmId?.trim();
  if (osmId) {
    return `osm:${osmId}`;
  }

  const name = log.gasStationName?.trim();
  const brand = log.gasStationBrands?.trim();

  if (!name && !brand) {
    return null;
  }

  return `name:${name ?? ""}|brand:${brand ?? ""}`;
}

export function getGasStationLabel(
  log: Pick<FuelLogLike, "gasStationName" | "gasStationBrands">,
): string {
  const name = log.gasStationName?.trim();
  const brand = log.gasStationBrands?.trim();

  if (name && brand) {
    return `${brand} ${name}`;
  }

  if (name) {
    return name;
  }

  if (brand) {
    return brand;
  }

  return "店舗未設定";
}

export function computePriceTrend(logs: FuelLogLike[]): PriceTrendPoint[] {
  const sorted = sortLogsAsc(logs);

  return sorted.map((log) => ({
    date: log.date,
    pricePerLiter: log.pricePerLiter,
  }));
}

export function computePriceTrendsByStation(
  logs: FuelLogLike[],
): PriceTrendByStation[] {
  const grouped = new Map<string, { label: string; logs: FuelLogLike[] }>();

  for (const log of logs) {
    const key = getGasStationKey(log);

    if (!key) {
      continue;
    }

    const existing = grouped.get(key);

    if (existing) {
      existing.logs.push(log);
      continue;
    }

    grouped.set(key, {
      label: getGasStationLabel(log),
      logs: [log],
    });
  }

  return [...grouped.entries()]
    .map(([key, { label, logs: stationLogs }]) => ({
      key,
      label,
      points: computePriceTrend(stationLogs),
    }))
    .sort((left, right) => left.label.localeCompare(right.label, "ja"));
}

export function computeFuelEfficiencyForLog(
  log: Pick<FuelLogLike, "isFull" | "distanceKm" | "fuelAmount">,
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

export function computeFuelDashboardStats(
  logs: FuelLogLike[],
  vehicleInitialOdometer?: number | null,
): FuelDashboardStats {
  const efficiencyHistory = computeFuelEfficiencyHistory(logs);
  const efficiencies = efficiencyHistory.map((point) => point.kmPerLiter);
  const averageEfficiency =
    efficiencies.length > 0
      ? efficiencies.reduce((sum, value) => sum + value, 0) / efficiencies.length
      : null;
  const latestEfficiency =
    efficiencies.length > 0 ? efficiencies[efficiencies.length - 1] : null;

  const normalizedLogs = logs.map((log) => ({
    date: log.date,
    distanceKm: toNumber(log.distanceKm),
    odometer: log.odometer ?? null,
  }));

  return {
    averageEfficiency,
    latestEfficiency,
    totalCost: logs.reduce((sum, log) => sum + log.totalCost, 0),
    totalFuelAmount: logs.reduce((sum, log) => sum + toNumber(log.fuelAmount), 0),
    totalDistanceKm: computeDistanceSinceRegistration(normalizedLogs),
    totalOdometerKm: computeTotalOdometerKm(
      normalizedLogs,
      vehicleInitialOdometer,
    ),
    logCount: logs.length,
    efficiencyRecordCount: efficiencyHistory.length,
    efficiencyHistory,
    monthlyCosts: computeMonthlyCosts(logs),
    monthlyDistances: computeMonthlyDistances(logs),
    priceTrend: computePriceTrend(logs),
    priceTrendByStation: computePriceTrendsByStation(logs),
  };
}
