import { prisma } from "@/lib/prisma";
import { computeFuelDashboardStats } from "@/lib/fuel-stats";
import { getVehicleForUser } from "@/lib/vehicles";

export type { FuelLogClientRecord, FuelLogRecord } from "@/lib/fuel-types";
export { serializeFuelLogForClient, serializeFuelLogsForClient } from "@/lib/fuel-types";

export type FuelLogInput = {
  date: Date;
  distanceKm: number;
  odometer?: number | null;
  fuelAmount: number;
  pricePerLiter: number;
  totalCost: number;
  isFull: boolean;
  gasStationName?: string | null;
  gasStationBrands?: string | null;
};

function buildFuelLogData(input: FuelLogInput) {
  return {
    date: input.date,
    distanceKm: input.distanceKm,
    odometer: input.odometer ?? null,
    fuelAmount: input.fuelAmount,
    pricePerLiter: input.pricePerLiter,
    totalCost: input.totalCost,
    isFull: input.isFull,
    gasStationName: input.gasStationName || null,
    gasStationBrands: input.gasStationBrands || null,
  };
}

export async function listFuelLogsForVehicle(userId: string, vehicleId: string) {
  const vehicle = await getVehicleForUser(userId, vehicleId);

  if (!vehicle) {
    return null;
  }

  return prisma.fuelLog.findMany({
    where: { vehicleId },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
  });
}

export async function getFuelLogForUser(userId: string, fuelLogId: string) {
  return prisma.fuelLog.findFirst({
    where: {
      id: fuelLogId,
      vehicle: { userId },
    },
  });
}

export async function createFuelLog(
  userId: string,
  vehicleId: string,
  input: FuelLogInput,
) {
  const vehicle = await getVehicleForUser(userId, vehicleId);

  if (!vehicle) {
    return null;
  }

  return prisma.fuelLog.create({
    data: {
      vehicleId,
      ...buildFuelLogData(input),
    },
  });
}

export async function updateFuelLog(
  userId: string,
  fuelLogId: string,
  input: FuelLogInput,
) {
  const existing = await getFuelLogForUser(userId, fuelLogId);

  if (!existing) {
    return null;
  }

  return prisma.fuelLog.update({
    where: { id: fuelLogId },
    data: buildFuelLogData(input),
  });
}

export async function deleteFuelLog(userId: string, fuelLogId: string) {
  const existing = await getFuelLogForUser(userId, fuelLogId);

  if (!existing) {
    return false;
  }

  await prisma.fuelLog.delete({
    where: { id: fuelLogId },
  });

  return true;
}

export async function getFuelDashboardForVehicle(
  userId: string,
  vehicleId: string,
) {
  const logs = await listFuelLogsForVehicle(userId, vehicleId);

  if (!logs) {
    return null;
  }

  return computeFuelDashboardStats(logs);
}
