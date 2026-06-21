"use client";

import { getStationSelectionKey, type KnownGasStation } from "@/lib/gas-stations";

type RegisteredGasStationPickerProps = {
  knownStations: KnownGasStation[];
  selectedStationKey: string | null;
  onSelectStation: (station: KnownGasStation) => void;
};

export function RegisteredGasStationPicker({
  knownStations,
  selectedStationKey,
  onSelectStation,
}: RegisteredGasStationPickerProps) {
  if (knownStations.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
        登録済み店舗から選択
      </p>
      <ul className="flex gap-2 overflow-x-auto pb-1">
        {knownStations.map((known) => {
          const stationKey = getStationSelectionKey(known);
          const isSelected = stationKey === selectedStationKey;

          return (
            <li key={stationKey} className="shrink-0">
              <button
                type="button"
                onClick={() => onSelectStation(known)}
                className={`rounded-full border px-3 py-1.5 text-left text-sm transition ${
                  isSelected
                    ? "border-emerald-300 bg-emerald-50 font-medium text-emerald-900 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-100"
                    : "border-violet-200 bg-violet-50/60 text-slate-800 hover:border-violet-300 hover:bg-violet-50 dark:border-violet-800 dark:bg-violet-950/20 dark:text-slate-100 dark:hover:border-violet-700"
                }`}
              >
                <span className="whitespace-nowrap">{known.registeredName}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
