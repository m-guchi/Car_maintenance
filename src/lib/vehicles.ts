import type { DriveType, FuelType } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type VehicleInput = {
  name: string;
  manufacturer?: string | null;
  modelName?: string | null;
  modelCode?: string | null;
  fuelType?: FuelType | null;
  inspectionExpiry?: Date | null;
  licensePlate?: string | null;
  firstRegistrationDate?: Date | null;
  initialOdometer?: number | null;
  displacement?: number | null;
  driveType?: DriveType | null;
  isActive: boolean;
};

function buildVehicleData(input: VehicleInput) {
  return {
    name: input.name,
    manufacturer: input.manufacturer || null,
    modelName: input.modelName || null,
    modelCode: input.modelCode || null,
    fuelType: input.fuelType ?? null,
    inspectionExpiry: input.inspectionExpiry ?? null,
    licensePlate: input.licensePlate || null,
    firstRegistrationDate: input.firstRegistrationDate ?? null,
    initialOdometer: input.initialOdometer ?? null,
    displacement: input.displacement ?? null,
    driveType: input.driveType ?? null,
    isActive: input.isActive,
  };
}

export async function listVehicles(userId: string) {
  return prisma.vehicle.findMany({
    where: { userId },
    orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
  });
}

export async function getVehicleForUser(userId: string, vehicleId: string) {
  return prisma.vehicle.findFirst({
    where: { id: vehicleId, userId },
  });
}

export async function createVehicle(userId: string, input: VehicleInput) {
  return prisma.$transaction(async (tx) => {
    if (input.isActive) {
      await tx.vehicle.updateMany({
        where: { userId, isActive: true },
        data: { isActive: false },
      });
    }

    return tx.vehicle.create({
      data: {
        userId,
        ...buildVehicleData(input),
      },
    });
  });
}

export async function updateVehicle(
  userId: string,
  vehicleId: string,
  input: VehicleInput,
) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.vehicle.findFirst({
      where: { id: vehicleId, userId },
    });

    if (!existing) {
      return null;
    }

    if (input.isActive) {
      await tx.vehicle.updateMany({
        where: { userId, isActive: true, id: { not: vehicleId } },
        data: { isActive: false },
      });
    }

    return tx.vehicle.update({
      where: { id: vehicleId },
      data: buildVehicleData(input),
    });
  });
}

export async function deleteVehicle(userId: string, vehicleId: string) {
  const existing = await prisma.vehicle.findFirst({
    where: { id: vehicleId, userId },
  });

  if (!existing) {
    return false;
  }

  await prisma.vehicle.delete({
    where: { id: vehicleId },
  });

  return true;
}

export type VehicleRecord = Awaited<ReturnType<typeof listVehicles>>[number];
