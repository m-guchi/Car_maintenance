import Link from "next/link";

import { auth } from "@/auth";
import { AppHeader } from "@/components/app-header";
import { AppPage } from "@/components/app-page";
import { FuelForm } from "@/components/fuel-form";
import {
  listFuelLogsForVehicle,
} from "@/lib/fuel-logs";
import {
  getPreviousOdometer,
  buildKnownGasStationsFromLogs,
  serializeFuelLogsForClient,
} from "@/lib/fuel-types";
import { getVehicleSubtitle } from "@/lib/vehicle-display";
import { getActiveVehicle } from "@/lib/vehicles";

export default async function FuelNewPage() {
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

  const previousOdometer =
    clientFuelLogs && activeVehicle
      ? getPreviousOdometer(clientFuelLogs, activeVehicle.initialOdometer)
      : (activeVehicle?.initialOdometer ?? null);

  const knownGasStations = clientFuelLogs
    ? buildKnownGasStationsFromLogs(clientFuelLogs)
    : [];

  return (
    <main className="flex min-h-full flex-1 flex-col">
      <AppHeader
        title="給油を記録"
        subtitle={
          activeVehicle
            ? `${activeVehicle.name}${vehicleSubtitle ? `（${vehicleSubtitle}）` : ""}`
            : undefined
        }
        backHref="/fuel"
        backLabel="給油情報に戻る"
        user={{
          name: session?.user?.name,
          email: session?.user?.email,
          image: session?.user?.image,
        }}
      />

      <AppPage className="space-y-6">
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
          <FuelForm
            vehicleId={activeVehicle.id}
            previousOdometer={previousOdometer}
            knownGasStations={knownGasStations}
          />
        )}
      </AppPage>
    </main>
  );
}
