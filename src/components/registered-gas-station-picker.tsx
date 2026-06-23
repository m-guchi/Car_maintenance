"use client";

import { useEffect, useState } from "react";

import { getGeolocationBlockedMessage } from "@/lib/geolocation";
import { getStationSelectionKey, type KnownGasStation } from "@/lib/gas-stations";

export type RegisteredGasStationWithDistance = KnownGasStation & {
  distanceMeters: number | null;
  distanceLabel: string | null;
  isNearby: boolean;
};

type RegisteredGasStationPickerProps = {
  knownStations: KnownGasStation[];
  selectedStationKey: string | null;
  onSelectStation: (station: KnownGasStation) => void;
};

type SortMode = "loading" | "distance" | "displayOrder";

const INITIAL_VISIBLE_COUNT = 3;

function toStationWithoutDistance(
  station: KnownGasStation,
): RegisteredGasStationWithDistance {
  return {
    ...station,
    distanceMeters: null,
    distanceLabel: null,
    isNearby: false,
  };
}

function sortByDisplayOrder(
  stations: KnownGasStation[],
): RegisteredGasStationWithDistance[] {
  return [...stations]
    .sort(
      (left, right) =>
        (left.displayOrder ?? Number.MAX_SAFE_INTEGER) -
        (right.displayOrder ?? Number.MAX_SAFE_INTEGER),
    )
    .map(toStationWithoutDistance);
}

async function fetchNearbyRegisteredStations(
  lat: number,
  lon: number,
): Promise<RegisteredGasStationWithDistance[]> {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
  });
  const response = await fetch(
    `/api/registered-gas-stations/nearby?${params.toString()}`,
  );

  if (!response.ok) {
    throw new Error("登録済み店舗の取得に失敗しました");
  }

  const data = (await response.json()) as {
    stations: RegisteredGasStationWithDistance[];
  };

  return data.stations;
}

export function RegisteredGasStationPicker({
  knownStations,
  selectedStationKey,
  onSelectStation,
}: RegisteredGasStationPickerProps) {
  const [stations, setStations] = useState<RegisteredGasStationWithDistance[]>(
    () => sortByDisplayOrder(knownStations),
  );
  const [sortMode, setSortMode] = useState<SortMode>(
    knownStations.length > 0 ? "loading" : "displayOrder",
  );
  const [showAll, setShowAll] = useState(false);

  const stationSignature = knownStations
    .map((station) => getStationSelectionKey(station))
    .join("|");

  useEffect(() => {
    if (knownStations.length === 0) {
      return;
    }

    let cancelled = false;

    const finishDisplayOrder = () => {
      if (cancelled) {
        return;
      }

      setSortMode("displayOrder");
      setStations(sortByDisplayOrder(knownStations));
    };

    const loadByLocation = (lat: number, lon: number) => {
      void fetchNearbyRegisteredStations(lat, lon)
        .then((sortedStations) => {
          if (cancelled) {
            return;
          }

          setSortMode("distance");
          setStations(sortedStations);
        })
        .catch(finishDisplayOrder);
    };

    const timer = window.setTimeout(() => {
      if (cancelled) {
        return;
      }

      setShowAll(false);
      setSortMode("loading");

      const blockedMessage = getGeolocationBlockedMessage();

      if (blockedMessage) {
        finishDisplayOrder();
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          loadByLocation(position.coords.latitude, position.coords.longitude);
        },
        finishDisplayOrder,
        {
          enableHighAccuracy: false,
          timeout: 8_000,
          maximumAge: 300_000,
        },
      );
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [knownStations, stationSignature]);

  if (knownStations.length === 0) {
    return null;
  }

  const sortLabel =
    sortMode === "loading"
      ? "（距離を計算中…）"
      : sortMode === "distance"
        ? "（現在地から近い順）"
        : "（設定の順）";

  const selectedIndex =
    selectedStationKey == null
      ? -1
      : stations.findIndex(
          (station) => getStationSelectionKey(station) === selectedStationKey,
        );
  const isExpanded =
    showAll || (selectedIndex >= INITIAL_VISIBLE_COUNT && selectedIndex !== -1);
  const visibleStations = isExpanded
    ? stations
    : stations.slice(0, INITIAL_VISIBLE_COUNT);
  const hiddenCount = stations.length - INITIAL_VISIBLE_COUNT;

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
        登録済み店舗{sortLabel}
      </p>

      <ul className="space-y-2">
        {visibleStations.map((known) => {
          const stationKey = getStationSelectionKey(known);
          const isSelected = stationKey === selectedStationKey;

          return (
            <li key={stationKey}>
              <button
                type="button"
                onClick={() => onSelectStation(known)}
                className={`w-full rounded-xl border p-3 text-left transition ${
                  isSelected
                    ? "border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/30"
                    : known.isNearby
                      ? "border-amber-300 bg-amber-50 ring-2 ring-amber-200/80 dark:border-amber-600 dark:bg-amber-950/30 dark:ring-amber-700/50"
                      : "border-violet-200 bg-violet-50/60 hover:border-violet-300 dark:border-violet-800 dark:bg-violet-950/20 dark:hover:border-violet-700"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-center gap-2">
                      {known.isNearby && (
                        <span className="inline-flex shrink-0 items-center rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-semibold text-amber-900 dark:bg-amber-800 dark:text-amber-100">
                          至近
                        </span>
                      )}
                      <p
                        className="min-w-0 flex-1 truncate font-medium text-slate-900 dark:text-slate-100"
                        title={known.registeredName}
                      >
                        {known.registeredName}
                      </p>
                    </div>
                    {known.brand && (
                      <p className="mt-1 text-xs text-slate-500">{known.brand}</p>
                    )}
                  </div>
                  {known.distanceLabel && (
                    <span
                      className={`shrink-0 text-xs font-medium ${
                        known.isNearby
                          ? "text-amber-800 dark:text-amber-200"
                          : "text-slate-500 dark:text-slate-400"
                      }`}
                    >
                      {known.distanceLabel}
                    </span>
                  )}
                </div>
              </button>
            </li>
          );
        })}
      </ul>

      {!isExpanded && hiddenCount > 0 && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="w-full rounded-xl border border-dashed border-slate-300 py-2.5 text-sm font-medium text-slate-600 transition hover:border-slate-400 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:border-slate-500 dark:hover:bg-slate-800/50"
        >
          もっと表示する（あと{hiddenCount}件）
        </button>
      )}
    </div>
  );
}
