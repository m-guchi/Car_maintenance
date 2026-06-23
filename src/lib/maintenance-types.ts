import type { MaintenanceLog } from "@prisma/client";

export type MaintenanceLogInput = {
  date: Date;
  categoryId: string;
  odometer: number;
  cost: number;
  notes?: string | null;
};

export type MaintenanceLogRecord = MaintenanceLog & {
  category: {
    id: string;
    name: string;
  };
};

export type MaintenanceLogClientRecord = {
  id: string;
  vehicleId: string;
  categoryId: string;
  categoryName: string;
  date: Date;
  odometer: number;
  cost: number;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export function serializeMaintenanceLogForClient(
  log: MaintenanceLogRecord,
): MaintenanceLogClientRecord {
  return {
    id: log.id,
    vehicleId: log.vehicleId,
    categoryId: log.categoryId,
    categoryName: log.category.name,
    date: log.date,
    odometer: log.odometer,
    cost: log.cost,
    notes: log.notes,
    createdAt: log.createdAt,
    updatedAt: log.updatedAt,
  };
}

export function serializeMaintenanceLogsForClient(
  logs: MaintenanceLogRecord[],
): MaintenanceLogClientRecord[] {
  return logs.map(serializeMaintenanceLogForClient);
}

export type MaintenanceSummary = {
  logCount: number;
  totalCost: number;
};

export function computeMaintenanceSummary(
  logs: Pick<MaintenanceLogClientRecord, "cost">[],
): MaintenanceSummary {
  return {
    logCount: logs.length,
    totalCost: logs.reduce((sum, log) => sum + log.cost, 0),
  };
}
