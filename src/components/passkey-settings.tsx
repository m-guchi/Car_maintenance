"use client";

import { signIn } from "next-auth/webauthn";
import { useState } from "react";

import { deletePasskeysAction } from "@/app/(app)/settings/actions";

type PasskeySettingsProps = {
  hasPasskey: boolean;
};

export function PasskeySettings({ hasPasskey }: PasskeySettingsProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startRegistration(resetExisting: boolean) {
    setLoading(true);
    setError(null);

    try {
      if (resetExisting) {
        const result = await deletePasskeysAction();
        if (!result.ok) {
          setError(result.error ?? "既存のパスキーの削除に失敗しました。");
          setLoading(false);
          return;
        }
      }

      await signIn("passkey", { action: "register", callbackUrl: "/settings" });
    } catch {
      setError(
        resetExisting
          ? "パスキーの再設定に失敗しました。もう一度お試しください。"
          : "パスキーの登録に失敗しました。もう一度お試しください。",
      );
      setLoading(false);
    }
  }

  return (
    <section className="app-card-muted p-6">
      <h2 className="text-sm font-medium text-slate-900 dark:text-slate-100">
        パスキー
      </h2>

      <dl className="mt-3 text-sm">
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-slate-500 dark:text-slate-400">状態</dt>
          <dd className="text-slate-900 dark:text-slate-100">
            {hasPasskey ? "登録済み" : "未登録"}
          </dd>
        </div>
      </dl>

      <p className="mt-3 text-sm text-slate-500">
        {hasPasskey
          ? "別の端末で使う場合やログインできなくなった場合は、再設定できます。"
          : "顔認証や指紋認証でログインできるようにパスキーを登録できます。"}
      </p>

      {error && <p className="app-alert-error mt-3">{error}</p>}

      <button
        type="button"
        onClick={() => startRegistration(hasPasskey)}
        disabled={loading}
        className="app-btn-secondary mt-4"
      >
        {loading
          ? "処理中..."
          : hasPasskey
            ? "パスキーを再設定する"
            : "パスキーを登録する"}
      </button>
    </section>
  );
}
