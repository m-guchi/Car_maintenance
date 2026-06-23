"use server";

import { revalidatePath } from "next/cache";

import { requireUserId } from "@/lib/auth-user";
import { MAX_ODOMETER } from "@/lib/fuel-constants";
import {
  MAX_MAINTENANCE_COST,
  MAX_MAINTENANCE_NOTES_LENGTH,
  MIN_MAINTENANCE_COST,
} from "@/lib/maintenance-constants";
import { ensureMaintenanceCategoriesForUser } from "@/lib/maintenance-categories";
import {
  createMaintenanceLog,
  deleteMaintenanceLog,
  deleteMaintenanceLogs,
  updateMaintenanceLog,
} from "@/lib/maintenance-logs";
import type { MaintenanceLogInput } from "@/lib/maintenance-types";
import { getVehicleForUser } from "@/lib/vehicles";

export type MaintenanceActionState = {
  ok: boolean;
  error?: string;
  resetToken?: number;
};

function parseDate(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();

  if (!text) {
    return { error: "実施日を入力してください" } as const;
  }

  const parsed = new Date(`${text}T12:00:00+09:00`);

  if (Number.isNaN(parsed.getTime())) {
    return { error: "実施日の形式が正しくありません" } as const;
  }

  return { value: parsed } as const;
}

function parseCategoryId(
  value: FormDataEntryValue | null,
  categoryIds: string[],
) {
  const text = String(value ?? "").trim();

  if (!text) {
    return { error: "カテゴリを選択してください" } as const;
  }

  if (!categoryIds.includes(text)) {
    return { error: "カテゴリの値が正しくありません" } as const;
  }

  return { value: text } as const;
}

function parseOdometer(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();

  if (!text) {
    return { error: "総走行距離を入力してください" } as const;
  }

  const parsed = Number.parseInt(text, 10);

  if (Number.isNaN(parsed) || parsed <= 0 || parsed > MAX_ODOMETER) {
    return {
      error: `総走行距離は1〜${MAX_ODOMETER.toLocaleString("ja-JP")}の整数で入力してください`,
    } as const;
  }

  return { value: parsed } as const;
}

function parseCost(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();

  if (!text) {
    return { error: "費用を入力してください" } as const;
  }

  const parsed = Number.parseInt(text, 10);

  if (
    Number.isNaN(parsed) ||
    parsed < MIN_MAINTENANCE_COST ||
    parsed > MAX_MAINTENANCE_COST
  ) {
    return {
      error: `費用は${MIN_MAINTENANCE_COST.toLocaleString("ja-JP")}〜${MAX_MAINTENANCE_COST.toLocaleString("ja-JP")}の整数で入力してください`,
    } as const;
  }

  return { value: parsed } as const;
}

function parseOptionalNotes(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();

  if (!text) {
    return { value: null } as const;
  }

  if (text.length > MAX_MAINTENANCE_NOTES_LENGTH) {
    return {
      error: `メモは${MAX_MAINTENANCE_NOTES_LENGTH}文字以内で入力してください`,
    } as const;
  }

  return { value: text } as const;
}

async function parseMaintenanceForm(userId: string, formData: FormData) {
  const categories = await ensureMaintenanceCategoriesForUser(userId);
  const categoryIds = categories.map((category) => category.id);

  const date = parseDate(formData.get("date"));
  if ("error" in date) {
    return { error: date.error } as const;
  }

  const categoryId = parseCategoryId(formData.get("categoryId"), categoryIds);
  if ("error" in categoryId) {
    return { error: categoryId.error } as const;
  }

  const odometer = parseOdometer(formData.get("odometer"));
  if ("error" in odometer) {
    return { error: odometer.error } as const;
  }

  const cost = parseCost(formData.get("cost"));
  if ("error" in cost) {
    return { error: cost.error } as const;
  }

  const notes = parseOptionalNotes(formData.get("notes"));
  if ("error" in notes) {
    return { error: notes.error } as const;
  }

  const data: MaintenanceLogInput = {
    date: date.value,
    categoryId: categoryId.value,
    odometer: odometer.value,
    cost: cost.value,
    notes: notes.value,
  };

  return { data } as const;
}

async function requireVehicleForUser(userId: string, vehicleId: string) {
  const vehicle = await getVehicleForUser(userId, vehicleId);

  if (!vehicle) {
    return { error: "車両が見つかりません" } as const;
  }

  return { vehicle } as const;
}

function revalidateMaintenancePaths() {
  revalidatePath("/maintenance");
  revalidatePath("/maintenance/new");
  revalidatePath("/");
}

export async function createMaintenanceLogAction(
  vehicleId: string,
  _prevState: MaintenanceActionState,
  formData: FormData,
): Promise<MaintenanceActionState> {
  try {
    const userId = await requireUserId();
    const vehicleResult = await requireVehicleForUser(userId, vehicleId);

    if ("error" in vehicleResult) {
      return { ok: false, error: vehicleResult.error };
    }

    const parsed = await parseMaintenanceForm(userId, formData);

    if ("error" in parsed) {
      return { ok: false, error: parsed.error };
    }

    const created = await createMaintenanceLog(userId, vehicleId, parsed.data);

    if (!created) {
      return { ok: false, error: "メンテナンス記録の登録に失敗しました" };
    }

    revalidateMaintenancePaths();

    return { ok: true, resetToken: Date.now() };
  } catch {
    return { ok: false, error: "メンテナンス記録の登録に失敗しました" };
  }
}

export async function updateMaintenanceLogAction(
  maintenanceLogId: string,
  _prevState: MaintenanceActionState,
  formData: FormData,
): Promise<MaintenanceActionState> {
  try {
    const userId = await requireUserId();
    const parsed = await parseMaintenanceForm(userId, formData);

    if ("error" in parsed) {
      return { ok: false, error: parsed.error };
    }

    const updated = await updateMaintenanceLog(userId, maintenanceLogId, parsed.data);

    if (!updated) {
      return { ok: false, error: "メンテナンス記録が見つかりません" };
    }

    revalidateMaintenancePaths();

    return { ok: true, resetToken: Date.now() };
  } catch {
    return { ok: false, error: "メンテナンス記録の更新に失敗しました" };
  }
}

export async function deleteMaintenanceLogAction(
  maintenanceLogId: string,
): Promise<MaintenanceActionState> {
  try {
    const userId = await requireUserId();
    const deleted = await deleteMaintenanceLog(userId, maintenanceLogId);

    if (!deleted) {
      return { ok: false, error: "メンテナンス記録が見つかりません" };
    }

    revalidateMaintenancePaths();

    return { ok: true, resetToken: Date.now() };
  } catch {
    return { ok: false, error: "メンテナンス記録の削除に失敗しました" };
  }
}

export async function deleteMaintenanceLogsAction(
  maintenanceLogIds: string[],
): Promise<MaintenanceActionState> {
  try {
    const userId = await requireUserId();

    if (!Array.isArray(maintenanceLogIds) || maintenanceLogIds.length === 0) {
      return { ok: false, error: "削除する記録を選択してください" };
    }

    const deletedCount = await deleteMaintenanceLogs(userId, maintenanceLogIds);

    if (deletedCount === 0) {
      return { ok: false, error: "メンテナンス記録が見つかりません" };
    }

    revalidateMaintenancePaths();

    return { ok: true, resetToken: Date.now() };
  } catch {
    return { ok: false, error: "メンテナンス記録の削除に失敗しました" };
  }
}
