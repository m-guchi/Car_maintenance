"use client";

import { useActionState } from "react";

import {
  updateVehicleAction,
  type VehicleActionState,
} from "@/app/(app)/vehicles/actions";
import { VehicleFormFields } from "@/components/vehicle-form-fields";
import type { VehicleRecord } from "@/lib/vehicles";

type VehicleEditFormProps = {
  vehicle: VehicleRecord;
};

const initialState: VehicleActionState = { ok: false };

export function VehicleEditForm({ vehicle }: VehicleEditFormProps) {
  const boundAction = updateVehicleAction.bind(null, vehicle.id);
  const [state, formAction, pending] = useActionState(
    boundAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <VehicleFormFields vehicle={vehicle} idPrefix={`edit-${vehicle.id}`} />

      {state.error && <p className="app-alert-error">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="app-btn-primary flex w-full py-3"
      >
        {pending ? "保存中..." : "変更を保存する"}
      </button>
    </form>
  );
}
