import { auth } from "@/auth";
import { AppHeader } from "@/components/app-header";
import { AppPage } from "@/components/app-page";

export default async function MaintenancePage() {
  const session = await auth();

  return (
    <main className="flex min-h-full flex-1 flex-col">
      <AppHeader
        title="メンテナンス"
        subtitle="整備履歴・カテゴリ管理"
        showHomeLink
        user={{
          name: session?.user?.name,
          email: session?.user?.email,
          image: session?.user?.image,
        }}
      />

      <AppPage>
        <section className="app-card-muted border border-dashed border-violet-300 p-8 text-center dark:border-violet-700">
          <span className="text-3xl" aria-hidden="true">
            🔧
          </span>
          <h2 className="mt-3 text-base font-semibold text-slate-900 dark:text-slate-100">
            準備中
          </h2>
          <p className="mt-1 text-sm app-text-muted">
            メンテナンス記録とカテゴリ管理は近日公開予定です。
          </p>
        </section>
      </AppPage>
    </main>
  );
}
