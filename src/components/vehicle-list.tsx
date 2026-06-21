import { VehicleListItem } from "@/components/vehicle-list-item";
import type { VehicleRecord } from "@/lib/vehicles";

type VehicleListProps = {
  vehicles: VehicleRecord[];
};

export function VehicleList({ vehicles }: VehicleListProps) {
  if (vehicles.length === 0) {
    return (
      <section className="app-card-muted border border-dashed border-slate-300 p-8 text-center dark:border-slate-600">
        <span className="text-3xl" aria-hidden="true">
          🚗
        </span>
        <h2 className="mt-3 text-base font-semibold text-slate-900 dark:text-slate-100">
          登録済みの車両はありません
        </h2>
        <p className="mt-1 text-sm app-text-subtle">
          上のフォームから最初の車両を登録してください
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <h2 className="app-section-title">
        登録済み車両（{vehicles.length}台）
      </h2>
      <p className="text-sm app-text-subtle">車両をタップして詳細を表示</p>
      {vehicles.map((vehicle) => (
        <VehicleListItem key={vehicle.id} vehicle={vehicle} />
      ))}
    </section>
  );
}
