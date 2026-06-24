import { AppPage } from "@/components/app-page";

export function AppRouteLoading() {
  return (
    <main className="flex min-h-full flex-1 flex-col">
      <div
        className="border-b border-blue-800/20 bg-gradient-to-r from-blue-800 via-blue-700 to-blue-600 px-4 pt-[calc(1rem+env(safe-area-inset-top,0px))] pb-4 shadow-md shadow-blue-900/10 dark:border-slate-700/50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 dark:shadow-black/20"
        aria-hidden="true"
      >
        <div className="mx-auto flex w-full max-w-3xl items-center gap-4 lg:max-w-5xl">
          <div className="h-11 w-11 shrink-0 animate-pulse rounded-lg bg-white/15" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-5 w-36 max-w-[70%] animate-pulse rounded bg-white/20" />
            <div className="h-4 w-28 max-w-[55%] animate-pulse rounded bg-white/10" />
          </div>
          <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-white/15" />
        </div>
      </div>

      <div
        className="space-y-6"
        aria-busy="true"
        aria-label="読み込み中"
      >
        <AppPage className="space-y-6">
          <div className="app-card h-28 animate-pulse bg-slate-100/80 dark:bg-slate-700/40" />
          <div className="app-card h-40 animate-pulse bg-slate-100/80 dark:bg-slate-700/40" />
          <div className="app-card h-56 animate-pulse bg-slate-100/80 dark:bg-slate-700/40" />
        </AppPage>
      </div>
    </main>
  );
}
