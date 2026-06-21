"use client";

import { useActionState, useEffect, useState } from "react";

import {
  deleteFuelLogAction,
  updateFuelLogAction,
  type FuelActionState,
} from "@/app/(app)/fuel/actions";
import { FuelFormFields } from "@/components/fuel-form-fields";
import {
  formatCurrency,
  formatDistanceSinceLastFill,
  formatFuelAmount,
  formatFuelEfficiency,
  formatPricePerLiter,
} from "@/lib/fuel-display";
import { computeFuelEfficiencyForLog } from "@/lib/fuel-stats";
import { getPreviousOdometer, type FuelLogClientRecord } from "@/lib/fuel-types";
import { formatDateJa, formatOdometer } from "@/lib/vehicle-display";

type FuelListProps = {
  fuelLogs: FuelLogClientRecord[];
  vehicleInitialOdometer?: number | null;
};

const initialState: FuelActionState = { ok: false };

function getEfficiencyForLog(fuelLog: FuelLogClientRecord): number | null {
  return computeFuelEfficiencyForLog(fuelLog);
}

function FuelEditForm({
  fuelLog,
  fuelLogs,
  vehicleInitialOdometer,
  onCancel,
}: {
  fuelLog: FuelLogClientRecord;
  fuelLogs: FuelLogClientRecord[];
  vehicleInitialOdometer?: number | null;
  onCancel: () => void;
}) {
  const boundAction = updateFuelLogAction.bind(null, fuelLog.id);
  const [state, formAction, pending] = useActionState(
    boundAction,
    initialState,
  );

  useEffect(() => {
    if (state.ok) {
      onCancel();
    }
  }, [state.ok, onCancel]);

  return (
    <form
      action={formAction}
      className="mt-4 space-y-4 border-t border-slate-100 pt-4 dark:border-slate-700"
    >
      <FuelFormFields
        fuelLog={fuelLog}
        idPrefix={`edit-${fuelLog.id}`}
        previousOdometer={getPreviousOdometer(
          fuelLogs,
          vehicleInitialOdometer,
          fuelLog.id,
        )}
      />

      {state.error && <p className="app-alert-error">{state.error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="app-btn-primary px-3 py-2"
        >
          {pending ? "保存中..." : "保存"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="app-btn-secondary px-3 py-2"
        >
          キャンセル
        </button>
      </div>
    </form>
  );
}

function FuelLogCard({
  fuelLog,
  fuelLogs,
  vehicleInitialOdometer,
}: {
  fuelLog: FuelLogClientRecord;
  fuelLogs: FuelLogClientRecord[];
  vehicleInitialOdometer?: number | null;
}) {
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const efficiency = getEfficiencyForLog(fuelLog);

  async function handleDelete() {
    if (!window.confirm(`${formatDateJa(fuelLog.date)}の記録を削除しますか？`)) {
      return;
    }

    setDeleting(true);
    setDeleteError(null);

    const result = await deleteFuelLogAction(fuelLog.id);

    if (!result.ok) {
      setDeleteError(result.error ?? "削除に失敗しました");
      setDeleting(false);
    }
  }

  return (
    <article className="app-card border-l-4 border-l-amber-400 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {formatDateJa(fuelLog.date)}
          </p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {formatDistanceSinceLastFill(fuelLog.distanceKm)}
            {fuelLog.odometer != null && (
              <span className="text-slate-500">
                {" "}
                · {formatOdometer(fuelLog.odometer)}
              </span>
            )}
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {formatCurrency(fuelLog.totalCost)}
          </p>
          <p className="text-sm text-slate-500">
            {formatFuelAmount(fuelLog.fuelAmount)} ·{" "}
            {formatPricePerLiter(fuelLog.pricePerLiter)}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {fuelLog.isFull && (
          <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
            満タン
          </span>
        )}
        {efficiency !== null && (
          <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">
            燃費 {formatFuelEfficiency(efficiency)}
          </span>
        )}
        {fuelLog.gasStationBrands && (
          <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-700 dark:text-slate-200">
            {fuelLog.gasStationBrands}
          </span>
        )}
      </div>

      {(fuelLog.gasStationName || fuelLog.gasStationBrands) && (
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
          {fuelLog.gasStationName ?? fuelLog.gasStationBrands}
        </p>
      )}

      {!editing && (
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="app-btn-secondary px-3 py-1.5"
          >
            編集
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="app-btn-danger"
          >
            {deleting ? "削除中..." : "削除"}
          </button>
        </div>
      )}

      {deleteError && <p className="app-alert-error mt-3">{deleteError}</p>}

      {editing && (
        <FuelEditForm
          fuelLog={fuelLog}
          fuelLogs={fuelLogs}
          vehicleInitialOdometer={vehicleInitialOdometer}
          onCancel={() => setEditing(false)}
        />
      )}
    </article>
  );
}

export function FuelList({
  fuelLogs,
  vehicleInitialOdometer = null,
}: FuelListProps) {
  if (fuelLogs.length === 0) {
    return (
      <section className="app-card-muted border border-dashed border-slate-300 p-8 text-center dark:border-slate-600">
        <span className="text-3xl" aria-hidden="true">
          ⛽
        </span>
        <h2 className="mt-3 text-base font-semibold text-slate-900 dark:text-slate-100">
          給油記録はまだありません
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          上のフォームから最初の給油を記録してください
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <h2 className="app-section-title">給油履歴（{fuelLogs.length}件）</h2>
      {fuelLogs.map((fuelLog) => (
        <FuelLogCard
          key={fuelLog.id}
          fuelLog={fuelLog}
          fuelLogs={fuelLogs}
          vehicleInitialOdometer={vehicleInitialOdometer}
        />
      ))}
    </section>
  );
}
