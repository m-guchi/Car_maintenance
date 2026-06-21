import { auth } from "@/auth";
import { PasskeyRegisterCard } from "@/components/passkey-register-card";
import { SignOutButton } from "@/components/sign-out-button";
import { hasRegisteredPasskeys } from "@/lib/passkey";

export default async function HomePage() {
  const session = await auth();
  const email = session?.user?.email;
  const hasPasskey = email ? await hasRegisteredPasskeys(email) : false;

  return (
    <main className="flex min-h-full flex-1 flex-col">
      <header className="border-b border-slate-200 bg-white px-4 py-4">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-900">Car Maintenance</h1>
            <p className="text-sm text-slate-500">
              {session?.user?.email ?? "ダッシュボード"}
            </p>
          </div>
          <SignOutButton />
        </div>
      </header>

      <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
        {email && (
          <div className="mb-6">
            <PasskeyRegisterCard hasPasskey={hasPasskey} />
          </div>
        )}

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">
            ようこそ
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            給油記録・メンテナンス管理・燃費可視化などの機能は今後追加されます。
            認証基盤（Google OAuth / パスキー）と Discord 通知が有効です。
          </p>
        </section>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {[
            { title: "給油記録", desc: "燃費・ガソリン代の管理", emoji: "⛽" },
            { title: "メンテナンス", desc: "カテゴリ別の整備履歴", emoji: "🔧" },
            { title: "車両管理", desc: "複数台・買い替え対応", emoji: "🚙" },
            { title: "設定", desc: "カテゴリ・パスキー管理", emoji: "⚙️" },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-xl border border-slate-200 bg-white p-4 opacity-60"
            >
              <span className="text-2xl" aria-hidden="true">
                {item.emoji}
              </span>
              <h3 className="mt-2 font-medium text-slate-900">{item.title}</h3>
              <p className="mt-1 text-sm text-slate-500">{item.desc}</p>
              <span className="mt-2 inline-block text-xs text-slate-400">
                準備中
              </span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
