import {
  MAX_MAINTENANCE_CATEGORY_NAME_LENGTH,
  MAX_MAINTENANCE_INTERVAL_DAYS,
  MAX_MAINTENANCE_INTERVAL_KM,
  MIN_MAINTENANCE_INTERVAL_DAYS,
  MIN_MAINTENANCE_INTERVAL_KM,
} from "@/lib/maintenance-constants";

export type MaintenanceCategoryRecord = {
  id: string;
  name: string;
  displayOrder: number;
  intervalKm: number | null;
  intervalDays: number | null;
};

export type MaintenanceCategoryInput = {
  name: string;
  intervalKm?: number | null;
  intervalDays?: number | null;
};

export const DEFAULT_MAINTENANCE_CATEGORY_SEEDS = [
  "洗車",
  "オイル交換",
  "タイヤ交換",
  "車検",
] as const;

export function validateMaintenanceCategoryName(name: string): string | null {
  const trimmed = name.trim();

  if (!trimmed) {
    return "カテゴリ名を入力してください";
  }

  if (trimmed.length > MAX_MAINTENANCE_CATEGORY_NAME_LENGTH) {
    return `カテゴリ名は${MAX_MAINTENANCE_CATEGORY_NAME_LENGTH}文字以内で入力してください`;
  }

  return null;
}

export function validateMaintenanceIntervalKm(
  value: number | null | undefined,
): string | null {
  if (value == null) {
    return null;
  }

  if (
    !Number.isInteger(value) ||
    value < MIN_MAINTENANCE_INTERVAL_KM ||
    value > MAX_MAINTENANCE_INTERVAL_KM
  ) {
    return `交換・整備間隔（距離）は${MIN_MAINTENANCE_INTERVAL_KM.toLocaleString("ja-JP")}〜${MAX_MAINTENANCE_INTERVAL_KM.toLocaleString("ja-JP")} kmの整数で入力してください`;
  }

  return null;
}

export function validateMaintenanceIntervalDays(
  value: number | null | undefined,
): string | null {
  if (value == null) {
    return null;
  }

  if (
    !Number.isInteger(value) ||
    value < MIN_MAINTENANCE_INTERVAL_DAYS ||
    value > MAX_MAINTENANCE_INTERVAL_DAYS
  ) {
    return `交換・整備間隔（日数）は${MIN_MAINTENANCE_INTERVAL_DAYS}〜${MAX_MAINTENANCE_INTERVAL_DAYS}日の整数で入力してください`;
  }

  return null;
}

export function validateMaintenanceCategoryInput(
  input: MaintenanceCategoryInput,
): string | null {
  const nameError = validateMaintenanceCategoryName(input.name);
  if (nameError) {
    return nameError;
  }

  const kmError = validateMaintenanceIntervalKm(input.intervalKm);
  if (kmError) {
    return kmError;
  }

  return validateMaintenanceIntervalDays(input.intervalDays);
}
