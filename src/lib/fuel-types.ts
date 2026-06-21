import type { FuelLog } from "@prisma/client";

import type { KnownGasStation } from "@/lib/gas-stations";

export type FuelLogRecord = FuelLog;

export type FuelLogClientRecord = Omit<
  FuelLogRecord,
  "distanceKm" | "fuelAmount"
> & {
  distanceKm: number;
  fuelAmount: number;
};

export function serializeFuelLogForClient(
  log: FuelLogRecord,
): FuelLogClientRecord {
  return {
    ...log,
    distanceKm: Number(log.distanceKm),
    fuelAmount: Number(log.fuelAmount),
  };
}

export function serializeFuelLogsForClient(
  logs: FuelLogRecord[],
): FuelLogClientRecord[] {
  return logs.map(serializeFuelLogForClient);
}

export function computeDistanceSinceRegistration(
  fuelLogs: Pick<FuelLogClientRecord, "distanceKm">[],
): number {
  return fuelLogs.reduce((sum, log) => sum + log.distanceKm, 0);
}

function sortFuelLogsAsc(
  fuelLogs: Pick<FuelLogClientRecord, "id" | "date" | "distanceKm">[],
) {
  return [...fuelLogs].sort((left, right) => {
    const dateDiff = left.date.getTime() - right.date.getTime();
    if (dateDiff !== 0) {
      return dateDiff;
    }

    return left.distanceKm - right.distanceKm;
  });
}

export function buildCumulativeDistanceByLogId(
  fuelLogs: Pick<FuelLogClientRecord, "id" | "date" | "distanceKm">[],
): Map<string, number> {
  const cumulativeDistanceByLogId = new Map<string, number>();
  let cumulativeDistanceKm = 0;

  for (const fuelLog of sortFuelLogsAsc(fuelLogs)) {
    cumulativeDistanceKm += fuelLog.distanceKm;
    cumulativeDistanceByLogId.set(fuelLog.id, cumulativeDistanceKm);
  }

  return cumulativeDistanceByLogId;
}

export function computeTotalOdometerKm(
  fuelLogs: Pick<FuelLogClientRecord, "odometer" | "date" | "distanceKm">[],
  vehicleInitialOdometer: number | null | undefined,
): number | null {
  const sortedDesc = [...fuelLogs].sort(
    (left, right) => right.date.getTime() - left.date.getTime(),
  );

  for (const log of sortedDesc) {
    if (log.odometer != null) {
      return log.odometer;
    }
  }

  const distanceSum = computeDistanceSinceRegistration(fuelLogs);

  if (vehicleInitialOdometer != null) {
    return vehicleInitialOdometer + distanceSum;
  }

  return null;
}

export function getPreviousOdometer(
  fuelLogs: Pick<FuelLogClientRecord, "id" | "odometer">[],
  vehicleInitialOdometer: number | null | undefined,
  excludeFuelLogId?: string,
): number | null {
  for (const log of fuelLogs) {
    if (excludeFuelLogId && log.id === excludeFuelLogId) {
      continue;
    }

    if (log.odometer != null) {
      return log.odometer;
    }
  }

  return vehicleInitialOdometer ?? null;
}

export function calculateOdometerFromDistance(
  distanceKm: string,
  previousOdometer: number | null | undefined,
): string {
  if (previousOdometer == null) {
    return "";
  }

  const distance = Number.parseFloat(distanceKm);

  if (Number.isNaN(distance) || distance <= 0) {
    return "";
  }

  return String(Math.round(previousOdometer + distance));
}

export function buildKnownGasStationsFromLogs(
  logs: Pick<
    FuelLogClientRecord,
    "gasStationOsmId" | "gasStationName" | "gasStationBrands" | "date"
  >[],
): KnownGasStation[] {
  const knownByOsmId = new Map<string, KnownGasStation>();

  for (const log of logs) {
    if (log.gasStationOsmId == null || !log.gasStationName) {
      continue;
    }

    if (!knownByOsmId.has(log.gasStationOsmId)) {
      knownByOsmId.set(log.gasStationOsmId, {
        osmId: log.gasStationOsmId,
        registeredName: log.gasStationName,
        brand: log.gasStationBrands,
      });
    }
  }

  return Array.from(knownByOsmId.values());
}

function getInitialOdometerState(
  fuelLog: FuelLogClientRecord | undefined,
  previousOdometer: number | null | undefined,
) {
  const distanceKm = fuelLog ? String(fuelLog.distanceKm) : "";
  const autoOdometer = calculateOdometerFromDistance(distanceKm, previousOdometer);

  if (fuelLog?.odometer != null) {
    const manualOdometer = String(fuelLog.odometer);
    const odometerManuallySet =
      autoOdometer === "" || manualOdometer !== autoOdometer;

    return { manualOdometer, odometerManuallySet };
  }

  return { manualOdometer: autoOdometer, odometerManuallySet: false };
}

export { getInitialOdometerState };
