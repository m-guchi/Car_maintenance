import { auth } from "@/auth";
import { formatDistanceKm } from "@/lib/fuel-display";

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

export type GasStationResult = {
  id: number;
  name: string;
  brand: string | null;
  address: string | null;
  distanceMeters: number;
  lat: number;
  lon: number;
};

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

function getStationCoordinates(
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

function getStationName(tags: Record<string, string> | undefined): string {
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

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return Response.json({ error: "認証が必要です" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const lat = Number(searchParams.get("lat"));
  const lon = Number(searchParams.get("lon"));
  const radius = Number(searchParams.get("radius") ?? "5000");

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return Response.json({ error: "位置情報が不正です" }, { status: 400 });
  }

  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    return Response.json({ error: "位置情報が不正です" }, { status: 400 });
  }

  const safeRadius = Number.isFinite(radius)
    ? Math.min(Math.max(radius, 500), 10_000)
    : 5000;

  const query = `
    [out:json][timeout:25];
    (
      node["amenity"="fuel"](around:${safeRadius},${lat},${lon});
      way["amenity"="fuel"](around:${safeRadius},${lat},${lon});
    );
    out center 40;
  `;

  try {
    const response = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `data=${encodeURIComponent(query)}`,
      next: { revalidate: 1800 },
    });

    if (!response.ok) {
      return Response.json(
        { error: "ガソリンスタンドの検索に失敗しました" },
        { status: 502 },
      );
    }

    const data = (await response.json()) as OverpassResponse;
    const stations: GasStationResult[] = [];

    for (const element of data.elements) {
      const coordinates = getStationCoordinates(element);

      if (!coordinates) {
        continue;
      }

      const distanceMeters = haversineDistanceMeters(
        lat,
        lon,
        coordinates.lat,
        coordinates.lon,
      );

      stations.push({
        id: element.id,
        name: getStationName(element.tags),
        brand: element.tags?.brand ?? element.tags?.operator ?? null,
        address: (() => {
          const fullAddress = element.tags?.["addr:full"];
          if (fullAddress) {
            return fullAddress;
          }

          const joinedAddress = [
            element.tags?.["addr:province"],
            element.tags?.["addr:city"],
            element.tags?.["addr:street"],
          ]
            .filter(Boolean)
            .join("");

          return joinedAddress || null;
        })(),
        distanceMeters,
        lat: coordinates.lat,
        lon: coordinates.lon,
      });
    }

    stations.sort((left, right) => left.distanceMeters - right.distanceMeters);

    return Response.json({
      stations: stations.slice(0, 20).map((station) => ({
        ...station,
        distanceLabel: formatDistanceKm(station.distanceMeters),
      })),
    });
  } catch {
    return Response.json(
      { error: "ガソリンスタンドの検索に失敗しました" },
      { status: 502 },
    );
  }
}
