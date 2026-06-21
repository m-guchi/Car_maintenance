import type { FuelLog } from "@prisma/client";

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
