import { auth } from "@/auth";
import { formatDistanceKm } from "@/lib/fuel-display";
import { lookupGasStationsByOsmIds } from "@/lib/gas-stations-search";
import { listPickerGasStationsForUser } from "@/lib/registered-gas-stations";

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

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return Response.json({ error: "認証が必要です" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const lat = Number(searchParams.get("lat"));
  const lon = Number(searchParams.get("lon"));

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return Response.json({ error: "位置情報が不正です" }, { status: 400 });
  }

  const stations = await listPickerGasStationsForUser(session.user.id);
  const osmIds = stations
    .map((station) => station.osmId)
    .filter((osmId): osmId is string => Boolean(osmId));
  const coordinates = await lookupGasStationsByOsmIds(osmIds);

  const withDistance = stations.map((station) => {
    if (!station.osmId) {
      return {
        ...station,
        distanceMeters: null,
        distanceLabel: null,
        isNearby: false,
        displayOrder: station.displayOrder,
      };
    }

    const point = coordinates.get(station.osmId);

    if (!point) {
      return {
        ...station,
        distanceMeters: null,
        distanceLabel: null,
        isNearby: false,
        displayOrder: station.displayOrder,
      };
    }

    const distanceMeters = haversineDistanceMeters(
      lat,
      lon,
      point.lat,
      point.lon,
    );

    return {
      ...station,
      distanceMeters,
      distanceLabel: formatDistanceKm(distanceMeters),
      isNearby: distanceMeters <= 100,
      displayOrder: station.displayOrder,
    };
  });

  withDistance.sort((left, right) => {
    if (left.distanceMeters == null && right.distanceMeters == null) {
      return (left.displayOrder ?? 0) - (right.displayOrder ?? 0);
    }

    if (left.distanceMeters == null) {
      return 1;
    }

    if (right.distanceMeters == null) {
      return -1;
    }

    return left.distanceMeters - right.distanceMeters;
  });

  return Response.json({ stations: withDistance });
}
