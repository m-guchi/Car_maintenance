"use client";

import { useActionState } from "react";

import {
  createFuelLogAction,
  type FuelActionState,
} from "@/app/(app)/fuel/actions";
import { FuelFormFields } from "@/components/fuel-form-fields";

const initialState: FuelActionState = { ok: false };

type FuelFormProps = {
  vehicleId: string;
  previousOdometer?: number | null;
};

export function FuelForm({ vehicleId, previousOdometer = null }: FuelFormProps) {
  const boundAction = createFuelLogAction.bind(null, vehicleId);
  const [state, formAction, pending] = useActionState(boundAction, initialState);

  return (
    <section className="app-card border-l-4 border-l-amber-500">
      <h2 className="app-section-title">給油を記録</h2>
      <p className="mt-1 text-sm text-slate-500">
        前回給油からの距離を入力すると、オドメーターは自動計算されます。
      </p>

      <form action={formAction} className="mt-5 space-y-4">
        <FuelFormFields
          key={state.resetToken ?? "new"}
          previousOdometer={previousOdometer}
        />

        {state.error && <p className="app-alert-error">{state.error}</p>}

        {state.ok && (
          <p className="app-alert-success">給油記録を登録しました</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="app-btn-primary flex w-full bg-amber-600 py-3 shadow-amber-600/20 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-400"
        >
          {pending ? "登録中..." : "給油を記録する"}
        </button>
      </form>
    </section>
  );
}
