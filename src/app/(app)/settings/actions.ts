"use server";

import { revalidatePath } from "next/cache";

import { requireUserId } from "@/lib/auth-user";
import {
  createGasStationBrandForUser,
  deleteGasStationBrandForUser,
  reorderGasStationBrandsForUser,
  updateGasStationBrandForUser,
} from "@/lib/gas-station-brands";
import {
  deleteRegisteredGasStationForUser,
  setRegisteredGasStationHiddenForUser,
  updateRegisteredGasStationForUser,
} from "@/lib/registered-gas-stations";
import { MAX_GAS_STATION_BRAND_KEYWORDS_LENGTH } from "@/lib/fuel-constants";
import { deletePasskeysForUser } from "@/lib/passkey";

export type SettingsActionState = {
  ok: boolean;
  error?: string;
};

function parseKeywords(value: FormDataEntryValue | null): string | null {
  const text = String(value ?? "")
    .trim()
    .replace(/、/g, ",");

  if (!text) {
    return null;
  }

  if (text.length > MAX_GAS_STATION_BRAND_KEYWORDS_LENGTH) {
    return null;
  }

  return text;
}

export async function reorderGasStationBrandsAction(
  orderedBrandIds: string[],
): Promise<SettingsActionState> {
  try {
    const userId = await requireUserId();
    const result = await reorderGasStationBrandsForUser(userId, orderedBrandIds);

    if ("error" in result) {
      return { ok: false, error: result.error };
    }

    revalidatePath("/settings");
    revalidatePath("/fuel/new");
    revalidatePath("/fuel");

    return { ok: true };
  } catch {
    return { ok: false, error: "並び順の更新に失敗しました" };
  }
}

export async function createGasStationBrandAction(
  _prevState: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  try {
    const userId = await requireUserId();
    const result = await createGasStationBrandForUser(
      userId,
      String(formData.get("name") ?? ""),
      parseKeywords(formData.get("matchKeywords")),
    );

    if ("error" in result) {
      return { ok: false, error: result.error };
    }

    revalidatePath("/settings");
    revalidatePath("/fuel/new");
    revalidatePath("/fuel");

    return { ok: true };
  } catch {
    return { ok: false, error: "ブランドの追加に失敗しました" };
  }
}

export async function updateGasStationBrandAction(
  brandId: string,
  _prevState: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  try {
    const userId = await requireUserId();
    const result = await updateGasStationBrandForUser(userId, brandId, {
      name: String(formData.get("name") ?? ""),
      matchKeywords: parseKeywords(formData.get("matchKeywords")),
    });

    if ("error" in result) {
      return { ok: false, error: result.error };
    }

    revalidatePath("/settings");
    revalidatePath("/fuel/new");
    revalidatePath("/fuel");

    return { ok: true };
  } catch {
    return { ok: false, error: "ブランドの更新に失敗しました" };
  }
}

export async function deleteGasStationBrandAction(
  brandId: string,
): Promise<SettingsActionState> {
  try {
    const userId = await requireUserId();
    const result = await deleteGasStationBrandForUser(userId, brandId);

    if ("error" in result) {
      return { ok: false, error: result.error };
    }

    revalidatePath("/settings");
    revalidatePath("/fuel/new");
    revalidatePath("/fuel");

    return { ok: true };
  } catch {
    return { ok: false, error: "ブランドの削除に失敗しました" };
  }
}

function revalidateFuelPaths() {
  revalidatePath("/settings");
  revalidatePath("/fuel/new");
  revalidatePath("/fuel");
}

export async function updateRegisteredGasStationAction(
  stationId: string,
  _prevState: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  try {
    const userId = await requireUserId();
    const result = await updateRegisteredGasStationForUser(userId, stationId, {
      brandSelect: String(formData.get("gasStationBrands") ?? ""),
      customBrand: String(formData.get("gasStationBrandOther") ?? ""),
      storeName: String(formData.get("gasStationStoreName") ?? ""),
      hiddenFromPicker: formData.get("hiddenFromPicker") === "on",
    });

    if ("error" in result) {
      return { ok: false, error: result.error };
    }

    revalidateFuelPaths();
    return { ok: true };
  } catch {
    return { ok: false, error: "登録店舗の更新に失敗しました" };
  }
}

export async function setRegisteredGasStationHiddenAction(
  stationId: string,
  hiddenFromPicker: boolean,
): Promise<SettingsActionState> {
  try {
    const userId = await requireUserId();
    const result = await setRegisteredGasStationHiddenForUser(
      userId,
      stationId,
      hiddenFromPicker,
    );

    if ("error" in result) {
      return { ok: false, error: result.error };
    }

    revalidateFuelPaths();
    return { ok: true };
  } catch {
    return { ok: false, error: "表示設定の更新に失敗しました" };
  }
}

export async function deleteRegisteredGasStationAction(
  stationId: string,
): Promise<SettingsActionState> {
  try {
    const userId = await requireUserId();
    const result = await deleteRegisteredGasStationForUser(userId, stationId);

    if ("error" in result) {
      return { ok: false, error: result.error };
    }

    revalidateFuelPaths();
    return { ok: true };
  } catch {
    return { ok: false, error: "登録店舗の削除に失敗しました" };
  }
}

export async function deletePasskeysAction(): Promise<SettingsActionState> {
  try {
    const userId = await requireUserId();
    await deletePasskeysForUser(userId);

    revalidatePath("/settings");
    revalidatePath("/");

    return { ok: true };
  } catch {
    return { ok: false, error: "パスキーの削除に失敗しました" };
  }
}
