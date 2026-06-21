"use client";

import { useRouter } from "next/navigation";
import { useActionState, useState } from "react";

import {
  deleteRegisteredGasStationAction,
  setRegisteredGasStationHiddenAction,
  updateRegisteredGasStationAction,
  type SettingsActionState,
} from "@/app/(app)/settings/actions";
import { DeleteConfirmPanel } from "@/components/delete-confirm-panel";
import {
  OTHER_GAS_STATION_BRAND_NAME,
  type GasStationBrandRecord,
} from "@/lib/gas-station-brand-types";
import {
  getRegisteredStationEditDefaults,
  type RegisteredGasStationRecord,
} from "@/lib/registered-gas-station-types";

const initialState: SettingsActionState = { ok: false };

type RegisteredGasStationSettingsProps = {
  stations: RegisteredGasStationRecord[];
  gasStationBrands: GasStationBrandRecord[];
};

export function RegisteredGasStationSettings({
  stations,
  gasStationBrands,
}: RegisteredGasStationSettingsProps) {
  return (
    <section className="app-card space-y-6">
      <div>
        <h2 className="app-section-title">登録店舗</h2>
        <p className="mt-1 text-sm text-slate-500">
          給油記録で登録した店舗の名称を編集・削除できます。「登録画面に表示しない」をオンにすると、給油記録フォームのクイック選択から非表示になります。
        </p>
      </div>

      {stations.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-600">
          登録済みの店舗はまだありません。給油記録を登録するとここに表示されます。
        </p>
      ) : (
        <ul className="space-y-3">
          {stations.map((station) => (
            <StationRow
              key={station.id}
              station={station}
              gasStationBrands={gasStationBrands}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function StationRow({
  station,
  gasStationBrands,
}: {
  station: RegisteredGasStationRecord;
  gasStationBrands: GasStationBrandRecord[];
}) {
  const router = useRouter();
  const defaults = getRegisteredStationEditDefaults(station, gasStationBrands);
  const [editing, setEditing] = useState(false);
  const boundUpdate = updateRegisteredGasStationAction.bind(null, station.id);
  const [updateState, updateAction, updatePending] = useActionState(
    async (prev, formData) => {
      const result = await boundUpdate(prev, formData);
      if (result.ok) {
        setEditing(false);
        router.refresh();
      }
      return result;
    },
    initialState,
  );
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [hiddenPending, setHiddenPending] = useState(false);
  const [hiddenError, setHiddenError] = useState<string | null>(null);
  const [hiddenFromPicker, setHiddenFromPicker] = useState(station.hiddenFromPicker);
  const [brandSelect, setBrandSelect] = useState(defaults.brandSelect);

  async function handleHiddenChange(nextHidden: boolean) {
    setHiddenPending(true);
    setHiddenError(null);

    const result = await setRegisteredGasStationHiddenAction(station.id, nextHidden);

    if (!result.ok) {
      setHiddenError(result.error ?? "表示設定の更新に失敗しました");
      setHiddenPending(false);
      return;
    }

    setHiddenFromPicker(nextHidden);
    setHiddenPending(false);
    router.refresh();
  }

  function handleDeleteClick() {
    setDeleteError(null);
    setConfirmingDelete(true);
  }

  function handleDeleteCancel() {
    if (deleting) {
      return;
    }

    setConfirmingDelete(false);
    setDeleteError(null);
  }

  async function handleDeleteConfirm() {
    setDeleting(true);
    setDeleteError(null);

    const result = await deleteRegisteredGasStationAction(station.id);

    if (!result.ok) {
      setDeleteError(result.error ?? "削除に失敗しました");
      setDeleting(false);
      return;
    }

    router.refresh();
  }

  if (!editing) {
    return (
      <li className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium text-slate-900 dark:text-slate-100">
                {station.registeredName}
              </p>
              {hiddenFromPicker && (
                <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  登録画面で非表示
                </span>
              )}
            </div>
            {station.brand && (
              <p className="mt-1 text-xs text-slate-500">ブランド: {station.brand}</p>
            )}
            {station.osmId && (
              <p className="mt-1 text-xs text-slate-500">地図 ID: {station.osmId}</p>
            )}
          </div>

          <div className="flex shrink-0 flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="app-btn-secondary px-3 py-1.5 text-sm"
            >
              編集
            </button>
            {!confirmingDelete && (
              <button
                type="button"
                onClick={handleDeleteClick}
                className="app-btn-danger text-sm"
              >
                削除
              </button>
            )}
          </div>
        </div>

        <label className="mt-4 flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
          <input
            type="checkbox"
            checked={hiddenFromPicker}
            disabled={hiddenPending}
            onChange={(event) => handleHiddenChange(event.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          登録画面に表示しない
        </label>
        {hiddenError && <p className="mt-2 app-alert-error">{hiddenError}</p>}

        {confirmingDelete && (
          <div className="mt-3">
            <DeleteConfirmPanel
              title={`店舗「${station.registeredName}」を削除しますか？`}
              description="登録店舗リストから削除します。既存の給油記録は残ります。この操作は取り消せません。"
              deleting={deleting}
              error={deleteError}
              onCancel={handleDeleteCancel}
              onConfirm={handleDeleteConfirm}
            />
          </div>
        )}
      </li>
    );
  }

  return (
    <li className="rounded-xl border border-blue-200 bg-blue-50/40 p-4 dark:border-blue-800 dark:bg-blue-950/20">
      <form action={updateAction} className="space-y-3">
        <input
          type="hidden"
          name="hiddenFromPicker"
          value={hiddenFromPicker ? "on" : "off"}
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor={`station-brand-${station.id}`} className="app-label">
              ブランド
            </label>
            <select
              id={`station-brand-${station.id}`}
              name="gasStationBrands"
              required
              value={brandSelect}
              onChange={(event) => setBrandSelect(event.target.value)}
              className="app-input"
            >
              <option value="" disabled>
                選択してください
              </option>
              {gasStationBrands.map((brand) => (
                <option key={brand.id} value={brand.name}>
                  {brand.name}
                </option>
              ))}
            </select>
          </div>

          {brandSelect === OTHER_GAS_STATION_BRAND_NAME && (
            <div>
              <label htmlFor={`station-custom-brand-${station.id}`} className="app-label">
                ブランド名
              </label>
              <input
                id={`station-custom-brand-${station.id}`}
                name="gasStationBrandOther"
                type="text"
                required
                maxLength={30}
                defaultValue={defaults.customBrand}
                className="app-input"
              />
            </div>
          )}

          <div className={brandSelect === OTHER_GAS_STATION_BRAND_NAME ? "sm:col-span-2" : ""}>
            <label htmlFor={`station-store-name-${station.id}`} className="app-label">
              店舗名
            </label>
            <input
              id={`station-store-name-${station.id}`}
              name="gasStationStoreName"
              type="text"
              required
              maxLength={80}
              defaultValue={defaults.storeName}
              className="app-input"
            />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
          <input
            type="checkbox"
            checked={hiddenFromPicker}
            onChange={(event) => setHiddenFromPicker(event.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          登録画面に表示しない
        </label>

        {updateState.error && <p className="app-alert-error">{updateState.error}</p>}
        <div className="flex gap-2">
          <button type="submit" disabled={updatePending} className="app-btn-primary px-3 py-2">
            {updatePending ? "保存中..." : "保存"}
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="app-btn-secondary px-3 py-2"
          >
            キャンセル
          </button>
        </div>
      </form>
    </li>
  );
}
