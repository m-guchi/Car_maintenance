import Link from "next/link";

import { auth } from "@/auth";
import { AppHeader } from "@/components/app-header";
import { AppPage } from "@/components/app-page";
import { PasskeyRegisterCard } from "@/components/passkey-register-card";
import { menuItems } from "@/lib/nav-items";
import { hasRegisteredPasskeys } from "@/lib/passkey";
import { getVehicleSubtitle } from "@/lib/vehicle-display";
import { listVehicles } from "@/lib/vehicles";

export default async function HomePage() {
  const session = await auth();
  const email = session?.user?.email;
  const userId = session?.user?.id;
  const hasPasskey = email ? await hasRegisteredPasskeys(email) : false;
  const vehicles = userId ? await listVehicles(userId) : [];
  const activeVehicle = vehicles.find((vehicle) => vehicle.isActive);
  const activeVehicleSubtitle = activeVehicle
    ? getVehicleSubtitle(activeVehicle)
    : null;

  return (
    <main className="flex min-h-full flex-1 flex-col">
      <AppHeader
        title="Car Maintenance"
        subtitle="ダッシュボード"
        user={{
          name: session?.user?.name,
          email: session?.user?.email,
          image: session?.user?.image,
        }}
      />

      <AppPage>
        {email && (
          <div className="mb-6">
            <PasskeyRegisterCard hasPasskey={hasPasskey} />
          </div>
        )}

        <section className="app-card overflow-hidden border-l-4 border-l-blue-500">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-2xl dark:bg-blue-900/40">
              🚗
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="app-section-title">ようこそ</h2>
              {activeVehicle ? (
                <p className="mt-2 text-sm leading-relaxed app-text-muted">
                  使用中の車両:{" "}
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {activeVehicle.name}
                  </span>
                  {activeVehicleSubtitle && (
                    <span className="app-text-subtle">
                      {" "}
                      （{activeVehicleSubtitle}）
                    </span>
                  )}
                </p>
              ) : (
                <p className="mt-2 text-sm leading-relaxed app-text-muted">
                  まず車両を登録して、給油記録やメンテナンス管理を始めましょう。
                </p>
              )}
              <Link
                href="/vehicles"
                className="app-btn-primary mt-4"
              >
                {vehicles.length > 0 ? "車両を管理する" : "車両を登録する"}
              </Link>
            </div>
          </div>
        </section>

        <h2 className="mt-8 mb-4 text-sm font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
          メニュー
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          {menuItems.map((item) => {
            const card = (
              <div className="flex items-start gap-3">
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl ${item.iconBg}`}
                  aria-hidden="true"
                >
                  {item.emoji}
                </span>
                <div className="min-w-0">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">{item.title}</h3>
                  <p className="mt-0.5 text-sm app-text-muted">{item.desc}</p>
                  {!item.ready && (
                    <span className="mt-2 inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500 dark:bg-slate-700 dark:text-slate-400">
                      準備中
                    </span>
                  )}
                </div>
              </div>
            );

            const cardClassName = `rounded-xl border border-slate-200/80 border-l-4 p-4 shadow-sm transition dark:border-slate-700/80 ${item.accent} ${
              item.href ? "hover:shadow-md" : "opacity-70"
            }`;

            if (item.href) {
              return (
                <Link key={item.title} href={item.href} className={cardClassName}>
                  {card}
                </Link>
              );
            }

            return (
              <div key={item.title} className={cardClassName}>
                {card}
              </div>
            );
          })}
        </div>
      </AppPage>
    </main>
  );
}
