"use client";

import { useActionState, useEffect, useRef } from "react";

import {
  createVehicleAction,
  type VehicleActionState,
} from "@/app/vehicles/actions";
import { VehicleFormFields } from "@/components/vehicle-form-fields";

const initialState: VehicleActionState = { ok: false };

export function VehicleForm() {
  const [state, formAction, pending] = useActionState(
    createVehicleAction,
    initialState,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
    }
  }, [state.ok]);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-base font-semibold text-slate-900">車両を登録</h2>
      <p className="mt-1 text-sm text-slate-500">
        車両名は必須です。車種名・型式・燃料種別・車検満了日の入力を推奨します。
      </p>

      <form ref={formRef} action={formAction} className="mt-5 space-y-4">
        <VehicleFormFields />

        {state.error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {state.error}
          </p>
        )}

        {state.ok && (
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            車両を登録しました
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "登録中..." : "車両を登録する"}
        </button>
      </form>
    </section>
  );
}
