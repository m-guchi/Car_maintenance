import { computeTotalOdometerKm } from "@/lib/fuel-types";
import type { MaintenanceCategoryRecord } from "@/lib/maintenance-category-types";
import type { MaintenanceLogClientRecord } from "@/lib/maintenance-types";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export type FuelOdometerSample = {
  date: Date;
  odometer: number | null;
  distanceKm: number;
};

export type MaintenanceScheduleItem = {
  categoryId: string;
  categoryName: string;
  intervalKm: number | null;
  intervalDays: number | null;
  lastLogDate: string | null;
  lastLogOdometer: number | null;
  remainingKm: number | null;
  remainingDays: number | null;
  isOverdueKm: boolean;
  isOverdueDays: boolean;
  hasInterval: boolean;
  hasLastLog: boolean;
};

export type OdometerTimelinePoint = {
  date: string;
  odometer: number;
};

export type MaintenanceChartMarker = {
  id: string;
  date: string;
  odometer: number;
  categoryId: string;
  categoryName: string;
  colorIndex: number;
};

export type MaintenanceChartData = {
  timeline: OdometerTimelinePoint[];
  markers: MaintenanceChartMarker[];
  currentOdometerKm: number | null;
};

function startOfDayJst(date: Date): Date {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value ?? "1970";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const day = parts.find((part) => part.type === "day")?.value ?? "01";

  return new Date(`${year}-${month}-${day}T00:00:00+09:00`);
}

function daysBetweenJst(from: Date, to: Date): number {
  const start = startOfDayJst(from).getTime();
  const end = startOfDayJst(to).getTime();

  return Math.round((end - start) / MS_PER_DAY);
}

export function estimateCurrentOdometerKm(
  fuelLogs: FuelOdometerSample[],
  maintenanceLogs: Pick<MaintenanceLogClientRecord, "date" | "odometer">[],
  vehicleInitialOdometer: number | null | undefined,
): number | null {
  const explicitOdometers = [
    ...fuelLogs
      .filter((log) => log.odometer != null)
      .map((log) => ({ date: log.date, odometer: log.odometer as number })),
    ...maintenanceLogs.map((log) => ({
      date: log.date,
      odometer: log.odometer,
    })),
  ].sort((left, right) => right.date.getTime() - left.date.getTime());

  if (explicitOdometers.length > 0) {
    return explicitOdometers[0]?.odometer ?? null;
  }

  const fuelOdometer = computeTotalOdometerKm(
    fuelLogs.map((log) => ({
      date: log.date,
      distanceKm: log.distanceKm,
      odometer: log.odometer,
    })),
    vehicleInitialOdometer,
  );

  return fuelOdometer;
}

function getLatestLogForCategory(
  maintenanceLogs: MaintenanceLogClientRecord[],
  categoryId: string,
) {
  return maintenanceLogs
    .filter((log) => log.categoryId === categoryId)
    .sort((left, right) => {
      const dateDiff = right.date.getTime() - left.date.getTime();
      if (dateDiff !== 0) {
        return dateDiff;
      }

      return right.odometer - left.odometer;
    })[0];
}

export function computeMaintenanceSchedule(
  categories: MaintenanceCategoryRecord[],
  maintenanceLogs: MaintenanceLogClientRecord[],
  currentOdometerKm: number | null,
  today: Date = new Date(),
): MaintenanceScheduleItem[] {
  return categories
    .filter((category) => category.intervalKm != null || category.intervalDays != null)
    .map((category) => {
      const lastLog = getLatestLogForCategory(maintenanceLogs, category.id);
      const hasLastLog = Boolean(lastLog);

      let remainingKm: number | null = null;
      let remainingDays: number | null = null;
      let isOverdueKm = false;
      let isOverdueDays = false;

      if (category.intervalKm != null && hasLastLog && currentOdometerKm != null) {
        const nextDueOdometer = lastLog!.odometer + category.intervalKm;
        remainingKm = nextDueOdometer - currentOdometerKm;
        isOverdueKm = remainingKm < 0;
      }

      if (category.intervalDays != null && hasLastLog) {
        const elapsedDays = daysBetweenJst(lastLog!.date, today);
        remainingDays = category.intervalDays - elapsedDays;
        isOverdueDays = remainingDays < 0;
      }

      return {
        categoryId: category.id,
        categoryName: category.name,
        intervalKm: category.intervalKm,
        intervalDays: category.intervalDays,
        lastLogDate: lastLog ? lastLog.date.toISOString() : null,
        lastLogOdometer: lastLog?.odometer ?? null,
        remainingKm,
        remainingDays,
        isOverdueKm,
        isOverdueDays,
        hasInterval: true,
        hasLastLog,
      };
    });
}

function mergeTimelinePoints(
  points: { date: Date; odometer: number }[],
): OdometerTimelinePoint[] {
  const sorted = [...points].sort(
    (left, right) => left.date.getTime() - right.date.getTime(),
  );

  const merged: { date: Date; odometer: number }[] = [];

  for (const point of sorted) {
    const dayKey = startOfDayJst(point.date).toISOString();
    const existingIndex = merged.findIndex(
      (item) => startOfDayJst(item.date).toISOString() === dayKey,
    );

    if (existingIndex === -1) {
      merged.push(point);
      continue;
    }

    if (point.odometer > merged[existingIndex]!.odometer) {
      merged[existingIndex] = point;
    }
  }

  return merged.map((point) => ({
    date: point.date.toISOString(),
    odometer: point.odometer,
  }));
}

export function buildOdometerTimeline(
  fuelLogs: FuelOdometerSample[],
  maintenanceLogs: MaintenanceLogClientRecord[],
  vehicleInitialOdometer: number | null | undefined,
): OdometerTimelinePoint[] {
  const explicitPoints = [
    ...fuelLogs
      .filter((log) => log.odometer != null)
      .map((log) => ({ date: log.date, odometer: log.odometer as number })),
    ...maintenanceLogs.map((log) => ({
      date: log.date,
      odometer: log.odometer,
    })),
  ];

  if (explicitPoints.length > 0) {
    return mergeTimelinePoints(explicitPoints);
  }

  const sortedFuel = [...fuelLogs].sort(
    (left, right) => left.date.getTime() - right.date.getTime(),
  );

  if (sortedFuel.length === 0) {
    return maintenanceLogs.length > 0
      ? mergeTimelinePoints(
          maintenanceLogs.map((log) => ({
            date: log.date,
            odometer: log.odometer,
          })),
        )
      : [];
  }

  let runningOdometer = vehicleInitialOdometer ?? 0;
  const derivedPoints = sortedFuel.map((log) => {
    if (log.odometer != null) {
      runningOdometer = log.odometer;
    } else {
      runningOdometer += log.distanceKm;
    }

    return {
      date: log.date,
      odometer: runningOdometer,
    };
  });

  return mergeTimelinePoints([
    ...derivedPoints,
    ...maintenanceLogs.map((log) => ({
      date: log.date,
      odometer: log.odometer,
    })),
  ]);
}

export function buildMaintenanceChartData(
  categories: MaintenanceCategoryRecord[],
  fuelLogs: FuelOdometerSample[],
  maintenanceLogs: MaintenanceLogClientRecord[],
  vehicleInitialOdometer: number | null | undefined,
): MaintenanceChartData {
  const categoryIndexById = new Map(
    categories.map((category, index) => [category.id, index]),
  );

  const timeline = buildOdometerTimeline(
    fuelLogs,
    maintenanceLogs,
    vehicleInitialOdometer,
  );

  const currentOdometerKm = estimateCurrentOdometerKm(
    fuelLogs,
    maintenanceLogs,
    vehicleInitialOdometer,
  );

  const markers = [...maintenanceLogs]
    .sort((left, right) => left.date.getTime() - right.date.getTime())
    .map((log) => ({
      id: log.id,
      date: log.date.toISOString(),
      odometer: log.odometer,
      categoryId: log.categoryId,
      categoryName: log.categoryName,
      colorIndex: categoryIndexById.get(log.categoryId) ?? 0,
    }));

  return {
    timeline,
    markers,
    currentOdometerKm,
  };
}

export function getMaintenanceAlerts(
  schedule: MaintenanceScheduleItem[],
): MaintenanceScheduleItem[] {
  return schedule.filter(
    (item) => item.hasLastLog && (item.isOverdueKm || item.isOverdueDays),
  );
}

export function serializeMaintenanceSchedule(
  schedule: MaintenanceScheduleItem[],
): MaintenanceScheduleItem[] {
  return schedule;
}

export function serializeMaintenanceChartData(
  chartData: MaintenanceChartData,
): MaintenanceChartData {
  return chartData;
}
