import type { VehicleRecord } from "@/lib/vehicles";
import {
  formatDateForInput,
  formatMonthForInput,
} from "@/lib/vehicle-display";
import {
  DRIVE_TYPE_OPTIONS,
  FUEL_TYPE_OPTIONS,
} from "@/lib/vehicle-constants";

const inputClassName = "app-input";

const labelClassName = "app-label";

type VehicleFormFieldsProps = {
  vehicle?: VehicleRecord;
  idPrefix?: string;
};

export function VehicleFormFields({
  vehicle,
  idPrefix = "vehicle",
}: VehicleFormFieldsProps) {
  return (
    <div className="space-y-4">
      <div>
        <label htmlFor={`${idPrefix}-name`} className={labelClassName}>
          車両名（ニックネーム） <span className="text-red-500">*</span>
        </label>
        <input
          id={`${idPrefix}-name`}
          name="name"
          type="text"
          required
          maxLength={100}
          defaultValue={vehicle?.name}
          placeholder="例: ファミリーカー"
          className={inputClassName}
        />
      </div>

      <fieldset className="space-y-4 rounded-xl border border-blue-200 bg-blue-50/60 p-4 dark:border-blue-800 dark:bg-blue-950/30">
        <legend className="px-1 text-sm font-medium text-blue-900 dark:text-blue-300">
          推奨項目
        </legend>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor={`${idPrefix}-model-name`} className={labelClassName}>
              車種名
            </label>
            <input
              id={`${idPrefix}-model-name`}
              name="modelName"
              type="text"
              maxLength={100}
              defaultValue={vehicle?.modelName ?? ""}
              placeholder="例: プリウス S"
              className={inputClassName}
            />
          </div>

          <div>
            <label htmlFor={`${idPrefix}-model-code`} className={labelClassName}>
              型式
            </label>
            <input
              id={`${idPrefix}-model-code`}
              name="modelCode"
              type="text"
              maxLength={50}
              defaultValue={vehicle?.modelCode ?? ""}
              placeholder="例: ZVW30"
              className={inputClassName}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor={`${idPrefix}-manufacturer`} className={labelClassName}>
              メーカー
            </label>
            <input
              id={`${idPrefix}-manufacturer`}
              name="manufacturer"
              type="text"
              maxLength={100}
              defaultValue={vehicle?.manufacturer ?? ""}
              placeholder="例: トヨタ"
              className={inputClassName}
            />
          </div>

          <div>
            <label htmlFor={`${idPrefix}-fuel-type`} className={labelClassName}>
              燃料種別
            </label>
            <select
              id={`${idPrefix}-fuel-type`}
              name="fuelType"
              defaultValue={vehicle?.fuelType ?? ""}
              className={inputClassName}
            >
              <option value="">選択してください</option>
              {FUEL_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label
            htmlFor={`${idPrefix}-inspection-expiry`}
            className={labelClassName}
          >
            車検満了日
          </label>
          <input
            id={`${idPrefix}-inspection-expiry`}
            name="inspectionExpiry"
            type="date"
            defaultValue={
              vehicle?.inspectionExpiry
                ? formatDateForInput(vehicle.inspectionExpiry)
                : undefined
            }
            className={inputClassName}
          />
        </div>
      </fieldset>

      <details className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-600 dark:bg-slate-700/40">
        <summary className="cursor-pointer text-sm font-medium text-slate-700 dark:text-slate-300">
          任意項目を入力する
        </summary>

        <div className="mt-4 space-y-4">
          <div>
            <label
              htmlFor={`${idPrefix}-license-plate`}
              className={labelClassName}
            >
              ナンバープレート
            </label>
            <input
              id={`${idPrefix}-license-plate`}
              name="licensePlate"
              type="text"
              maxLength={20}
              defaultValue={vehicle?.licensePlate ?? ""}
              placeholder="例: 品川 500 あ 12-34"
              className={inputClassName}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor={`${idPrefix}-first-registration`}
                className={labelClassName}
              >
                初度登録年月
              </label>
              <input
                id={`${idPrefix}-first-registration`}
                name="firstRegistrationDate"
                type="month"
                defaultValue={
                  vehicle?.firstRegistrationDate
                    ? formatMonthForInput(vehicle.firstRegistrationDate)
                    : undefined
                }
                className={inputClassName}
              />
            </div>

            <div>
              <label
                htmlFor={`${idPrefix}-initial-odometer`}
                className={labelClassName}
              >
                登録時走行距離（km）
              </label>
              <input
                id={`${idPrefix}-initial-odometer`}
                name="initialOdometer"
                type="number"
                inputMode="numeric"
                min={0}
                max={9999999}
                step={1}
                defaultValue={vehicle?.initialOdometer ?? undefined}
                placeholder="例: 45000"
                className={inputClassName}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor={`${idPrefix}-displacement`}
                className={labelClassName}
              >
                排気量（cc）
              </label>
              <input
                id={`${idPrefix}-displacement`}
                name="displacement"
                type="number"
                inputMode="numeric"
                min={1}
                max={99999}
                step={1}
                defaultValue={vehicle?.displacement ?? undefined}
                placeholder="例: 1500"
                className={inputClassName}
              />
            </div>

            <div>
              <label htmlFor={`${idPrefix}-drive-type`} className={labelClassName}>
                駆動方式
              </label>
              <select
                id={`${idPrefix}-drive-type`}
                name="driveType"
                defaultValue={vehicle?.driveType ?? ""}
                className={inputClassName}
              >
                <option value="">選択してください</option>
                {DRIVE_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </details>

      <label className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50/50 px-3 py-3 dark:border-emerald-800 dark:bg-emerald-950/30">
        <input
          name="isActive"
          type="checkbox"
          defaultChecked={vehicle?.isActive ?? true}
          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-500 dark:bg-slate-700"
        />
        <span className="text-sm text-slate-700 dark:text-slate-300">
          <span className="font-medium">使用中の車両として設定</span>
          <span className="mt-0.5 block app-text-subtle">
            他の車両は自動的に「使用停止」になります
          </span>
        </span>
      </label>
    </div>
  );
}
