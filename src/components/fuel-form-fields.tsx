"use client";

import Link from "next/link";
import { useState } from "react";

import { GasStationMapPicker } from "@/components/gas-station-map-picker";
import { RegisteredGasStationPicker } from "@/components/registered-gas-station-picker";
import {
  MAX_CUSTOM_GAS_STATION_BRAND_LENGTH,
  MAX_GAS_STATION_STORE_NAME_LENGTH,
} from "@/lib/fuel-constants";
import {
  OTHER_GAS_STATION_BRAND_NAME,
  type GasStationBrandRecord,
} from "@/lib/gas-station-brand-types";
import {
  buildSelectionFromKnownStation,
  composeGasStationRegistrationName,
  extractStoreNamePart,
  getStationSelectionKey,
  resolveBrandFormState,
  type KnownGasStation,
} from "@/lib/gas-stations";
import { formatFuelEfficiency } from "@/lib/fuel-display";
import { computeFuelEfficiencyForLog } from "@/lib/fuel-stats";
import {
  calculateOdometerFromDistance,
  getInitialOdometerState,
  type FuelLogClientRecord,
} from "@/lib/fuel-types";
import { formatDateForInput } from "@/lib/vehicle-display";

const inputClassName = "app-input";
const labelClassName = "app-label";
const readOnlyInputClassName =
  "app-input cursor-default bg-slate-50 text-slate-700 dark:bg-slate-800/80 dark:text-slate-300";

type FuelFormFieldsProps = {
  fuelLog?: FuelLogClientRecord;
  idPrefix?: string;
  previousOdometer?: number | null;
  knownGasStations?: KnownGasStation[];
  pickerGasStations?: KnownGasStation[];
  gasStationBrands: GasStationBrandRecord[];
};

function getInitialSelectionKey(
  fuelLog: FuelLogClientRecord | undefined,
  knownGasStations: KnownGasStation[],
): string | null {
  if (fuelLog?.gasStationOsmId) {
    return fuelLog.gasStationOsmId;
  }

  if (!fuelLog?.gasStationName) {
    return null;
  }

  const match = knownGasStations.find(
    (station) => station.registeredName === fuelLog.gasStationName,
  );

  return match ? getStationSelectionKey(match) : null;
}

function calculateTotalCost(fuelAmount: string, pricePerLiter: string): string {
  const amount = Number.parseFloat(fuelAmount);
  const price = Number.parseInt(pricePerLiter, 10);

  if (
    Number.isNaN(amount) ||
    Number.isNaN(price) ||
    amount <= 0 ||
    price <= 0
  ) {
    return "";
  }

  return String(Math.round(amount * price));
}

function PencilIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="m2.695 14.762-1.262 3.155a.5.5 0 0 0 .65.65l3.155-1.262a4 4 0 0 0 1.343-.886L17.5 5.501a2.121 2.121 0 0 0-3-3L3.58 13.419a4 4 0 0 0-.885 1.343Z" />
    </svg>
  );
}

export function FuelFormFields({
  fuelLog,
  idPrefix = "fuel",
  previousOdometer = null,
  knownGasStations = [],
  pickerGasStations,
  gasStationBrands,
}: FuelFormFieldsProps) {
  const initialOdometerState = getInitialOdometerState(fuelLog, previousOdometer);
  const [fuelAmount, setFuelAmount] = useState(
    fuelLog ? String(fuelLog.fuelAmount) : "",
  );
  const [pricePerLiter, setPricePerLiter] = useState(
    fuelLog ? String(fuelLog.pricePerLiter) : "",
  );
  const [manualTotalCost, setManualTotalCost] = useState(
    fuelLog ? String(fuelLog.totalCost) : "",
  );
  const [totalCostEdited, setTotalCostEdited] = useState(Boolean(fuelLog));
  const [distanceKm, setDistanceKm] = useState(
    fuelLog ? String(fuelLog.distanceKm) : "",
  );
  const [manualOdometer, setManualOdometer] = useState(
    initialOdometerState.manualOdometer,
  );
  const [odometerManuallySet, setOdometerManuallySet] = useState(
    initialOdometerState.odometerManuallySet,
  );
  const [odometerEditing, setOdometerEditing] = useState(false);
  const initialBrandState = resolveBrandFormState(
    fuelLog?.gasStationBrands,
    gasStationBrands,
  );
  const [brandSelect, setBrandSelect] = useState(initialBrandState.brandSelect);
  const [customBrand, setCustomBrand] = useState(initialBrandState.customBrand);
  const [storeName, setStoreName] = useState(
    fuelLog?.gasStationName
      ? extractStoreNamePart(
          fuelLog.gasStationName,
          initialBrandState.effectiveBrand,
          gasStationBrands,
        )
      : "",
  );
  const [selectedStationId, setSelectedStationId] = useState<string | null>(
    fuelLog?.gasStationOsmId ?? null,
  );
  const [selectedStationKey, setSelectedStationKey] = useState<string | null>(
    () => getInitialSelectionKey(fuelLog, knownGasStations),
  );
  const [mapStationName, setMapStationName] = useState("");
  const [isFull, setIsFull] = useState(fuelLog?.isFull ?? true);
  const visiblePickerStations = pickerGasStations ?? knownGasStations;

  const effectiveBrand =
    brandSelect === OTHER_GAS_STATION_BRAND_NAME
      ? customBrand.trim()
      : brandSelect.trim();
  const registrationName = composeGasStationRegistrationName(
    effectiveBrand,
    storeName,
  );
  const autoTotalCost = calculateTotalCost(fuelAmount, pricePerLiter);
  const totalCost = totalCostEdited ? manualTotalCost : autoTotalCost;
  const autoOdometer = calculateOdometerFromDistance(distanceKm, previousOdometer);
  const displayOdometer = odometerManuallySet ? manualOdometer : autoOdometer;
  const fuelEfficiency = computeFuelEfficiencyForLog({
    isFull,
    distanceKm: distanceKm === "" ? 0 : Number.parseFloat(distanceKm),
    fuelAmount: fuelAmount === "" ? 0 : Number.parseFloat(fuelAmount),
  });

  function handleToggleOdometerEdit() {
    if (odometerEditing) {
      if (!odometerManuallySet || manualOdometer === autoOdometer) {
        setOdometerManuallySet(false);
        setManualOdometer(autoOdometer);
      }

      setOdometerEditing(false);
      return;
    }

    setManualOdometer(displayOdometer);
    setOdometerEditing(true);
  }

  function handleManualOdometerChange(value: string) {
    setManualOdometer(value);
    setOdometerManuallySet(true);
  }

  function handleSelectStation(station: {
    id: string;
    mapName: string;
    brandSelect: string;
    customBrand: string;
    storeName: string;
    registrationName: string;
  }) {
    setSelectedStationId(station.id || null);
    setSelectedStationKey(station.id || station.registrationName);
    setMapStationName(station.mapName);
    setBrandSelect(station.brandSelect);
    setCustomBrand(station.customBrand);
    setStoreName(station.storeName);
  }

  function handleSelectRegisteredStation(station: KnownGasStation) {
    const selection = buildSelectionFromKnownStation(station, gasStationBrands);
    setSelectedStationId(selection.id || null);
    setSelectedStationKey(getStationSelectionKey(station));
    setMapStationName("");
    setBrandSelect(selection.brandSelect);
    setCustomBrand(selection.customBrand);
    setStoreName(selection.storeName);
  }

  function handleBrandSelectChange(value: string) {
    setBrandSelect(value);

    if (value !== OTHER_GAS_STATION_BRAND_NAME) {
      setCustomBrand("");
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor={`${idPrefix}-date`} className={labelClassName}>
          給油日 <span className="text-red-500">*</span>
        </label>
        <input
          id={`${idPrefix}-date`}
          name="date"
          type="date"
          required
          defaultValue={
            fuelLog ? formatDateForInput(fuelLog.date) : formatDateForInput(new Date())
          }
          className={inputClassName}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={`${idPrefix}-distance`} className={labelClassName}>
            前回給油からの距離（km） <span className="text-red-500">*</span>
          </label>
          <input
            id={`${idPrefix}-distance`}
            name="distanceKm"
            type="number"
            inputMode="decimal"
            required
            min={0.01}
            max={3000}
            step={0.01}
            value={distanceKm}
            onChange={(event) => setDistanceKm(event.target.value)}
            placeholder="例: 430.5"
            className={inputClassName}
          />
        </div>

        <div>
          <div className="flex items-center justify-between gap-2">
            <label htmlFor={`${idPrefix}-odometer`} className={labelClassName}>
              オドメーター（km）
            </label>
            <button
              type="button"
              onClick={handleToggleOdometerEdit}
              className={`inline-flex min-h-11 items-center gap-1 rounded-lg px-3 text-xs font-medium transition active:scale-[0.97] ${
                odometerEditing
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-200"
              }`}
              aria-label={odometerEditing ? "オドメーター編集を終了" : "オドメーターを編集"}
              aria-pressed={odometerEditing}
            >
              <PencilIcon />
              {odometerEditing ? "完了" : "編集"}
            </button>
          </div>
          <input
            id={`${idPrefix}-odometer`}
            name="odometer"
            type="number"
            inputMode="numeric"
            min={1}
            max={9_999_999}
            step={1}
            value={displayOdometer}
            readOnly={!odometerEditing}
            onChange={(event) => handleManualOdometerChange(event.target.value)}
            placeholder={previousOdometer != null ? "自動計算" : "手動入力が必要"}
            className={odometerEditing ? inputClassName : readOnlyInputClassName}
          />
          <p className="mt-1 text-xs text-slate-500">
            {previousOdometer != null ? (
              <>
                前回 {previousOdometer.toLocaleString("ja-JP")} km + 距離で自動計算
                {odometerManuallySet && !odometerEditing && "（手動設定）"}
              </>
            ) : (
              "前回のオドメーターが未登録のため、編集ボタンから手動入力してください"
            )}
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor={`${idPrefix}-fuel-amount`} className={labelClassName}>
            給油量（L） <span className="text-red-500">*</span>
          </label>
          <input
            id={`${idPrefix}-fuel-amount`}
            name="fuelAmount"
            type="number"
            inputMode="decimal"
            required
            min={0.01}
            max={999.99}
            step={0.01}
            value={fuelAmount}
            onChange={(event) => setFuelAmount(event.target.value)}
            placeholder="例: 35.5"
            className={inputClassName}
          />
        </div>

        <div>
          <label htmlFor={`${idPrefix}-price`} className={labelClassName}>
            単価（円/L） <span className="text-red-500">*</span>
          </label>
          <input
            id={`${idPrefix}-price`}
            name="pricePerLiter"
            type="number"
            inputMode="numeric"
            required
            min={1}
            max={999}
            step={1}
            value={pricePerLiter}
            onChange={(event) => setPricePerLiter(event.target.value)}
            placeholder="例: 168"
            className={inputClassName}
          />
        </div>

        <div>
          <label htmlFor={`${idPrefix}-total-cost`} className={labelClassName}>
            合計金額（円） <span className="text-red-500">*</span>
          </label>
          <input
            id={`${idPrefix}-total-cost`}
            name="totalCost"
            type="number"
            inputMode="numeric"
            required
            min={1}
            max={999_999}
            step={1}
            value={totalCost}
            onChange={(event) => {
              setTotalCostEdited(true);
              setManualTotalCost(event.target.value);
            }}
            placeholder="自動計算"
            className={inputClassName}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
          <input
            type="checkbox"
            name="isFull"
            checked={isFull}
            onChange={(event) => setIsFull(event.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          満タン給油（燃費計算に使用）
        </label>

        {fuelEfficiency !== null ? (
          <p className="inline-flex items-center rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200">
            燃費 {formatFuelEfficiency(fuelEfficiency)}
            <span className="ml-2 text-xs font-normal text-emerald-700/80 dark:text-emerald-300/80">
              （距離 ÷ 給油量）
            </span>
          </p>
        ) : (
          <p className="text-xs text-slate-500">
            {isFull
              ? "距離と給油量を入力すると燃費を自動計算します"
              : "満タン給油の場合のみ燃費を計算します"}
          </p>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100">
            スタンド情報 <span className="text-red-500">*</span>
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            登録済み店舗から選ぶか、地図から店舗を選び、登録する店舗名を確認・編集してください。ブランドは
            <Link href="/settings" className="font-medium text-blue-600 hover:underline dark:text-blue-400">
              設定
            </Link>
            で管理できます。
          </p>
        </div>

        <RegisteredGasStationPicker
          knownStations={visiblePickerStations}
          selectedStationKey={selectedStationKey}
          onSelectStation={handleSelectRegisteredStation}
        />

        <GasStationMapPicker
          selectedStationId={selectedStationId}
          gasStationBrands={gasStationBrands}
          knownStations={knownGasStations}
          onSelectStation={handleSelectStation}
        />

        <input
          type="hidden"
          name="gasStationOsmId"
          value={selectedStationId ?? ""}
        />
        <input type="hidden" name="gasStationName" value={registrationName} />

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-4">
            <div>
              <label htmlFor={`${idPrefix}-brand`} className={labelClassName}>
                ブランド <span className="text-red-500">*</span>
              </label>
              <select
                id={`${idPrefix}-brand`}
                name="gasStationBrands"
                required
                value={brandSelect}
                onChange={(event) => handleBrandSelectChange(event.target.value)}
                className={inputClassName}
              >
                <option value="" disabled>
                  選択してください
                </option>
              {gasStationBrands.map((option) => (
                <option key={option.id} value={option.name}>
                  {option.name}
                </option>
              ))}
              </select>
            </div>

            {brandSelect === OTHER_GAS_STATION_BRAND_NAME && (
              <div>
                <label htmlFor={`${idPrefix}-custom-brand`} className={labelClassName}>
                  ブランド名 <span className="text-red-500">*</span>
                </label>
                <input
                  id={`${idPrefix}-custom-brand`}
                  name="gasStationBrandOther"
                  type="text"
                  required
                  maxLength={MAX_CUSTOM_GAS_STATION_BRAND_LENGTH}
                  value={customBrand}
                  onChange={(event) => setCustomBrand(event.target.value)}
                  placeholder="例: ヒューテック"
                  className={inputClassName}
                />
              </div>
            )}
          </div>

          <div>
            <label htmlFor={`${idPrefix}-store-name`} className={labelClassName}>
              店舗名 <span className="text-red-500">*</span>
            </label>
            <input
              id={`${idPrefix}-store-name`}
              name="gasStationStoreName"
              type="text"
              required
              maxLength={MAX_GAS_STATION_STORE_NAME_LENGTH}
              value={storeName}
              onChange={(event) => setStoreName(event.target.value)}
              placeholder={
                selectedStationId != null
                  ? "例: 寺町通店"
                  : "地図から選択するか直接入力"
              }
              className={inputClassName}
            />
          <p className="mt-1 text-xs text-slate-500">
            登録名: {registrationName || "（ブランドと店舗名を入力）"}
          </p>
          {mapStationName && (
              <p className="mt-1 text-xs text-slate-500">
                地図上の名称: {mapStationName}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
