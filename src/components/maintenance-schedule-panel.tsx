import { formatDateJa, formatOdometer } from "@/lib/vehicle-display";
import {
  formatMaintenanceIntervalDays,
  formatMaintenanceIntervalKm,
  formatMaintenanceRemainingDays,
  formatMaintenanceRemainingKm,
} from "@/lib/maintenance-display";
import type { MaintenanceScheduleItem } from "@/lib/maintenance-stats";

type MaintenanceSchedulePanelProps = {
  schedule: MaintenanceScheduleItem[];
  currentOdometerKm: number | null;
};

function RemainingBadge({
  label,
  overdue,
}: {
  label: string;
  overdue: boolean;
}) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
        overdue
          ? "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-200"
          : "bg-violet-100 text-violet-800 dark:bg-violet-950/40 dark:text-violet-200"
      }`}
    >
      {label}
    </span>
  );
}

export function MaintenanceSchedulePanel({
  schedule,
  currentOdometerKm,
}: MaintenanceSchedulePanelProps) {
  if (schedule.length === 0) {
    return (
      <section className="app-card-muted border border-dashed border-slate-300 p-6 dark:border-slate-600">
        <h2 className="app-section-title">次回メンテナンスまで</h2>
        <p className="mt-2 text-sm text-slate-500">
          設定画面でカテゴリごとの交換・整備間隔（km / 日）を登録すると、残り距離・残り日数を表示します。
        </p>
      </section>
    );
  }

  return (
    <section className="app-card space-y-4">
      <div>
        <h2 className="app-section-title">次回メンテナンスまで</h2>
        {currentOdometerKm != null && (
          <p className="mt-1 text-sm text-slate-500">
            現在の総走行距離: {formatOdometer(currentOdometerKm)}
          </p>
        )}
      </div>

      <ul className="space-y-3">
        {schedule.map((item) => (
          <li
            key={item.categoryId}
            className="rounded-xl border border-slate-200 p-4 dark:border-slate-700"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-medium text-slate-900 dark:text-slate-100">
                  {item.categoryName}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {item.intervalKm != null && formatMaintenanceIntervalKm(item.intervalKm)}
                  {item.intervalKm != null && item.intervalDays != null && " · "}
                  {item.intervalDays != null &&
                    formatMaintenanceIntervalDays(item.intervalDays)}
                </p>
              </div>
            </div>

            {!item.hasLastLog ? (
              <p className="mt-3 text-sm text-slate-500">
                前回の記録がないため、残りは算出できません。
              </p>
            ) : (
              <>
                <div className="mt-3 flex flex-wrap gap-2">
                  {item.remainingKm != null && (
                    <RemainingBadge
                      label={formatMaintenanceRemainingKm(item.remainingKm)}
                      overdue={item.isOverdueKm}
                    />
                  )}
                  {item.remainingDays != null && (
                    <RemainingBadge
                      label={formatMaintenanceRemainingDays(item.remainingDays)}
                      overdue={item.isOverdueDays}
                    />
                  )}
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  前回:{" "}
                  {item.lastLogDate ? formatDateJa(new Date(item.lastLogDate)) : "—"}
                  {item.lastLogOdometer != null &&
                    ` · ${formatOdometer(item.lastLogOdometer)}`}
                </p>
              </>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
