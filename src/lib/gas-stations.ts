import {
  getBrandKeywords,
  isPresetGasStationBrandName,
  matchGasStationBrandFromList,
  OTHER_GAS_STATION_BRAND_NAME,
  type GasStationBrandRecord,
} from "@/lib/gas-station-brand-types";

export type KnownGasStation = {
  id?: string;
  osmId: string | null;
  registeredName: string;
  brand: string | null;
  displayOrder?: number;
};

export type GasStation = {
  id: number;
  name: string;
  brand: string | null;
  address: string | null;
  distanceLabel: string;
  lat: number;
  lon: number;
};

export { matchGasStationBrandFromList as matchGasStationBrand };

function getBrandNamePrefixes(
  brand: string,
  brands: GasStationBrandRecord[],
): string[] {
  const record = brands.find((item) => item.name === brand);

  if (!record) {
    return [brand];
  }

  const prefixes = new Set<string>([brand]);

  for (const keyword of getBrandKeywords(record)) {
    if (keyword !== brand.toLowerCase()) {
      prefixes.add(keyword);
    }
  }

  return Array.from(prefixes);
}

export function extractStoreNamePart(
  fullName: string,
  brand: string,
  brands: GasStationBrandRecord[] = [],
): string {
  const trimmed = fullName.trim();

  if (!trimmed || !brand) {
    return trimmed;
  }

  for (const prefix of getBrandNamePrefixes(brand, brands)) {
    if (trimmed.startsWith(`${prefix} `)) {
      return trimmed.slice(prefix.length + 1).trim();
    }

    if (trimmed === prefix) {
      return "";
    }
  }

  return trimmed;
}

export function extractStoreNameFromMapName(
  mapName: string,
  brand: string,
  brands: GasStationBrandRecord[] = [],
): string {
  const withoutBrandPrefix = extractStoreNamePart(mapName, brand, brands);

  if (withoutBrandPrefix !== mapName.trim()) {
    return withoutBrandPrefix;
  }

  return mapName.trim();
}

export function composeGasStationRegistrationName(
  brand: string,
  storeName: string,
): string {
  const trimmedBrand = brand.trim();
  const trimmedStore = storeName.trim();

  if (!trimmedBrand) {
    return trimmedStore;
  }

  if (!trimmedStore) {
    return trimmedBrand;
  }

  if (trimmedStore.startsWith(`${trimmedBrand} `)) {
    return trimmedStore;
  }

  return `${trimmedBrand} ${trimmedStore}`;
}

export function resolveBrandFormState(
  storedBrand: string | null | undefined,
  brands: GasStationBrandRecord[],
): {
  brandSelect: string;
  customBrand: string;
  effectiveBrand: string;
} {
  if (!storedBrand) {
    return { brandSelect: "", customBrand: "", effectiveBrand: "" };
  }

  if (isPresetGasStationBrandName(storedBrand, brands)) {
    return {
      brandSelect: storedBrand,
      customBrand: "",
      effectiveBrand: storedBrand,
    };
  }

  if (isListedBrand(storedBrand, brands)) {
    return {
      brandSelect: storedBrand,
      customBrand: "",
      effectiveBrand: storedBrand,
    };
  }

  return {
    brandSelect: OTHER_GAS_STATION_BRAND_NAME,
    customBrand: storedBrand,
    effectiveBrand: storedBrand,
  };
}

function isListedBrand(brand: string, brands: GasStationBrandRecord[]): boolean {
  return brands.some((item) => item.name === brand);
}

export function getStationSelectionKey(station: KnownGasStation): string {
  return station.osmId ?? station.id ?? station.registeredName;
}

export function buildSelectionFromKnownStation(
  known: KnownGasStation,
  brands: GasStationBrandRecord[],
) {
  const brandState = resolveBrandFormState(known.brand, brands);
  const effectiveBrand = brandState.effectiveBrand;

  return {
    id: known.osmId ?? "",
    mapName: known.registeredName,
    brandSelect: brandState.brandSelect,
    customBrand: brandState.customBrand,
    storeName: extractStoreNamePart(known.registeredName, effectiveBrand, brands),
    registrationName: known.registeredName,
  };
}

export function buildStationSelectionFromMap(
  mapName: string,
  matchedBrand: string,
  rawBrand: string | null,
  brands: GasStationBrandRecord[],
  registeredName?: string | null,
) {
  if (registeredName) {
    const storedBrand = rawBrand?.trim() || matchedBrand;
    const brandState = resolveBrandFormState(storedBrand, brands);
    const effectiveBrand = brandState.effectiveBrand;

    return {
      mapName,
      brandSelect: brandState.brandSelect || matchedBrand,
      customBrand: brandState.customBrand,
      storeName: extractStoreNamePart(registeredName, effectiveBrand, brands),
      registrationName: registeredName,
    };
  }

  const brandSelect = matchedBrand;
  const customBrand =
    matchedBrand === OTHER_GAS_STATION_BRAND_NAME ? (rawBrand?.trim() ?? "") : "";
  const effectiveBrand =
    brandSelect === OTHER_GAS_STATION_BRAND_NAME ? customBrand : brandSelect;
  const storeName = extractStoreNameFromMapName(mapName, effectiveBrand, brands);

  return {
    mapName,
    brandSelect,
    customBrand,
    storeName,
    registrationName: composeGasStationRegistrationName(effectiveBrand, storeName),
  };
}
