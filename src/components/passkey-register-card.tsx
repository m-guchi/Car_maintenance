"use client";

import { signIn } from "next-auth/webauthn";
import { useState } from "react";

type PasskeyRegisterCardProps = {
  hasPasskey: boolean;
};

export function PasskeyRegisterCard({ hasPasskey }: PasskeyRegisterCardProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRegister() {
    setLoading(true);
    setError(null);

    try {
      await signIn("passkey", { action: "register", callbackUrl: "/" });
    } catch {
      setError("パスキーの登録に失敗しました。もう一度お試しください。");
      setLoading(false);
    }
  }

  if (hasPasskey) {
    return (
      <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="text-2xl" aria-hidden="true">
            ✅
          </span>
          <div>
            <h2 className="text-base font-semibold text-emerald-900">
              パスキー登録済み
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-emerald-800">
              次回からはログイン画面で「パスキー（顔認証）でログイン」を使えます。
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-blue-200 bg-blue-50 p-6 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="text-2xl" aria-hidden="true">
          🔐
        </span>
        <div className="flex-1">
          <h2 className="text-base font-semibold text-blue-900">
            パスキーを登録してください
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-blue-800">
            初回の Google ログインが完了しました。パスキーを登録すると、次回から顔認証や指紋認証でログインできます。
          </p>

          {error && (
            <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={handleRegister}
            disabled={loading}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {loading ? "登録中..." : "パスキーを登録する"}
          </button>
        </div>
      </div>
    </section>
  );
}
