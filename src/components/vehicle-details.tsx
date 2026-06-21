import type { VehicleRecord } from "@/lib/vehicles";
import {
  formatDateJa,
  formatDisplacement,
  formatDriveType,
  formatFuelType,
  formatOdometer,
  formatYearMonthJa,
  getVehicleSubtitle,
} from "@/lib/vehicle-display";

type VehicleDetailsProps = {
  vehicle: VehicleRecord;
};

export function VehicleDetails({ vehicle }: VehicleDetailsProps) {
  const subtitle = getVehicleSubtitle(vehicle);
  const details = [
    vehicle.fuelType
      ? { label: "燃料", value: formatFuelType(vehicle.fuelType) }
      : null,
    vehicle.inspectionExpiry
      ? { label: "車検満了", value: formatDateJa(vehicle.inspectionExpiry) }
      : null,
    vehicle.licensePlate
      ? { label: "ナンバー", value: vehicle.licensePlate }
      : null,
    vehicle.firstRegistrationDate
      ? {
          label: "初度登録",
          value: formatYearMonthJa(vehicle.firstRegistrationDate),
        }
      : null,
    vehicle.initialOdometer !== null
      ? {
          label: "登録時走行距離",
          value: formatOdometer(vehicle.initialOdometer),
        }
      : null,
    vehicle.displacement !== null
      ? { label: "排気量", value: formatDisplacement(vehicle.displacement) }
      : null,
    vehicle.driveType
      ? { label: "駆動", value: formatDriveType(vehicle.driveType) }
      : null,
  ].filter((item): item is { label: string; value: string } => item !== null);

  return (
    <div className="w-full">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-medium text-slate-900 dark:text-slate-100">{vehicle.name}</h3>
            {vehicle.isActive && (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                使用中
              </span>
            )}
          </div>
          {subtitle && (
            <p className="mt-1 text-sm app-text-subtle">{subtitle}</p>
          )}
        </div>
        <span className="shrink-0 text-2xl" aria-hidden="true">
          🚙
        </span>
      </div>

      {details.length > 0 && (
        <dl className="mt-4 grid w-full grid-cols-2 gap-3 sm:grid-cols-3">
          {details.map((item) => (
            <div
              key={item.label}
              className="app-detail-cell"
            >
              <dt className="text-xs font-medium app-text-subtle">{item.label}</dt>
              <dd className="mt-0.5 break-words text-sm font-medium text-slate-800 dark:text-slate-200">
                {item.value}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
