import { MAX_CUSTOM_GAS_STATION_BRAND_LENGTH } from "@/lib/fuel-constants";

export const OTHER_GAS_STATION_BRAND_NAME = "その他";

export type GasStationBrandRecord = {
  id: string;
  name: string;
  matchKeywords: string | null;
  displayOrder: number;
};

export const DEFAULT_GAS_STATION_BRAND_SEEDS: {
  name: string;
  matchKeywords: string;
}[] = [
  { name: "ENEOS", matchKeywords: "eneos,エネオス,ess,mobil,モービル" },
  { name: "出光", matchKeywords: "出光,idemitsu" },
  { name: "コスモ石油", matchKeywords: "コスモ石油,コスモ,cosmo" },
  { name: "昭和シェル", matchKeywords: "昭和シェル,シェル,shell" },
  { name: "エッソ", matchKeywords: "エッソ,esso" },
  { name: "モービル", matchKeywords: "モービル,mobil" },
  { name: "キグナス石油", matchKeywords: "キグナス石油,キグナス" },
  { name: "JA-SS", matchKeywords: "ja-ss,ja" },
  { name: OTHER_GAS_STATION_BRAND_NAME, matchKeywords: "" },
];

export function getBrandKeywords(brand: GasStationBrandRecord): string[] {
  const keywords = new Set<string>();

  keywords.add(brand.name.toLowerCase());

  if (brand.matchKeywords) {
    for (const keyword of brand.matchKeywords.split(/[,、]/)) {
      const trimmed = keyword.trim();

      if (trimmed) {
        keywords.add(trimmed.toLowerCase());
      }
    }
  }

  return Array.from(keywords);
}

function matchGasStationBrandText(
  text: string,
  brands: GasStationBrandRecord[],
): string | null {
  const normalized = text.toLowerCase();

  for (const brand of brands) {
    if (brand.name === OTHER_GAS_STATION_BRAND_NAME) {
      continue;
    }

    const keywords = getBrandKeywords(brand);

    if (
      keywords.some(
        (keyword) =>
          normalized.includes(keyword) ||
          text.includes(brand.name) ||
          brand.name.includes(text),
      )
    ) {
      return brand.name;
    }
  }

  return null;
}

export function matchGasStationBrandFromList(
  rawBrand: string | null,
  brands: GasStationBrandRecord[],
  fallbackTexts: string[] = [],
): string {
  const texts = [rawBrand, ...fallbackTexts].filter(
    (text): text is string => Boolean(text?.trim()),
  );

  for (const text of texts) {
    const matched = matchGasStationBrandText(text.trim(), brands);

    if (matched) {
      return matched;
    }
  }

  return (
    brands.find((brand) => brand.name === OTHER_GAS_STATION_BRAND_NAME)?.name ??
    OTHER_GAS_STATION_BRAND_NAME
  );
}

export function isListedGasStationBrand(
  brand: string,
  brands: GasStationBrandRecord[],
): boolean {
  return brands.some((item) => item.name === brand);
}

export function isPresetGasStationBrandName(
  brand: string,
  brands: GasStationBrandRecord[],
): boolean {
  return brand !== OTHER_GAS_STATION_BRAND_NAME && isListedGasStationBrand(brand, brands);
}

export function validateGasStationBrandName(name: string): string | null {
  const trimmed = name.trim();

  if (!trimmed) {
    return "ブランド名を入力してください";
  }

  if (trimmed.length > MAX_CUSTOM_GAS_STATION_BRAND_LENGTH) {
    return `ブランド名は${MAX_CUSTOM_GAS_STATION_BRAND_LENGTH}文字以内で入力してください`;
  }

  return null;
}
