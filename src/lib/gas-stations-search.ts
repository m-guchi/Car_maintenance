type OverpassElement = {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

type OverpassResponse = {
  elements: OverpassElement[];
};

type NominatimResult = {
  place_id: number;
  osm_type: string;
  osm_id: number;
  lat: string;
  lon: string;
  name?: string;
  display_name: string;
  extratags?: Record<string, string>;
  address?: Record<string, string>;
};

export type GasStationSearchResult = {
  id: number;
  name: string;
  brand: string | null;
  address: string | null;
  distanceMeters: number;
  lat: number;
  lon: number;
};

const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
] as const;

const OVERPASS_USER_AGENT = "CarMaintenanceApp/1.0 (car-maintenance)";

function haversineDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const earthRadius = 6_371_000;
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const deltaLat = toRadians(lat2 - lat1);
  const deltaLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(deltaLon / 2) ** 2;

  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getBoundingViewbox(lat: number, lon: number, radiusMeters: number): string {
  const latDelta = radiusMeters / 111_320;
  const lonDelta = radiusMeters / (111_320 * Math.cos((lat * Math.PI) / 180));

  const minLon = lon - lonDelta;
  const maxLon = lon + lonDelta;
  const minLat = lat - latDelta;
  const maxLat = lat + latDelta;

  return `${minLon},${maxLat},${maxLon},${minLat}`;
}

function getStationNameFromTags(tags: Record<string, string> | undefined): string {
  if (!tags) {
    return "名称不明のスタンド";
  }

  return (
    tags.name ??
    tags["name:ja"] ??
    tags.brand ??
    tags.operator ??
    "名称不明のスタンド"
  );
}

function getOverpassCoordinates(
  element: OverpassElement,
): { lat: number; lon: number } | null {
  if (typeof element.lat === "number" && typeof element.lon === "number") {
    return { lat: element.lat, lon: element.lon };
  }

  if (element.center) {
    return element.center;
  }

  return null;
}

function getAddressFromTags(tags: Record<string, string> | undefined): string | null {
  if (!tags) {
    return null;
  }

  const fullAddress = tags["addr:full"];
  if (fullAddress) {
    return fullAddress;
  }

  const joinedAddress = [
    tags["addr:province"],
    tags["addr:city"],
    tags["addr:street"],
  ]
    .filter(Boolean)
    .join("");

  return joinedAddress || null;
}

function getAddressFromNominatim(result: NominatimResult): string | null {
  if (!result.address) {
    return null;
  }

  const joinedAddress = [
    result.address.state,
    result.address.city ?? result.address.town ?? result.address.village,
    result.address.road,
    result.address.house_number,
  ]
    .filter(Boolean)
    .join("");

  return joinedAddress || null;
}

function getNominatimStationName(result: NominatimResult): string {
  const parts = result.display_name
    .split(",")
    .map((segment) => segment.trim())
    .filter(Boolean);

  while (parts.length > 1) {
    const lastPart = parts[parts.length - 1];

    if (lastPart === "日本" || lastPart === "Japan" || /^\d{3}-?\d{4}$/.test(lastPart)) {
      parts.pop();
      continue;
    }

    break;
  }

  if (parts.length >= 2) {
    return parts.slice(0, Math.min(parts.length - 1, 3)).join(" ");
  }

  return result.name ?? parts[0] ?? "名称不明のスタンド";
}

function buildStationDisplayName(
  name: string,
  brand: string | null,
  address: string | null,
): string {
  if (!address || name.includes(address)) {
    return name;
  }

  const isGenericName =
    name === "名称不明のスタンド" ||
    (brand != null && (name === brand || name.includes(brand)));

  if (isGenericName || name.length <= 8) {
    return `${name}（${address}）`;
  }

  return name;
}

function deduplicateStationsByLocation(
  stations: GasStationSearchResult[],
): GasStationSearchResult[] {
  const seenLocations = new Set<string>();
  const deduped: GasStationSearchResult[] = [];

  for (const station of stations) {
    const locationKey = `${station.lat.toFixed(5)},${station.lon.toFixed(5)}`;

    if (seenLocations.has(locationKey)) {
      continue;
    }

    seenLocations.add(locationKey);
    deduped.push(station);
  }

  return deduped;
}

function sortAndLimitStations(
  stations: GasStationSearchResult[],
  limit: number,
): GasStationSearchResult[] {
  const sorted = [...stations].sort(
    (left, right) => left.distanceMeters - right.distanceMeters,
  );

  return deduplicateStationsByLocation(sorted).slice(0, limit);
}

async function fetchOverpassData(query: string): Promise<OverpassResponse | null> {
  const body = `data=${encodeURIComponent(query.trim())}`;

  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
          "User-Agent": OVERPASS_USER_AGENT,
        },
        body,
        cache: "no-store",
        signal: AbortSignal.timeout(12_000),
      });

      if (!response.ok) {
        continue;
      }

      return (await response.json()) as OverpassResponse;
    } catch {
      continue;
    }
  }

  return null;
}

function mapOverpassElements(
  elements: OverpassElement[],
  originLat: number,
  originLon: number,
): GasStationSearchResult[] {
  const stations: GasStationSearchResult[] = [];

  for (const element of elements) {
    const coordinates = getOverpassCoordinates(element);

    if (!coordinates) {
      continue;
    }

    stations.push({
      id: element.id,
      name: buildStationDisplayName(
        getStationNameFromTags(element.tags),
        element.tags?.brand ?? element.tags?.operator ?? null,
        getAddressFromTags(element.tags),
      ),
      brand: element.tags?.brand ?? element.tags?.operator ?? null,
      address: getAddressFromTags(element.tags),
      distanceMeters: haversineDistanceMeters(
        originLat,
        originLon,
        coordinates.lat,
        coordinates.lon,
      ),
      lat: coordinates.lat,
      lon: coordinates.lon,
    });
  }

  return stations;
}

function buildOverpassFuelQuery(lat: number, lon: number, radius: number): string {
  const around = `(around:${radius},${lat},${lon})`;
  const fuelTags = [
    `node["amenity"="fuel"]${around}`,
    `way["amenity"="fuel"]${around}`,
    `relation["amenity"="fuel"]${around}`,
    `node["shop"="fuel"]${around}`,
    `way["shop"="fuel"]${around}`,
  ];

  return `[out:json][timeout:25];(${fuelTags.join(";")};);out center;`;
}

async function searchWithOverpass(
  lat: number,
  lon: number,
  radius: number,
): Promise<GasStationSearchResult[] | null> {
  const data = await fetchOverpassData(buildOverpassFuelQuery(lat, lon, radius));

  if (!data) {
    return null;
  }

  return mapOverpassElements(data.elements, lat, lon);
}

async function searchWithNominatim(
  lat: number,
  lon: number,
  radius: number,
): Promise<GasStationSearchResult[] | null> {
  const viewbox = getBoundingViewbox(lat, lon, radius);
  const params = new URLSearchParams({
    format: "json",
    amenity: "fuel",
    limit: "50",
    viewbox,
    bounded: "1",
  });

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?${params.toString()}`,
      {
        headers: {
          Accept: "application/json",
          "User-Agent": OVERPASS_USER_AGENT,
          "Accept-Language": "ja",
        },
        cache: "no-store",
        signal: AbortSignal.timeout(15_000),
      },
    );

    if (!response.ok) {
      return null;
    }

    const results = (await response.json()) as NominatimResult[];
    const seenIds = new Set<number>();
    const stations: GasStationSearchResult[] = [];

    for (const result of results) {
      if (seenIds.has(result.osm_id)) {
        continue;
      }

      seenIds.add(result.osm_id);

      const stationLat = Number.parseFloat(result.lat);
      const stationLon = Number.parseFloat(result.lon);

      if (!Number.isFinite(stationLat) || !Number.isFinite(stationLon)) {
        continue;
      }

      const distanceMeters = haversineDistanceMeters(
          lat,
          lon,
          stationLat,
          stationLon,
        );

      if (distanceMeters > radius) {
        continue;
      }

      stations.push({
        id: result.osm_id,
        name: buildStationDisplayName(
          getNominatimStationName(result),
          result.extratags?.brand ?? result.extratags?.operator ?? null,
          getAddressFromNominatim(result),
        ),
        brand:
          result.extratags?.brand ??
          result.extratags?.operator ??
          null,
        address: getAddressFromNominatim(result),
        distanceMeters,
        lat: stationLat,
        lon: stationLon,
      });
    }

    return stations;
  } catch {
    return null;
  }
}

export async function searchNearbyGasStations(
  lat: number,
  lon: number,
  radius: number,
  limit = 20,
): Promise<GasStationSearchResult[] | null> {
  const overpassStations = await searchWithOverpass(lat, lon, radius);

  if (overpassStations !== null && overpassStations.length > 0) {
    return sortAndLimitStations(overpassStations, limit);
  }

  const nominatimStations = await searchWithNominatim(lat, lon, radius);

  if (!nominatimStations) {
    return overpassStations;
  }

  return sortAndLimitStations(nominatimStations, limit);
}
