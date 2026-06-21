import { auth } from "@/auth";
import { AppHeader } from "@/components/app-header";
import { VehicleForm } from "@/components/vehicle-form";
import { VehicleList } from "@/components/vehicle-list";
import { listVehicles } from "@/lib/vehicles";

export default async function VehiclesPage() {
  const session = await auth();
  const userId = session?.user?.id;

  const vehicles = userId ? await listVehicles(userId) : [];

  return (
    <main className="flex min-h-full flex-1 flex-col">
      <AppHeader
        title="車両管理"
        subtitle={session?.user?.email ?? undefined}
        backHref="/"
        backLabel="ホーム"
      />

      <div className="mx-auto w-full max-w-3xl flex-1 space-y-6 px-4 py-8 sm:px-6 lg:max-w-4xl">
        <VehicleForm />
        <VehicleList vehicles={vehicles} />
      </div>
    </main>
  );
}
