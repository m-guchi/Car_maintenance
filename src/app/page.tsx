import Link from "next/link";

import { auth } from "@/auth";
import { AppHeader } from "@/components/app-header";
import { PasskeyRegisterCard } from "@/components/passkey-register-card";
import { hasRegisteredPasskeys } from "@/lib/passkey";
import { getVehicleSubtitle } from "@/lib/vehicle-display";
import { listVehicles } from "@/lib/vehicles";

const featureCards = [
  {
    title: "給油記録",
    desc: "燃費・ガソリン代の管理",
    emoji: "⛽",
    accent: "border-l-amber-400 bg-amber-50/50 hover:border-amber-300",
    iconBg: "bg-amber-100",
  },
  {
    title: "メンテナンス",
    desc: "カテゴリ別の整備履歴",
    emoji: "🔧",
    accent: "border-l-violet-400 bg-violet-50/50 hover:border-violet-300",
    iconBg: "bg-violet-100",
  },
  {
    title: "車両管理",
    desc: "複数台・買い替え対応",
    emoji: "🚙",
    href: "/vehicles",
    ready: true,
    accent: "border-l-emerald-400 bg-emerald-50/50 hover:border-emerald-300",
    iconBg: "bg-emerald-100",
  },
  {
    title: "設定",
    desc: "カテゴリ・パスキー管理",
    emoji: "⚙️",
    accent: "border-l-slate-300 bg-slate-50/50",
    iconBg: "bg-slate-100",
  },
] as const;

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
        subtitle={email ?? "ダッシュボード"}
      />

      <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6 lg:max-w-4xl">
        {email && (
          <div className="mb-6">
            <PasskeyRegisterCard hasPasskey={hasPasskey} />
          </div>
        )}

        <section className="app-card overflow-hidden border-l-4 border-l-blue-500">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-2xl">
              🚗
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="app-section-title">ようこそ</h2>
              {activeVehicle ? (
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  使用中の車両:{" "}
                  <span className="font-semibold text-slate-900">
                    {activeVehicle.name}
                  </span>
                  {activeVehicleSubtitle && (
                    <span className="text-slate-500">
                      {" "}
                      （{activeVehicleSubtitle}）
                    </span>
                  )}
                </p>
              ) : (
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
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

        <h2 className="mt-8 mb-4 text-sm font-semibold tracking-wide text-slate-500 uppercase">
          メニュー
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          {featureCards.map((item) => {
            const card = (
              <div className="flex items-start gap-3">
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl ${item.iconBg}`}
                  aria-hidden="true"
                >
                  {item.emoji}
                </span>
                <div className="min-w-0">
                  <h3 className="font-semibold text-slate-900">{item.title}</h3>
                  <p className="mt-0.5 text-sm text-slate-600">{item.desc}</p>
                  {"ready" in item && item.ready ? (
                    <span className="mt-2 inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                      利用可能
                    </span>
                  ) : (
                    <span className="mt-2 inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                      準備中
                    </span>
                  )}
                </div>
              </div>
            );

            const cardClassName = `rounded-xl border border-slate-200/80 border-l-4 p-4 shadow-sm transition ${item.accent} ${
              "href" in item && item.href
                ? "hover:shadow-md"
                : "opacity-70"
            }`;

            if ("href" in item && item.href) {
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
      </div>
    </main>
  );
}
