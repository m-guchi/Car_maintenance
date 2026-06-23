"use client";

import Link from "next/link";

import type { FuelLogRegisteredSummary } from "@/app/(app)/fuel/actions";
import {
  formatCurrency,
  formatDistanceKmValue,
  formatFuelAmount,
  formatFuelEfficiency,
  formatPricePerLiter,
} from "@/lib/fuel-display";
import { formatDateJa } from "@/lib/vehicle-display";

type FuelLogConfirmPanelProps = {
  summary: FuelLogRegisteredSummary;
  onRecordAnother?: () => void;
};

export function FuelLogConfirmPanel({
  summary,
  onRecordAnother,
}: FuelLogConfirmPanelProps) {
  const date = new Date(summary.date);

  return (
    <section className="app-card border-l-4 border-l-emerald-500 p-4 sm:p-5">
      <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
        給油記録を登録しました
      </h2>

      <dl className="mt-3 space-y-2 text-sm">
        <div className="flex items-baseline justify-between gap-3 border-b border-slate-100 pb-2 dark:border-slate-700">
          <dt className="shrink-0 text-slate-500">給油日</dt>
          <dd className="text-right font-medium text-slate-900 dark:text-slate-100">
            {formatDateJa(date)}
          </dd>
        </div>
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-2 dark:border-slate-700">
          <dt className="shrink-0 text-slate-500">スタンド</dt>
          <dd className="text-right font-medium text-slate-900 dark:text-slate-100">
            {summary.gasStationName}
          </dd>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          <div>
            <dt className="text-xs text-slate-500">距離</dt>
            <dd className="font-medium text-slate-900 dark:text-slate-100">
              {formatDistanceKmValue(summary.distanceKm)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">オドメーター</dt>
            <dd className="font-medium text-slate-900 dark:text-slate-100">
              {summary.odometer != null
                ? `${summary.odometer.toLocaleString("ja-JP")} km`
                : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">給油量</dt>
            <dd className="font-medium text-slate-900 dark:text-slate-100">
              {formatFuelAmount(summary.fuelAmount)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">単価</dt>
            <dd className="font-medium text-slate-900 dark:text-slate-100">
              {formatPricePerLiter(summary.pricePerLiter)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">合計</dt>
            <dd className="font-medium text-slate-900 dark:text-slate-100">
              {formatCurrency(summary.totalCost)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">満タン</dt>
            <dd className="font-medium text-slate-900 dark:text-slate-100">
              {summary.isFull ? "はい" : "いいえ"}
            </dd>
          </div>
          {summary.fuelEfficiency !== null && (
            <div className="col-span-2">
              <dt className="text-xs text-slate-500">燃費</dt>
              <dd className="font-medium text-emerald-700 dark:text-emerald-300">
                {formatFuelEfficiency(summary.fuelEfficiency)}
              </dd>
            </div>
          )}
        </div>
      </dl>

      <div className="mt-4 flex gap-2">
        <Link href="/fuel" className="app-btn-primary min-h-11 flex-1 text-center text-sm">
          給油一覧へ
        </Link>
        {onRecordAnother && (
          <button
            type="button"
            onClick={onRecordAnother}
            className="app-btn-secondary min-h-11 flex-1 text-sm"
          >
            続けて記録
          </button>
        )}
      </div>
    </section>
  );
}
