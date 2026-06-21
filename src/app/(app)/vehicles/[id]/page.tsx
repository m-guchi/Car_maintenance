import Link from "next/link";

import { AppHeader } from "@/components/app-header";
import { VehicleDetails } from "@/components/vehicle-details";
import { getVehicleForSession } from "@/lib/vehicle-page";

type VehicleDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function VehicleDetailPage({
  params,
}: VehicleDetailPageProps) {
  const { id } = await params;
  const { vehicle, session } = await getVehicleForSession(id);

  return (
    <main className="flex min-h-full flex-1 flex-col">
      <AppHeader
        title={vehicle.name}
        subtitle="車両詳細"
        backHref="/vehicles"
        backLabel="車両一覧"
        user={{
          name: session.user?.name,
          email: session.user?.email,
          image: session.user?.image,
        }}
      />

      <div className="mx-auto w-full max-w-3xl flex-1 space-y-6 px-4 py-8 sm:px-6 lg:max-w-5xl">
        <section
          className={`app-card border-l-4 p-6 ${
            vehicle.isActive
              ? "border-l-emerald-500"
              : "border-l-slate-300 dark:border-l-slate-600"
          }`}
        >
          <VehicleDetails vehicle={vehicle} />
        </section>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href={`/vehicles/${vehicle.id}/edit`}
            className="app-btn-secondary flex-1 py-3 text-center"
          >
            編集
          </Link>
          <Link
            href={`/vehicles/${vehicle.id}/delete`}
            className="app-btn-danger flex-1 py-3 text-center"
          >
            削除
          </Link>
        </div>
      </div>
    </main>
  );
}
