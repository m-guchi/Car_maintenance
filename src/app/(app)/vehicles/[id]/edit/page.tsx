import Link from "next/link";

import { AppHeader } from "@/components/app-header";
import { VehicleEditForm } from "@/components/vehicle-edit-form";
import { getVehicleForSession } from "@/lib/vehicle-page";

type VehicleEditPageProps = {
  params: Promise<{ id: string }>;
};

export default async function VehicleEditPage({ params }: VehicleEditPageProps) {
  const { id } = await params;
  const { vehicle, session } = await getVehicleForSession(id);

  return (
    <main className="flex min-h-full flex-1 flex-col">
      <AppHeader
        title="車両を編集"
        subtitle={vehicle.name}
        backHref={`/vehicles/${vehicle.id}`}
        backLabel="詳細に戻る"
        user={{
          name: session.user?.name,
          email: session.user?.email,
          image: session.user?.image,
        }}
      />

      <div className="mx-auto w-full max-w-3xl flex-1 space-y-6 px-4 py-8 sm:px-6 lg:max-w-5xl">
        <section className="app-card border-l-4 border-l-blue-500">
          <h2 className="app-section-title">車両情報を編集</h2>
          <p className="mt-1 text-sm app-text-subtle">
            変更内容を入力して保存してください。
          </p>

          <div className="mt-5">
            <VehicleEditForm vehicle={vehicle} />
          </div>
        </section>

        <Link
          href={`/vehicles/${vehicle.id}`}
          className="app-btn-secondary inline-flex w-full justify-center py-3"
        >
          キャンセル
        </Link>
      </div>
    </main>
  );
}
