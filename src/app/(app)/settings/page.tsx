import Link from "next/link";

import { auth } from "@/auth";
import { AppHeader } from "@/components/app-header";
import { AppPage } from "@/components/app-page";
import { GasStationBrandSettings } from "@/components/gas-station-brand-settings";
import { RegisteredGasStationSettings } from "@/components/registered-gas-station-settings";
import { APP_VERSION } from "@/lib/app-version";
import { ensureGasStationBrandsForUser } from "@/lib/gas-station-brands";
import { ensureRegisteredGasStationsForUser } from "@/lib/registered-gas-stations";

export default async function SettingsPage() {
  const session = await auth();
  const userId = session?.user?.id;
  const brands = userId ? await ensureGasStationBrandsForUser(userId) : [];
  const registeredStations = userId
    ? await ensureRegisteredGasStationsForUser(userId)
    : [];

  return (
    <main className="flex min-h-full flex-1 flex-col">
      <AppHeader
        title="設定"
        showHomeLink
        user={{
          name: session?.user?.name,
          email: session?.user?.email,
          image: session?.user?.image,
        }}
      />

      <AppPage className="space-y-6">
        <GasStationBrandSettings brands={brands} />
        <RegisteredGasStationSettings
          stations={registeredStations}
          gasStationBrands={brands}
        />

        <section className="app-card-muted p-6">
          <h2 className="text-sm font-medium text-slate-900 dark:text-slate-100">
            アプリ情報
          </h2>
          <dl className="mt-3 text-sm">
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-slate-500 dark:text-slate-400">バージョン</dt>
              <dd className="font-mono text-slate-900 dark:text-slate-100">
                v{APP_VERSION}
              </dd>
            </div>
          </dl>
        </section>

        <section className="app-card-muted border border-dashed border-slate-300 p-6 dark:border-slate-600">
          <h2 className="text-sm font-medium text-slate-900 dark:text-slate-100">
            パスキー
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            パスキーの登録はホーム画面から行えます。
          </p>
          <Link href="/" className="app-btn-secondary mt-4 inline-flex">
            ホームへ
          </Link>
        </section>
      </AppPage>
    </main>
  );
}
