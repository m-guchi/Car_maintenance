type DeleteConfirmPanelProps = {
  title: string;
  description: string;
  deleting?: boolean;
  error?: string | null;
  onCancel: () => void;
  onConfirm: () => void;
  confirmLabel?: string;
};

export function DeleteConfirmPanel({
  title,
  description,
  deleting = false,
  error = null,
  onCancel,
  onConfirm,
  confirmLabel = "削除する",
}: DeleteConfirmPanelProps) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50/60 p-4 dark:border-red-900/50 dark:bg-red-950/20">
      <div className="flex items-start gap-3">
        <span className="text-xl" aria-hidden="true">
          ⚠️
        </span>
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {title}
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            {description}
          </p>
        </div>
      </div>

      {error && <p className="app-alert-error mt-3">{error}</p>}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={onCancel}
          disabled={deleting}
          className="app-btn-secondary flex-1"
        >
          キャンセル
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={deleting}
          className="flex-1 rounded-lg border border-red-300 bg-red-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-700 dark:bg-red-700 dark:hover:bg-red-600"
        >
          {deleting ? "削除中..." : confirmLabel}
        </button>
      </div>
    </div>
  );
}
