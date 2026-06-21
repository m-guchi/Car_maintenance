"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";

import {
  createGasStationBrandAction,
  deleteGasStationBrandAction,
  reorderGasStationBrandsAction,
  updateGasStationBrandAction,
  type SettingsActionState,
} from "@/app/(app)/settings/actions";
import { DeleteConfirmPanel } from "@/components/delete-confirm-panel";
import {
  OTHER_GAS_STATION_BRAND_NAME,
  type GasStationBrandRecord,
} from "@/lib/gas-station-brand-types";

const initialState: SettingsActionState = { ok: false };

const KEYWORDS_HELP =
  "半角カンマ（,）で区切って入力します。全角読点（、）でも入力できます。例: eneos,エネオス,ESS";

type GasStationBrandSettingsProps = {
  brands: GasStationBrandRecord[];
};

function sortBrandList(brands: GasStationBrandRecord[]): GasStationBrandRecord[] {
  return [...brands].sort((left, right) => {
    if (left.name === OTHER_GAS_STATION_BRAND_NAME) {
      return 1;
    }

    if (right.name === OTHER_GAS_STATION_BRAND_NAME) {
      return -1;
    }

    return left.displayOrder - right.displayOrder || left.name.localeCompare(right.name, "ja");
  });
}

export function GasStationBrandSettings({
  brands,
}: GasStationBrandSettingsProps) {
  const router = useRouter();
  const [orderedBrands, setOrderedBrands] = useState(() => sortBrandList(brands));
  const [syncedBrands, setSyncedBrands] = useState(brands);

  if (brands !== syncedBrands) {
    setSyncedBrands(brands);
    setOrderedBrands(sortBrandList(brands));
  }

  const [reorderError, setReorderError] = useState<string | null>(null);
  const [reorderingBrandId, setReorderingBrandId] = useState<string | null>(null);
  const [createState, createAction, createPending] = useActionState(
    createGasStationBrandAction,
    initialState,
  );

  useEffect(() => {
    if (createState.ok) {
      router.refresh();
    }
  }, [createState.ok, router]);

  const sortableBrands = orderedBrands.filter(
    (brand) => brand.name !== OTHER_GAS_STATION_BRAND_NAME,
  );

  async function handleMove(brandId: string, direction: "up" | "down") {
    const currentIndex = sortableBrands.findIndex((brand) => brand.id === brandId);

    if (currentIndex === -1) {
      return;
    }

    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

    if (targetIndex < 0 || targetIndex >= sortableBrands.length) {
      return;
    }

    const nextSortable = [...sortableBrands];
    [nextSortable[currentIndex], nextSortable[targetIndex]] = [
      nextSortable[targetIndex],
      nextSortable[currentIndex],
    ];

    const otherBrand = orderedBrands.find(
      (brand) => brand.name === OTHER_GAS_STATION_BRAND_NAME,
    );
    const nextOrdered = otherBrand ? [...nextSortable, otherBrand] : nextSortable;

    setReorderingBrandId(brandId);
    setReorderError(null);

    const result = await reorderGasStationBrandsAction(
      nextSortable.map((brand) => brand.id),
    );

    if (!result.ok) {
      setReorderError(result.error ?? "並び順の更新に失敗しました");
      setReorderingBrandId(null);
      return;
    }

    setOrderedBrands(nextOrdered);
    setReorderingBrandId(null);
    router.refresh();
  }

  return (
    <section className="app-card space-y-6">
      <div>
        <h2 className="app-section-title">ガソリンスタンドブランド</h2>
        <p className="mt-1 text-sm text-slate-500">
          給油記録のブランド選択肢と表示順を管理します。地図からの自動判定には「判定キーワード」を使います。
        </p>
      </div>

      <form action={createAction} className="space-y-3 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
        <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100">
          ブランドを追加
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="new-brand-name" className="app-label">
              ブランド名
            </label>
            <input
              id="new-brand-name"
              name="name"
              type="text"
              required
              maxLength={30}
              placeholder="例: コスモ石油"
              className="app-input"
            />
          </div>
          <div>
            <label htmlFor="new-brand-keywords" className="app-label">
              判定キーワード（任意）
            </label>
            <input
              id="new-brand-keywords"
              name="matchKeywords"
              type="text"
              maxLength={200}
              placeholder="例: cosmo,コスモ"
              className="app-input"
            />
            <p className="mt-1 text-xs text-slate-500">{KEYWORDS_HELP}</p>
          </div>
        </div>
        {createState.error && <p className="app-alert-error">{createState.error}</p>}
        {createState.ok && <p className="app-alert-success">ブランドを追加しました</p>}
        <button type="submit" disabled={createPending} className="app-btn-primary">
          {createPending ? "追加中..." : "ブランドを追加"}
        </button>
      </form>

      {reorderError && <p className="app-alert-error">{reorderError}</p>}

      <ul className="space-y-3">
        {orderedBrands.map((brand, index) => {
          const sortableIndex = sortableBrands.findIndex((item) => item.id === brand.id);

          return (
            <BrandRow
              key={brand.id}
              brand={brand}
              sortableIndex={sortableIndex}
              sortableCount={sortableBrands.length}
              isReordering={reorderingBrandId === brand.id}
              onMoveUp={() => handleMove(brand.id, "up")}
              onMoveDown={() => handleMove(brand.id, "down")}
              showOrderLabel={brand.name !== OTHER_GAS_STATION_BRAND_NAME}
              orderNumber={index + 1}
            />
          );
        })}
      </ul>
    </section>
  );
}

function BrandRow({
  brand,
  sortableIndex,
  sortableCount,
  isReordering,
  onMoveUp,
  onMoveDown,
  showOrderLabel,
  orderNumber,
}: {
  brand: GasStationBrandRecord;
  sortableIndex: number;
  sortableCount: number;
  isReordering: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  showOrderLabel: boolean;
  orderNumber: number;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const boundUpdate = updateGasStationBrandAction.bind(null, brand.id);
  const [updateState, updateAction, updatePending] = useActionState(
    async (prev: SettingsActionState, formData: FormData) => {
      const result = await boundUpdate(prev, formData);
      if (result.ok) {
        setEditing(false);
        router.refresh();
      }
      return result;
    },
    initialState,
  );
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const isOther = brand.name === OTHER_GAS_STATION_BRAND_NAME;
  const canMoveUp = !isOther && sortableIndex > 0;
  const canMoveDown = !isOther && sortableIndex >= 0 && sortableIndex < sortableCount - 1;

  function handleDeleteClick() {
    setDeleteError(null);
    setConfirmingDelete(true);
  }

  function handleDeleteCancel() {
    if (deleting) {
      return;
    }
    setConfirmingDelete(false);
    setDeleteError(null);
  }

  async function handleDeleteConfirm() {
    setDeleting(true);
    setDeleteError(null);

    const result = await deleteGasStationBrandAction(brand.id);

    if (!result.ok) {
      setDeleteError(result.error ?? "削除に失敗しました");
      setDeleting(false);
      return;
    }

    router.refresh();
  }

  if (!editing) {
    return (
      <li className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
        <div className="flex items-start gap-3">
          {!isOther && (
            <div className="flex shrink-0 flex-col gap-1">
              <button
                type="button"
                onClick={onMoveUp}
                disabled={!canMoveUp || isReordering}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
                aria-label={`${brand.name}を上へ`}
              >
                ↑
              </button>
              <button
                type="button"
                onClick={onMoveDown}
                disabled={!canMoveDown || isReordering}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
                aria-label={`${brand.name}を下へ`}
              >
                ↓
              </button>
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {showOrderLabel && (
                <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {orderNumber}
                </span>
              )}
              <p className="font-medium text-slate-900 dark:text-slate-100">{brand.name}</p>
            </div>
            {brand.matchKeywords && (
              <p className="mt-1 break-words text-xs text-slate-500">
                判定キーワード: {brand.matchKeywords}
              </p>
            )}
            {isOther && (
              <p className="mt-1 text-xs text-slate-500">
                一覧にないブランドを給油記録時に手入力するための項目です（常に最後に表示）。
              </p>
            )}
          </div>

          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="app-btn-secondary px-3 py-1.5 text-sm"
            >
              編集
            </button>
            {!isOther && !confirmingDelete && (
              <button
                type="button"
                onClick={handleDeleteClick}
                className="app-btn-danger text-sm"
              >
                削除
              </button>
            )}
          </div>
        </div>
        {confirmingDelete && (
          <div className="mt-3">
            <DeleteConfirmPanel
              title={`ブランド「${brand.name}」を削除しますか？`}
              description="このブランドを削除します。既存の給油記録に紐づくブランド名は残ります。この操作は取り消せません。"
              deleting={deleting}
              error={deleteError}
              onCancel={handleDeleteCancel}
              onConfirm={handleDeleteConfirm}
            />
          </div>
        )}
      </li>
    );
  }

  return (
    <li className="rounded-xl border border-blue-200 bg-blue-50/40 p-4 dark:border-blue-800 dark:bg-blue-950/20">
      <form action={updateAction} className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor={`brand-name-${brand.id}`} className="app-label">
              ブランド名
            </label>
            <input
              id={`brand-name-${brand.id}`}
              name="name"
              type="text"
              required
              maxLength={30}
              defaultValue={brand.name}
              readOnly={isOther}
              className="app-input"
            />
          </div>
          <div>
            <label htmlFor={`brand-keywords-${brand.id}`} className="app-label">
              判定キーワード（任意）
            </label>
            <input
              id={`brand-keywords-${brand.id}`}
              name="matchKeywords"
              type="text"
              maxLength={200}
              defaultValue={brand.matchKeywords ?? ""}
              placeholder="例: eneos,エネオス"
              className="app-input"
            />
            <p className="mt-1 text-xs text-slate-500">{KEYWORDS_HELP}</p>
          </div>
        </div>
        {updateState.error && <p className="app-alert-error">{updateState.error}</p>}
        <div className="flex gap-2">
          <button type="submit" disabled={updatePending} className="app-btn-primary px-3 py-2">
            {updatePending ? "保存中..." : "保存"}
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="app-btn-secondary px-3 py-2"
          >
            キャンセル
          </button>
        </div>
      </form>
    </li>
  );
}
