import { prisma } from "@/lib/prisma";
import type { MaintenanceLogInput } from "@/lib/maintenance-types";
import { getMaintenanceCategoryForUser } from "@/lib/maintenance-categories";
import { getVehicleForUser } from "@/lib/vehicles";

export type {
  MaintenanceLogClientRecord,
  MaintenanceLogInput,
  MaintenanceLogRecord,
  MaintenanceSummary,
} from "@/lib/maintenance-types";
export {
  computeMaintenanceSummary,
  serializeMaintenanceLogForClient,
  serializeMaintenanceLogsForClient,
} from "@/lib/maintenance-types";

const maintenanceLogInclude = {
  category: {
    select: {
      id: true,
      name: true,
    },
  },
} as const;

function buildMaintenanceLogData(input: MaintenanceLogInput) {
  return {
    date: input.date,
    categoryId: input.categoryId,
    odometer: input.odometer,
    cost: input.cost,
    notes: input.notes?.trim() || null,
  };
}

export async function listMaintenanceLogsForVehicle(
  userId: string,
  vehicleId: string,
) {
  const vehicle = await getVehicleForUser(userId, vehicleId);

  if (!vehicle) {
    return null;
  }

  return prisma.maintenanceLog.findMany({
    where: { vehicleId },
    include: maintenanceLogInclude,
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
  });
}

export async function getMaintenanceLogForUser(
  userId: string,
  maintenanceLogId: string,
) {
  return prisma.maintenanceLog.findFirst({
    where: {
      id: maintenanceLogId,
      vehicle: { userId },
    },
    include: maintenanceLogInclude,
  });
}

export async function createMaintenanceLog(
  userId: string,
  vehicleId: string,
  input: MaintenanceLogInput,
) {
  const vehicle = await getVehicleForUser(userId, vehicleId);

  if (!vehicle) {
    return null;
  }

  const category = await getMaintenanceCategoryForUser(userId, input.categoryId);

  if (!category) {
    return null;
  }

  return prisma.maintenanceLog.create({
    data: {
      vehicleId,
      ...buildMaintenanceLogData(input),
    },
    include: maintenanceLogInclude,
  });
}

export async function updateMaintenanceLog(
  userId: string,
  maintenanceLogId: string,
  input: MaintenanceLogInput,
) {
  const existing = await getMaintenanceLogForUser(userId, maintenanceLogId);

  if (!existing) {
    return null;
  }

  const category = await getMaintenanceCategoryForUser(userId, input.categoryId);

  if (!category) {
    return null;
  }

  return prisma.maintenanceLog.update({
    where: { id: maintenanceLogId },
    data: buildMaintenanceLogData(input),
    include: maintenanceLogInclude,
  });
}

export async function deleteMaintenanceLog(
  userId: string,
  maintenanceLogId: string,
) {
  const existing = await getMaintenanceLogForUser(userId, maintenanceLogId);

  if (!existing) {
    return false;
  }

  await prisma.maintenanceLog.delete({
    where: { id: maintenanceLogId },
  });

  return true;
}

export async function deleteMaintenanceLogs(
  userId: string,
  maintenanceLogIds: string[],
) {
  if (maintenanceLogIds.length === 0) {
    return 0;
  }

  const uniqueIds = [...new Set(maintenanceLogIds)];

  const result = await prisma.maintenanceLog.deleteMany({
    where: {
      id: { in: uniqueIds },
      vehicle: { userId },
    },
  });

  return result.count;
}
