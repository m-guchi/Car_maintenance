"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import {
  deleteVehicleAndRedirectAction,
} from "@/app/(app)/vehicles/actions";

type VehicleDeleteFormProps = {
  vehicleId: string;
  cancelHref: string;
};

export function VehicleDeleteForm({
  vehicleId,
  cancelHref,
}: VehicleDeleteFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteVehicleAndRedirectAction(vehicleId);
      if (!result.ok) {
        setError(result.error ?? "削除に失敗しました");
      }
    });
  }

  return (
    <div className="mt-6 space-y-4">
      {error && <p className="app-alert-error">{error}</p>}

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link href={cancelHref} className="app-btn-secondary flex-1 py-3 text-center">
          キャンセル
        </Link>
        <button
          type="button"
          onClick={handleDelete}
          disabled={pending}
          className="flex-1 rounded-lg border border-red-300 bg-red-600 px-3 py-3 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-700 dark:bg-red-700 dark:hover:bg-red-600"
        >
          {pending ? "削除中..." : "削除する"}
        </button>
      </div>
    </div>
  );
}
