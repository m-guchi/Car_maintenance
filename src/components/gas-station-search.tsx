"use client";

import { useState } from "react";

type GasStation = {
  id: number;
  name: string;
  brand: string | null;
  address: string | null;
  distanceLabel: string;
  lat: number;
  lon: number;
};

type GasStationSearchProps = {
  onSelectStation?: (station: {
    name: string;
    brand: string | null;
  }) => void;
};

export function GasStationSearch({ onSelectStation }: GasStationSearchProps) {
  const [stations, setStations] = useState<GasStation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  async function handleSearch() {
    if (!navigator.geolocation) {
      setError("このブラウザは位置情報に対応していません");
      return;
    }

    setLoading(true);
    setError(null);
    setSearched(false);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const params = new URLSearchParams({
            lat: String(position.coords.latitude),
            lon: String(position.coords.longitude),
          });

          const response = await fetch(`/api/gas-stations?${params.toString()}`);

          if (!response.ok) {
            const body = (await response.json().catch(() => null)) as {
              error?: string;
            } | null;
            throw new Error(body?.error ?? "検索に失敗しました");
          }

          const data = (await response.json()) as { stations: GasStation[] };
          setStations(data.stations);
          setSearched(true);
        } catch (searchError) {
          setStations([]);
          setError(
            searchError instanceof Error
              ? searchError.message
              : "検索に失敗しました",
          );
        } finally {
          setLoading(false);
        }
      },
      () => {
        setLoading(false);
        setError("位置情報の取得が拒否されました。ブラウザの設定を確認してください。");
      },
      {
        enableHighAccuracy: true,
        timeout: 15_000,
        maximumAge: 60_000,
      },
    );
  }

  return (
    <section className="app-card border-l-4 border-l-sky-500">
      <h2 className="app-section-title">周辺のガソリンスタンド</h2>
      <p className="mt-1 text-sm text-slate-500">
        現在地から約5km以内のスタンドを OpenStreetMap から検索します。
      </p>

      <button
        type="button"
        onClick={handleSearch}
        disabled={loading}
        className="app-btn-primary mt-4 bg-sky-600 shadow-sky-600/20 hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-400"
      >
        {loading ? "検索中..." : "現在地から検索"}
      </button>

      {error && <p className="app-alert-error mt-4">{error}</p>}

      {searched && stations.length === 0 && !error && (
        <p className="mt-4 text-sm text-slate-500">
          周辺にガソリンスタンドが見つかりませんでした。
        </p>
      )}

      {stations.length > 0 && (
        <ul className="mt-4 space-y-2">
          {stations.map((station) => (
            <li
              key={station.id}
              className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-600 dark:bg-slate-700/50"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-slate-900 dark:text-slate-100">
                    {station.name}
                  </p>
                  {station.brand && (
                    <p className="mt-0.5 text-xs text-slate-500">{station.brand}</p>
                  )}
                  {station.address && (
                    <p className="mt-1 text-xs text-slate-500">{station.address}</p>
                  )}
                </div>
                <span className="shrink-0 text-xs font-medium text-sky-700 dark:text-sky-300">
                  {station.distanceLabel}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {onSelectStation && (
                  <button
                    type="button"
                    onClick={() =>
                      onSelectStation({
                        name: station.name,
                        brand: station.brand,
                      })
                    }
                    className="app-btn-secondary px-2.5 py-1 text-xs"
                  >
                    フォームに反映
                  </button>
                )}
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${station.lat},${station.lon}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
                >
                  地図で開く
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
