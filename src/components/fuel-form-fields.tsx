"use client";

import { useState } from "react";

import { GAS_STATION_BRAND_OPTIONS } from "@/lib/fuel-constants";
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
};

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
  const autoTotalCost = calculateTotalCost(fuelAmount, pricePerLiter);
  const totalCost = totalCostEdited ? manualTotalCost : autoTotalCost;
  const autoOdometer = calculateOdometerFromDistance(distanceKm, previousOdometer);
  const displayOdometer = odometerManuallySet ? manualOdometer : autoOdometer;

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
              className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium transition ${
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

      <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
        <input
          type="checkbox"
          name="isFull"
          defaultChecked={fuelLog?.isFull ?? true}
          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
        />
        満タン給油（燃費計算に使用）
      </label>

      <fieldset className="space-y-4 rounded-xl border border-amber-200 bg-amber-50/60 p-4 dark:border-amber-800/50 dark:bg-amber-950/20">
        <legend className="px-1 text-sm font-medium text-amber-900 dark:text-amber-200">
          スタンド情報（任意）
        </legend>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor={`${idPrefix}-brand`} className={labelClassName}>
              ブランド
            </label>
            <select
              id={`${idPrefix}-brand`}
              name="gasStationBrands"
              defaultValue={fuelLog?.gasStationBrands ?? ""}
              className={inputClassName}
            >
              <option value="">選択しない</option>
              {GAS_STATION_BRAND_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor={`${idPrefix}-station-name`} className={labelClassName}>
              スタンド名
            </label>
            <input
              id={`${idPrefix}-station-name`}
              name="gasStationName"
              type="text"
              maxLength={100}
              defaultValue={fuelLog?.gasStationName ?? ""}
              placeholder="例: ENEOS 〇〇店"
              className={inputClassName}
            />
          </div>
        </div>
      </fieldset>
    </div>
  );
}
