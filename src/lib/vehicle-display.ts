import type { DriveType, FuelType } from "@prisma/client";

import { DRIVE_TYPE_LABELS, FUEL_TYPE_LABELS } from "@/lib/vehicle-constants";

export function formatFuelType(fuelType: FuelType | null | undefined): string | null {
  if (!fuelType) {
    return null;
  }

  return FUEL_TYPE_LABELS[fuelType];
}

export function formatDriveType(
  driveType: DriveType | null | undefined,
): string | null {
  if (!driveType) {
    return null;
  }

  return DRIVE_TYPE_LABELS[driveType];
}

export function formatDateJa(date: Date): string {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Tokyo",
  }).format(date);
}

export function formatYearMonthJa(date: Date): string {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    timeZone: "Asia/Tokyo",
  }).format(date);
}

export function formatOdometer(km: number): string {
  return `${km.toLocaleString("ja-JP")} km`;
}

export function formatDisplacement(cc: number): string {
  return `${cc.toLocaleString("ja-JP")} cc`;
}

export function formatDateForInput(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Tokyo",
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  return `${year}-${month}-${day}`;
}

export function formatMonthForInput(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    timeZone: "Asia/Tokyo",
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;

  return `${year}-${month}`;
}

export function getVehicleSubtitle(vehicle: {
  modelName: string | null;
  manufacturer: string | null;
  modelCode: string | null;
}): string | null {
  const parts = [
    vehicle.manufacturer,
    vehicle.modelName,
    vehicle.modelCode ? `型式 ${vehicle.modelCode}` : null,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" / ") : null;
}
