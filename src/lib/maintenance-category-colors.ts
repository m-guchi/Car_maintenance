import type { MaintenanceCategoryRecord } from "@/lib/maintenance-category-types";

/** 面グラフ（スレート）と被らないメンテナンスカテゴリ用パレット */
export const MAINTENANCE_CATEGORY_COLORS = [
  "#059669",
  "#d97706",
  "#dc2626",
  "#2563eb",
  "#db2777",
  "#0891b2",
  "#65a30d",
  "#ea580c",
] as const;

export type MaintenanceCategoryColorStyle = {
  color: string;
  badgeBackground: string;
  badgeText: string;
  filterSelectedBackground: string;
  filterSelectedText: string;
  filterIdleBackground: string;
  filterIdleText: string;
  filterDimmedBackground: string;
  filterDimmedText: string;
};

export function buildMaintenanceCategoryColorIndexById(
  categories: Pick<MaintenanceCategoryRecord, "id">[],
): Map<string, number> {
  return new Map(categories.map((category, index) => [category.id, index]));
}

export function getMaintenanceCategoryColor(colorIndex: number): string {
  return MAINTENANCE_CATEGORY_COLORS[
    colorIndex % MAINTENANCE_CATEGORY_COLORS.length
  ];
}

export function getMaintenanceCategoryColorById(
  categoryId: string,
  colorIndexById: Map<string, number>,
): string {
  return getMaintenanceCategoryColor(colorIndexById.get(categoryId) ?? 0);
}

export function hexWithAlpha(hex: string, alpha: number): string {
  const normalized = hex.replace("#", "");

  if (normalized.length !== 6) {
    return hex;
  }

  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

export function getMaintenanceCategoryColorStyle(
  colorIndex: number,
): MaintenanceCategoryColorStyle {
  const color = getMaintenanceCategoryColor(colorIndex);

  return {
    color,
    badgeBackground: hexWithAlpha(color, 0.15),
    badgeText: color,
    filterSelectedBackground: color,
    filterSelectedText: "#ffffff",
    filterIdleBackground: hexWithAlpha(color, 0.12),
    filterIdleText: color,
    filterDimmedBackground: hexWithAlpha(color, 0.06),
    filterDimmedText: hexWithAlpha(color, 0.45),
  };
}

export function getMaintenanceCategoryColorStyleById(
  categoryId: string,
  colorIndexById: Map<string, number>,
): MaintenanceCategoryColorStyle {
  return getMaintenanceCategoryColorStyle(
    colorIndexById.get(categoryId) ?? 0,
  );
}
