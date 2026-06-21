import type { DriveType, FuelType } from "@prisma/client";

export const FUEL_TYPE_OPTIONS: { value: FuelType; label: string }[] = [
  { value: "REGULAR", label: "レギュラー" },
  { value: "PREMIUM", label: "ハイオク" },
  { value: "DIESEL", label: "軽油" },
  { value: "KEROSENE", label: "灯油" },
  { value: "ELECTRIC", label: "電気" },
  { value: "HYDROGEN", label: "水素" },
  { value: "OTHER", label: "その他" },
];

export const DRIVE_TYPE_OPTIONS: { value: DriveType; label: string }[] = [
  { value: "FF", label: "FF（前輪駆動）" },
  { value: "FR", label: "FR（後輪駆動）" },
  { value: "RR", label: "RR（後輪駆動・後置）" },
  { value: "MR", label: "MR（ミッドシップ）" },
  { value: "AWD", label: "AWD（四駆）" },
  { value: "FOUR_WD", label: "4WD" },
];

export const FUEL_TYPE_LABELS = Object.fromEntries(
  FUEL_TYPE_OPTIONS.map((option) => [option.value, option.label]),
) as Record<FuelType, string>;

export const DRIVE_TYPE_LABELS = Object.fromEntries(
  DRIVE_TYPE_OPTIONS.map((option) => [option.value, option.label]),
) as Record<DriveType, string>;

export const FUEL_TYPE_VALUES = FUEL_TYPE_OPTIONS.map((option) => option.value);
export const DRIVE_TYPE_VALUES = DRIVE_TYPE_OPTIONS.map(
  (option) => option.value,
);
