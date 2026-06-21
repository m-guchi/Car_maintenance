export const GAS_STATION_BRAND_OPTIONS = [
  { value: "ENEOS", label: "ENEOS" },
  { value: "出光", label: "出光" },
  { value: "コスモ石油", label: "コスモ石油" },
  { value: "昭和シェル", label: "昭和シェル" },
  { value: "エッソ", label: "エッソ" },
  { value: "モービル", label: "モービル" },
  { value: "キグナス石油", label: "キグナス石油" },
  { value: "JA-SS", label: "JA-SS" },
  { value: "その他", label: "その他" },
] as const;

export const GAS_STATION_BRAND_VALUES = GAS_STATION_BRAND_OPTIONS.map(
  (option) => option.value,
);

export const MAX_DISTANCE_KM = 3_000;
export const MIN_DISTANCE_KM = 0.01;
export const MAX_ODOMETER = 9_999_999;

export const MAX_FUEL_AMOUNT = 999.99;
export const MAX_PRICE_PER_LITER = 999;
export const MAX_TOTAL_COST = 999_999;
export const MAX_GAS_STATION_NAME_LENGTH = 100;
