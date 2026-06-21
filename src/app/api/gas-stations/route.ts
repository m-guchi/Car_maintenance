import { auth } from "@/auth";
import { formatDistanceKm } from "@/lib/fuel-display";
import { searchNearbyGasStations } from "@/lib/gas-stations-search";

export type GasStationResult = {
  id: number;
  name: string;
  brand: string | null;
  address: string | null;
  distanceMeters: number;
  lat: number;
  lon: number;
};

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

  try {
    const stations = await searchNearbyGasStations(lat, lon, safeRadius);

    if (!stations) {
      return Response.json(
        { error: "ガソリンスタンドの検索に失敗しました" },
        { status: 502 },
      );
    }

    return Response.json({
      stations: stations.map((station) => ({
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
