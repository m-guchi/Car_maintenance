import { MAX_MAINTENANCE_CATEGORY_NAME_LENGTH } from "@/lib/maintenance-constants";

export type MaintenanceCategoryRecord = {
  id: string;
  name: string;
  displayOrder: number;
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
