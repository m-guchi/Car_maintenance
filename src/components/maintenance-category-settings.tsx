"use client";

import { useRouter } from "next/navigation";
import { useActionState, useState, type MouseEvent } from "react";

import {
  createMaintenanceCategoryAction,
  deleteMaintenanceCategoryAction,
  reorderMaintenanceCategoriesAction,
  updateMaintenanceCategoryAction,
  type SettingsActionState,
} from "@/app/(app)/settings/actions";
import { DeleteConfirmPanel } from "@/components/delete-confirm-panel";
import { MAX_MAINTENANCE_CATEGORY_NAME_LENGTH } from "@/lib/maintenance-constants";
import type { MaintenanceCategoryRecord } from "@/lib/maintenance-category-types";

const initialState: SettingsActionState = { ok: false };

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

type MaintenanceCategorySettingsProps = {
  categories: MaintenanceCategoryRecord[];
  logCountByCategoryId: Record<string, number>;
};

function sortCategoryList(
  categories: MaintenanceCategoryRecord[],
): MaintenanceCategoryRecord[] {
  return [...categories].sort(
    (left, right) =>
      left.displayOrder - right.displayOrder || left.name.localeCompare(right.name, "ja"),
  );
}

export function MaintenanceCategorySettings({
  categories,
  logCountByCategoryId,
}: MaintenanceCategorySettingsProps) {
  const router = useRouter();
  const [sectionExpanded, setSectionExpanded] = useState(false);
  const [orderedCategories, setOrderedCategories] = useState(() =>
    sortCategoryList(categories),
  );
  const [syncedCategories, setSyncedCategories] = useState(categories);
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  if (categories !== syncedCategories) {
    setSyncedCategories(categories);
    setOrderedCategories(sortCategoryList(categories));
  }

  const [reorderError, setReorderError] = useState<string | null>(null);
  const [reorderingCategoryId, setReorderingCategoryId] = useState<string | null>(null);
  const [createState, createAction, createPending] = useActionState(
    async (prev: SettingsActionState, formData: FormData) => {
      const result = await createMaintenanceCategoryAction(prev, formData);
      if (result.ok) {
        setShowAddForm(false);
        router.refresh();
      }
      return result;
    },
    initialState,
  );

  async function handleMove(categoryId: string, direction: "up" | "down") {
    const currentIndex = orderedCategories.findIndex(
      (category) => category.id === categoryId,
    );

    if (currentIndex === -1) {
      return;
    }

    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

    if (targetIndex < 0 || targetIndex >= orderedCategories.length) {
      return;
    }

    const nextOrdered = [...orderedCategories];
    [nextOrdered[currentIndex], nextOrdered[targetIndex]] = [
      nextOrdered[targetIndex],
      nextOrdered[currentIndex],
    ];

    setReorderingCategoryId(categoryId);
    setReorderError(null);

    const result = await reorderMaintenanceCategoriesAction(
      nextOrdered.map((category) => category.id),
    );

    if (!result.ok) {
      setReorderError(result.error ?? "並び順の更新に失敗しました");
      setReorderingCategoryId(null);
      return;
    }

    setOrderedCategories(nextOrdered);
    setReorderingCategoryId(null);
    router.refresh();
  }

  function handleExpandCategory(categoryId: string) {
    setShowAddForm(false);
    setExpandedCategoryId((current) => (current === categoryId ? null : categoryId));
  }

  function handleShowAddForm() {
    setExpandedCategoryId(null);
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
            メンテナンスカテゴリ
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {sectionExpanded
              ? "整備記録のカテゴリ選択肢・表示順・交換・整備間隔（km / 日）を管理します。"
              : `${orderedCategories.length}件のカテゴリを登録中`}
          </p>
        </div>
        <SectionExpandMark expanded={sectionExpanded} />
      </button>

      {sectionExpanded && (
        <div className="mt-4 space-y-4 border-t border-slate-200 pt-4 dark:border-slate-700">
          {reorderError && <p className="app-alert-error">{reorderError}</p>}

          <ul className="space-y-2">
            {orderedCategories.map((category, index) => (
              <CategoryRow
                key={category.id}
                category={category}
                expanded={expandedCategoryId === category.id}
                onExpand={() => handleExpandCategory(category.id)}
                sortableIndex={index}
                sortableCount={orderedCategories.length}
                isReordering={reorderingCategoryId === category.id}
                onMoveUp={() => handleMove(category.id, "up")}
                onMoveDown={() => handleMove(category.id, "down")}
                orderNumber={index + 1}
                logCount={logCountByCategoryId[category.id] ?? 0}
              />
            ))}
          </ul>

          <div>
            <button
              type="button"
              onClick={handleShowAddForm}
              className="app-btn-secondary w-full sm:w-auto"
              aria-expanded={showAddForm}
            >
              {showAddForm ? "追加フォームを閉じる" : "＋ カテゴリを追加"}
            </button>

            {showAddForm && (
              <form
                action={createAction}
                className="mt-3 space-y-3 rounded-xl border border-slate-200 p-3 dark:border-slate-700"
              >
                <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  カテゴリを追加
                </h3>
                <div>
                  <label htmlFor="new-category-name" className="app-label">
                    カテゴリ名
                  </label>
                  <input
                    id="new-category-name"
                    name="name"
                    type="text"
                    required
                    maxLength={MAX_MAINTENANCE_CATEGORY_NAME_LENGTH}
                    placeholder="例: バッテリー交換"
                    className="app-input"
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor="new-category-interval-km" className="app-label">
                      交換・整備間隔（km）
                    </label>
                    <input
                      id="new-category-interval-km"
                      name="intervalKm"
                      type="number"
                      inputMode="numeric"
                      min={1}
                      step={1}
                      placeholder="例: 5000"
                      className="app-input"
                    />
                  </div>
                  <div>
                    <label htmlFor="new-category-interval-days" className="app-label">
                      交換・整備間隔（日）
                    </label>
                    <input
                      id="new-category-interval-days"
                      name="intervalDays"
                      type="number"
                      inputMode="numeric"
                      min={1}
                      step={1}
                      placeholder="例: 365"
                      className="app-input"
                    />
                  </div>
                </div>
                <p className="text-xs text-slate-500">
                  間隔は km・日のいずれかまたは両方を登録できます。空欄の項目は使いません。
                </p>
                {createState.error && <p className="app-alert-error">{createState.error}</p>}
                {createState.ok && <p className="app-alert-success">カテゴリを追加しました</p>}
                <button type="submit" disabled={createPending} className="app-btn-primary">
                  {createPending ? "追加中..." : "カテゴリを追加"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function CategoryRow({
  category,
  expanded,
  onExpand,
  sortableIndex,
  sortableCount,
  isReordering,
  onMoveUp,
  onMoveDown,
  orderNumber,
  logCount,
}: {
  category: MaintenanceCategoryRecord;
  expanded: boolean;
  onExpand: () => void;
  sortableIndex: number;
  sortableCount: number;
  isReordering: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  orderNumber: number;
  logCount: number;
}) {
  const router = useRouter();
  const boundUpdate = updateMaintenanceCategoryAction.bind(null, category.id);
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
  const canMoveUp = sortableIndex > 0;
  const canMoveDown = sortableIndex < sortableCount - 1;

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

    const result = await deleteMaintenanceCategoryAction(category.id);

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
        <div className="flex shrink-0 flex-col justify-center gap-0.5">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={!canMoveUp || isReordering}
            className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
            aria-label={`${category.name}を上へ`}
          >
            ↑
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={!canMoveDown || isReordering}
            className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
            aria-label={`${category.name}を下へ`}
          >
            ↓
          </button>
        </div>

        <button
          type="button"
          onClick={onExpand}
          className={`flex min-h-9 min-w-0 flex-1 items-start gap-2 rounded-lg text-left transition ${
            expanded
              ? ""
              : "cursor-pointer hover:bg-slate-50 active:bg-slate-100 dark:hover:bg-slate-800/60 dark:active:bg-slate-800"
          }`}
          aria-expanded={expanded}
          aria-label={`${category.name}を${expanded ? "閉じる" : "編集する"}`}
        >
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {orderNumber}
              </span>
              <p className="font-medium text-slate-900 dark:text-slate-100">{category.name}</p>
            </div>
            {logCount > 0 && (
              <p className="mt-0.5 text-xs text-slate-500">
                記録 {logCount}件
              </p>
            )}
            {(category.intervalKm != null || category.intervalDays != null) && (
              <p className="mt-0.5 text-xs text-slate-500">
                {category.intervalKm != null && `${category.intervalKm.toLocaleString("ja-JP")} km`}
                {category.intervalKm != null && category.intervalDays != null && " · "}
                {category.intervalDays != null && `${category.intervalDays.toLocaleString("ja-JP")} 日`}
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
          <div>
            <label htmlFor={`category-name-${category.id}`} className="app-label">
              カテゴリ名
            </label>
            <input
              id={`category-name-${category.id}`}
              name="name"
              type="text"
              required
              maxLength={MAX_MAINTENANCE_CATEGORY_NAME_LENGTH}
              defaultValue={category.name}
              className="app-input"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor={`category-interval-km-${category.id}`} className="app-label">
                交換・整備間隔（km）
              </label>
              <input
                id={`category-interval-km-${category.id}`}
                name="intervalKm"
                type="number"
                inputMode="numeric"
                min={1}
                step={1}
                placeholder="例: 5000"
                defaultValue={category.intervalKm ?? ""}
                className="app-input"
              />
            </div>
            <div>
              <label htmlFor={`category-interval-days-${category.id}`} className="app-label">
                交換・整備間隔（日）
              </label>
              <input
                id={`category-interval-days-${category.id}`}
                name="intervalDays"
                type="number"
                inputMode="numeric"
                min={1}
                step={1}
                placeholder="例: 365"
                defaultValue={category.intervalDays ?? ""}
                className="app-input"
              />
            </div>
          </div>
          <p className="text-xs text-slate-500">
            間隔は km・日のいずれかまたは両方を登録できます。空欄にすると未設定になります。
          </p>
          {updateState.error && <p className="app-alert-error">{updateState.error}</p>}
          <div className="flex flex-wrap gap-2">
            <button type="submit" disabled={updatePending} className="app-btn-primary px-3 py-2">
              {updatePending ? "保存中..." : "保存"}
            </button>
            <button type="button" onClick={onExpand} className="app-btn-secondary px-3 py-2">
              閉じる
            </button>
            {!confirmingDelete && (
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
              title={`カテゴリ「${category.name}」を削除しますか？`}
              description={
                logCount > 0
                  ? `このカテゴリに紐づく整備記録 ${logCount}件もすべて削除されます。この操作は取り消せません。`
                  : "このカテゴリを削除します。この操作は取り消せません。"
              }
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
