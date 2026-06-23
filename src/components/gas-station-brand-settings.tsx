"use client";

import { useRouter } from "next/navigation";
import { useActionState, useState, type MouseEvent } from "react";

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

function SectionExpandMark({ expanded }: { expanded: boolean }) {
  return (
    <span
      aria-hidden
      className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-200 text-base leading-none text-slate-500 dark:border-slate-600 dark:text-slate-400"
    >
      {expanded ? "−" : "+"}
    </span>
  );
}

function ItemExpandMark({ expanded }: { expanded: boolean }) {
  return (
    <span
      aria-hidden
      className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-slate-200 text-sm leading-none text-slate-400 dark:border-slate-600"
    >
      {expanded ? "−" : "+"}
    </span>
  );
}

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
  const [sectionExpanded, setSectionExpanded] = useState(false);
  const [orderedBrands, setOrderedBrands] = useState(() => sortBrandList(brands));
  const [syncedBrands, setSyncedBrands] = useState(brands);
  const [expandedBrandId, setExpandedBrandId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  if (brands !== syncedBrands) {
    setSyncedBrands(brands);
    setOrderedBrands(sortBrandList(brands));
  }

  const [reorderError, setReorderError] = useState<string | null>(null);
  const [reorderingBrandId, setReorderingBrandId] = useState<string | null>(null);
  const [createState, createAction, createPending] = useActionState(
    async (prev: SettingsActionState, formData: FormData) => {
      const result = await createGasStationBrandAction(prev, formData);
      if (result.ok) {
        setShowAddForm(false);
        router.refresh();
      }
      return result;
    },
    initialState,
  );

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

  function handleExpandBrand(brandId: string) {
    setShowAddForm(false);
    setExpandedBrandId((current) => (current === brandId ? null : brandId));
  }

  function handleShowAddForm() {
    setExpandedBrandId(null);
    setShowAddForm((current) => !current);
  }

  return (
    <section className="app-card-muted p-6">
      <button
        type="button"
        onClick={() => setSectionExpanded((current) => !current)}
        className="flex w-full items-start gap-3 text-left"
        aria-expanded={sectionExpanded}
      >
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-medium text-slate-900 dark:text-slate-100">
            ガソリンスタンドブランド
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {sectionExpanded
              ? "給油記録のブランド選択肢と表示順を管理します。ブランドをタップすると編集画面が開きます。地図からの自動判定には「判定キーワード」を使います。"
              : `${orderedBrands.length}件のブランドを登録中`}
          </p>
        </div>
        <SectionExpandMark expanded={sectionExpanded} />
      </button>

      {sectionExpanded && (
        <div className="mt-4 space-y-4 border-t border-slate-200 pt-4 dark:border-slate-700">
          {reorderError && <p className="app-alert-error">{reorderError}</p>}

          <ul className="space-y-2">
            {orderedBrands.map((brand, index) => {
              const sortableIndex = sortableBrands.findIndex((item) => item.id === brand.id);

              return (
                <BrandRow
                  key={brand.id}
                  brand={brand}
                  expanded={expandedBrandId === brand.id}
                  onExpand={() => handleExpandBrand(brand.id)}
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

          <div>
            <button
              type="button"
              onClick={handleShowAddForm}
              className="app-btn-secondary w-full sm:w-auto"
              aria-expanded={showAddForm}
            >
              {showAddForm ? "追加フォームを閉じる" : "＋ ブランドを追加"}
            </button>

            {showAddForm && (
              <form
                action={createAction}
                className="mt-3 space-y-3 rounded-xl border border-slate-200 p-3 dark:border-slate-700"
              >
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
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function BrandRow({
  brand,
  expanded,
  onExpand,
  sortableIndex,
  sortableCount,
  isReordering,
  onMoveUp,
  onMoveDown,
  showOrderLabel,
  orderNumber,
}: {
  brand: GasStationBrandRecord;
  expanded: boolean;
  onExpand: () => void;
  sortableIndex: number;
  sortableCount: number;
  isReordering: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  showOrderLabel: boolean;
  orderNumber: number;
}) {
  const router = useRouter();
  const boundUpdate = updateGasStationBrandAction.bind(null, brand.id);
  const [updateState, updateAction, updatePending] = useActionState(
    async (prev: SettingsActionState, formData: FormData) => {
      const result = await boundUpdate(prev, formData);
      if (result.ok) {
        onExpand();
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

  function handleDeleteClick(event: MouseEvent) {
    event.stopPropagation();
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

  return (
    <li
      className={`rounded-xl border transition-colors ${
        expanded
          ? "border-blue-200 bg-blue-50/40 dark:border-blue-800 dark:bg-blue-950/20"
          : "border-slate-200 dark:border-slate-700"
      }`}
    >
      <div className="flex items-stretch gap-2 p-3">
        {!isOther && (
          <div className="flex shrink-0 flex-col justify-center gap-0.5">
            <button
              type="button"
              onClick={onMoveUp}
              disabled={!canMoveUp || isReordering}
              className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
              aria-label={`${brand.name}を上へ`}
            >
              ↑
            </button>
            <button
              type="button"
              onClick={onMoveDown}
              disabled={!canMoveDown || isReordering}
              className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
              aria-label={`${brand.name}を下へ`}
            >
              ↓
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={onExpand}
          className={`flex min-h-9 min-w-0 flex-1 items-start gap-2 rounded-lg text-left transition ${
            expanded
              ? ""
              : "cursor-pointer hover:bg-slate-50 active:bg-slate-100 dark:hover:bg-slate-800/60 dark:active:bg-slate-800"
          }`}
          aria-expanded={expanded}
          aria-label={`${brand.name}を${expanded ? "閉じる" : "編集する"}`}
        >
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
              <p className="mt-0.5 break-words text-xs text-slate-500">
                判定キーワード: {brand.matchKeywords}
              </p>
            )}
            {isOther && (
              <p className="mt-0.5 text-xs text-slate-500">
                一覧にないブランドを給油記録時に手入力するための項目です（常に最後に表示）。
              </p>
            )}
          </div>

          <ItemExpandMark expanded={expanded} />
        </button>
      </div>

      {expanded && (
        <form
          action={updateAction}
          className="space-y-3 border-t border-slate-200 px-3 pb-3 pt-2 dark:border-slate-700"
        >
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
          <div className="flex flex-wrap gap-2">
            <button type="submit" disabled={updatePending} className="app-btn-primary px-3 py-2">
              {updatePending ? "保存中..." : "保存"}
            </button>
            <button
              type="button"
              onClick={onExpand}
              className="app-btn-secondary px-3 py-2"
            >
              閉じる
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
          {confirmingDelete && (
            <DeleteConfirmPanel
              title={`ブランド「${brand.name}」を削除しますか？`}
              description="このブランドを削除します。既存の給油記録に紐づくブランド名は残ります。この操作は取り消せません。"
              deleting={deleting}
              error={deleteError}
              onCancel={handleDeleteCancel}
              onConfirm={handleDeleteConfirm}
            />
          )}
        </form>
      )}
    </li>
  );
}
