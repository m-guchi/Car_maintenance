"use server";

import type { DriveType, FuelType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUserId } from "@/lib/auth-user";
import {
  DRIVE_TYPE_VALUES,
  FUEL_TYPE_VALUES,
} from "@/lib/vehicle-constants";
import {
  createVehicle,
  deleteVehicle,
  updateVehicle,
  type VehicleInput,
} from "@/lib/vehicles";

export type VehicleActionState = {
  ok: boolean;
  error?: string;
};

const MAX_TEXT_LENGTH = 100;
const MAX_MODEL_CODE_LENGTH = 50;
const MAX_LICENSE_PLATE_LENGTH = 20;
const MAX_ODOMETER = 9_999_999;
const MAX_DISPLACEMENT = 99_999;

function parseOptionalText(
  value: FormDataEntryValue | null,
  fieldLabel: string,
  maxLength: number,
) {
  const text = String(value ?? "").trim();

  if (!text) {
    return { value: null } as const;
  }

  if (text.length > maxLength) {
    return {
      error: `${fieldLabel}は${maxLength}文字以内で入力してください`,
    } as const;
  }

  return { value: text } as const;
}

function parseOptionalDate(
  value: FormDataEntryValue | null,
  fieldLabel: string,
  mode: "date" | "month",
) {
  const text = String(value ?? "").trim();

  if (!text) {
    return { value: null } as const;
  }

  const normalized =
    mode === "month" ? `${text}-01T12:00:00+09:00` : `${text}T12:00:00+09:00`;
  const parsed = new Date(normalized);

  if (Number.isNaN(parsed.getTime())) {
    return { error: `${fieldLabel}の形式が正しくありません` } as const;
  }

  return { value: parsed } as const;
}

function parseOptionalEnum<T extends string>(
  value: FormDataEntryValue | null,
  allowedValues: readonly T[],
  fieldLabel: string,
) {
  const text = String(value ?? "").trim();

  if (!text) {
    return { value: null } as const;
  }

  if (!allowedValues.includes(text as T)) {
    return { error: `${fieldLabel}の値が正しくありません` } as const;
  }

  return { value: text as T } as const;
}

function parseOptionalInt(
  value: FormDataEntryValue | null,
  fieldLabel: string,
  max: number,
) {
  const text = String(value ?? "").trim();

  if (!text) {
    return { value: null } as const;
  }

  const parsed = Number.parseInt(text, 10);

  if (Number.isNaN(parsed) || parsed < 0 || parsed > max) {
    return {
      error: `${fieldLabel}は0〜${max.toLocaleString("ja-JP")}の整数で入力してください`,
    } as const;
  }

  return { value: parsed } as const;
}

function parseVehicleForm(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const isActive = formData.get("isActive") === "on";

  if (!name) {
    return { error: "車両名を入力してください" } as const;
  }

  if (name.length > MAX_TEXT_LENGTH) {
    return {
      error: `車両名は${MAX_TEXT_LENGTH}文字以内で入力してください`,
    } as const;
  }

  const manufacturer = parseOptionalText(
    formData.get("manufacturer"),
    "メーカー名",
    MAX_TEXT_LENGTH,
  );
  if ("error" in manufacturer) {
    return { error: manufacturer.error } as const;
  }

  const modelName = parseOptionalText(
    formData.get("modelName"),
    "車種名",
    MAX_TEXT_LENGTH,
  );
  if ("error" in modelName) {
    return { error: modelName.error } as const;
  }

  const modelCode = parseOptionalText(
    formData.get("modelCode"),
    "型式",
    MAX_MODEL_CODE_LENGTH,
  );
  if ("error" in modelCode) {
    return { error: modelCode.error } as const;
  }

  const fuelType = parseOptionalEnum(
    formData.get("fuelType"),
    FUEL_TYPE_VALUES,
    "燃料種別",
  );
  if ("error" in fuelType) {
    return { error: fuelType.error } as const;
  }

  const inspectionExpiry = parseOptionalDate(
    formData.get("inspectionExpiry"),
    "車検満了日",
    "date",
  );
  if ("error" in inspectionExpiry) {
    return { error: inspectionExpiry.error } as const;
  }

  const licensePlate = parseOptionalText(
    formData.get("licensePlate"),
    "ナンバープレート",
    MAX_LICENSE_PLATE_LENGTH,
  );
  if ("error" in licensePlate) {
    return { error: licensePlate.error } as const;
  }

  const firstRegistrationDate = parseOptionalDate(
    formData.get("firstRegistrationDate"),
    "初度登録年月",
    "month",
  );
  if ("error" in firstRegistrationDate) {
    return { error: firstRegistrationDate.error } as const;
  }

  const initialOdometer = parseOptionalInt(
    formData.get("initialOdometer"),
    "登録時走行距離",
    MAX_ODOMETER,
  );
  if ("error" in initialOdometer) {
    return { error: initialOdometer.error } as const;
  }

  const displacement = parseOptionalInt(
    formData.get("displacement"),
    "排気量",
    MAX_DISPLACEMENT,
  );
  if ("error" in displacement) {
    return { error: displacement.error } as const;
  }

  if (displacement.value !== null && displacement.value === 0) {
    return { error: "排気量は1以上で入力してください" } as const;
  }

  const driveType = parseOptionalEnum(
    formData.get("driveType"),
    DRIVE_TYPE_VALUES,
    "駆動方式",
  );
  if ("error" in driveType) {
    return { error: driveType.error } as const;
  }

  const data: VehicleInput = {
    name,
    manufacturer: manufacturer.value,
    modelName: modelName.value,
    modelCode: modelCode.value,
    fuelType: fuelType.value as FuelType | null,
    inspectionExpiry: inspectionExpiry.value,
    licensePlate: licensePlate.value,
    firstRegistrationDate: firstRegistrationDate.value,
    initialOdometer: initialOdometer.value,
    displacement: displacement.value,
    driveType: driveType.value as DriveType | null,
    isActive,
  };

  return { data } as const;
}

function revalidateVehiclePaths(vehicleId?: string) {
  revalidatePath("/vehicles");
  revalidatePath("/");
  revalidatePath("/fuel");
  revalidatePath("/fuel/new");

  if (vehicleId) {
    revalidatePath(`/vehicles/${vehicleId}`);
    revalidatePath(`/vehicles/${vehicleId}/edit`);
  }
}

export async function createVehicleAction(
  _prevState: VehicleActionState,
  formData: FormData,
): Promise<VehicleActionState> {
  try {
    const userId = await requireUserId();
    const parsed = parseVehicleForm(formData);

    if ("error" in parsed) {
      return { ok: false, error: parsed.error };
    }

    await createVehicle(userId, parsed.data);
    revalidateVehiclePaths();

    return { ok: true };
  } catch {
    return { ok: false, error: "車両の登録に失敗しました" };
  }
}

export async function updateVehicleAction(
  vehicleId: string,
  _prevState: VehicleActionState,
  formData: FormData,
): Promise<VehicleActionState> {
  try {
    const userId = await requireUserId();
    const parsed = parseVehicleForm(formData);

    if ("error" in parsed) {
      return { ok: false, error: parsed.error };
    }

    const updated = await updateVehicle(userId, vehicleId, parsed.data);

    if (!updated) {
      return { ok: false, error: "車両が見つかりません" };
    }

    revalidateVehiclePaths(vehicleId);

    redirect(`/vehicles/${vehicleId}`);
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    return { ok: false, error: "車両の更新に失敗しました" };
  }
}

function isRedirectError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest?: string }).digest === "string" &&
    (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}

export async function deleteVehicleAction(
  vehicleId: string,
): Promise<VehicleActionState> {
  try {
    const userId = await requireUserId();
    const deleted = await deleteVehicle(userId, vehicleId);

    if (!deleted) {
      return { ok: false, error: "車両が見つかりません" };
    }

    revalidateVehiclePaths(vehicleId);

    return { ok: true };
  } catch {
    return { ok: false, error: "車両の削除に失敗しました" };
  }
}

export async function deleteVehicleAndRedirectAction(
  vehicleId: string,
): Promise<VehicleActionState> {
  try {
    const result = await deleteVehicleAction(vehicleId);

    if (!result.ok) {
      return result;
    }

    redirect("/vehicles");
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    return { ok: false, error: "車両の削除に失敗しました" };
  }
}
