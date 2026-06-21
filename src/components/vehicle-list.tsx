"use client";

import { useActionState, useEffect, useState } from "react";

import {
  deleteVehicleAction,
  updateVehicleAction,
  type VehicleActionState,
} from "@/app/vehicles/actions";
import { VehicleDetails } from "@/components/vehicle-details";
import { VehicleFormFields } from "@/components/vehicle-form-fields";
import type { VehicleRecord } from "@/lib/vehicles";

type VehicleListProps = {
  vehicles: VehicleRecord[];
};

const initialState: VehicleActionState = { ok: false };

function VehicleEditForm({
  vehicle,
  onCancel,
}: {
  vehicle: VehicleRecord;
  onCancel: () => void;
}) {
  const boundAction = updateVehicleAction.bind(null, vehicle.id);
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
      className="mt-4 space-y-4 border-t border-slate-100 pt-4"
    >
      <VehicleFormFields vehicle={vehicle} idPrefix={`edit-${vehicle.id}`} />

      {state.error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {pending ? "保存中..." : "保存"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          キャンセル
        </button>
      </div>
    </form>
  );
}

function VehicleCard({ vehicle }: { vehicle: VehicleRecord }) {
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handleDelete() {
    if (
      !window.confirm(
        `「${vehicle.name}」を削除しますか？\n関連する給油・メンテ記録も削除されます。`,
      )
    ) {
      return;
    }

    setDeleting(true);
    setDeleteError(null);

    const result = await deleteVehicleAction(vehicle.id);

    if (!result.ok) {
      setDeleteError(result.error ?? "削除に失敗しました");
      setDeleting(false);
    }
  }

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <VehicleDetails vehicle={vehicle} />

      {!editing && (
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            編集
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-60"
          >
            {deleting ? "削除中..." : "削除"}
          </button>
        </div>
      )}

      {deleteError && (
        <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {deleteError}
        </p>
      )}

      {editing && (
        <VehicleEditForm vehicle={vehicle} onCancel={() => setEditing(false)} />
      )}
    </article>
  );
}

export function VehicleList({ vehicles }: VehicleListProps) {
  if (vehicles.length === 0) {
    return (
      <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center shadow-sm">
        <span className="text-3xl" aria-hidden="true">
          🚗
        </span>
        <h2 className="mt-3 text-base font-semibold text-slate-900">
          登録済みの車両はありません
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          上のフォームから最初の車両を登録してください
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <h2 className="text-base font-semibold text-slate-900">
        登録済み車両（{vehicles.length}台）
      </h2>
      {vehicles.map((vehicle) => (
        <VehicleCard key={vehicle.id} vehicle={vehicle} />
      ))}
    </section>
  );
}
