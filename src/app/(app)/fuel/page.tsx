import Link from "next/link";

import { auth } from "@/auth";
import { AppHeader } from "@/components/app-header";
import { FuelDashboard } from "@/components/fuel-dashboard";
import { FuelForm } from "@/components/fuel-form";
import { FuelList } from "@/components/fuel-list";
import { GasStationSearch } from "@/components/gas-station-search";
import {
  getFuelDashboardForVehicle,
  listFuelLogsForVehicle,
} from "@/lib/fuel-logs";
import {
  getPreviousOdometer,
  serializeFuelLogsForClient,
} from "@/lib/fuel-types";
import { getVehicleSubtitle } from "@/lib/vehicle-display";
import { getActiveVehicle } from "@/lib/vehicles";

export default async function FuelPage() {
  const session = await auth();
  const userId = session?.user?.id;
  const activeVehicle = userId ? await getActiveVehicle(userId) : null;
  const vehicleSubtitle = activeVehicle
    ? getVehicleSubtitle(activeVehicle)
    : null;

  const fuelLogs =
    userId && activeVehicle
      ? await listFuelLogsForVehicle(userId, activeVehicle.id)
      : null;

  const clientFuelLogs = fuelLogs ? serializeFuelLogsForClient(fuelLogs) : null;

  const dashboardStats =
    userId && activeVehicle
      ? await getFuelDashboardForVehicle(userId, activeVehicle.id)
      : null;

  const previousOdometer =
    clientFuelLogs && activeVehicle
      ? getPreviousOdometer(clientFuelLogs, activeVehicle.initialOdometer)
      : (activeVehicle?.initialOdometer ?? null);

  return (
    <main className="flex min-h-full flex-1 flex-col">
      <AppHeader
        title="給油記録"
        subtitle={
          activeVehicle
            ? `${activeVehicle.name}${vehicleSubtitle ? `（${vehicleSubtitle}）` : ""}`
            : undefined
        }
        showHomeLink
        user={{
          name: session?.user?.name,
          email: session?.user?.email,
          image: session?.user?.image,
        }}
      />

      <div className="mx-auto w-full max-w-3xl flex-1 space-y-6 px-4 py-8 sm:px-6 lg:max-w-5xl">
        {!activeVehicle ? (
          <section className="app-card-muted border border-dashed border-slate-300 p-8 text-center dark:border-slate-600">
            <span className="text-3xl" aria-hidden="true">
              🚗
            </span>
            <h2 className="mt-3 text-base font-semibold text-slate-900 dark:text-slate-100">
              使用中の車両がありません
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              給油記録を始めるには、まず車両を登録して使用中に設定してください。
            </p>
            <Link href="/vehicles" className="app-btn-primary mt-4">
              車両を登録する
            </Link>
          </section>
        ) : (
          <>
            {dashboardStats && dashboardStats.logCount > 0 && (
              <FuelDashboard stats={dashboardStats} />
            )}

            <GasStationSearch />

            <FuelForm
              vehicleId={activeVehicle.id}
              previousOdometer={previousOdometer}
            />

            {clientFuelLogs && (
              <FuelList
                fuelLogs={clientFuelLogs}
                vehicleInitialOdometer={activeVehicle.initialOdometer}
              />
            )}
          </>
        )}
      </div>
    </main>
  );
}
