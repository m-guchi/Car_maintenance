"use server";

import { revalidatePath } from "next/cache";

import { requireUserId } from "@/lib/auth-user";
import {
  GAS_STATION_BRAND_VALUES,
  MAX_DISTANCE_KM,
  MAX_FUEL_AMOUNT,
  MAX_GAS_STATION_NAME_LENGTH,
  MAX_ODOMETER,
  MAX_PRICE_PER_LITER,
  MAX_TOTAL_COST,
  MIN_DISTANCE_KM,
} from "@/lib/fuel-constants";
import {
  createFuelLog,
  deleteFuelLog,
  updateFuelLog,
  type FuelLogInput,
} from "@/lib/fuel-logs";
import { getVehicleForUser } from "@/lib/vehicles";

export type FuelActionState = {
  ok: boolean;
  error?: string;
  resetToken?: number;
};

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

function parseDate(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();

  if (!text) {
    return { error: "給油日を入力してください" } as const;
  }

  const parsed = new Date(`${text}T12:00:00+09:00`);

  if (Number.isNaN(parsed.getTime())) {
    return { error: "給油日の形式が正しくありません" } as const;
  }

  return { value: parsed } as const;
}

function parseDistanceKm(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();

  if (!text) {
    return { error: "前回給油からの距離を入力してください" } as const;
  }

  const parsed = Number.parseFloat(text);

  if (
    Number.isNaN(parsed) ||
    parsed < MIN_DISTANCE_KM ||
    parsed > MAX_DISTANCE_KM ||
    !/^\d+(\.\d{1,2})?$/.test(text)
  ) {
    return {
      error: `前回給油からの距離は${MIN_DISTANCE_KM}〜${MAX_DISTANCE_KM.toLocaleString("ja-JP")}の数値で入力してください（小数点2桁まで）`,
    } as const;
  }

  return { value: parsed } as const;
}

function parseOptionalOdometer(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();

  if (!text) {
    return { value: null } as const;
  }

  const parsed = Number.parseInt(text, 10);

  if (Number.isNaN(parsed) || parsed <= 0 || parsed > MAX_ODOMETER) {
    return {
      error: `オドメーターは1〜${MAX_ODOMETER.toLocaleString("ja-JP")}の整数で入力してください`,
    } as const;
  }

  return { value: parsed } as const;
}

function parseFuelAmount(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();

  if (!text) {
    return { error: "給油量を入力してください" } as const;
  }

  const parsed = Number.parseFloat(text);

  if (
    Number.isNaN(parsed) ||
    parsed <= 0 ||
    parsed > MAX_FUEL_AMOUNT ||
    !/^\d+(\.\d{1,2})?$/.test(text)
  ) {
    return {
      error: `給油量は0.01〜${MAX_FUEL_AMOUNT}の数値で入力してください`,
    } as const;
  }

  return { value: parsed } as const;
}

function parsePricePerLiter(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();

  if (!text) {
    return { error: "単価を入力してください" } as const;
  }

  const parsed = Number.parseInt(text, 10);

  if (Number.isNaN(parsed) || parsed <= 0 || parsed > MAX_PRICE_PER_LITER) {
    return {
      error: `単価は1〜${MAX_PRICE_PER_LITER}の整数で入力してください`,
    } as const;
  }

  return { value: parsed } as const;
}

function parseTotalCost(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();

  if (!text) {
    return { error: "合計金額を入力してください" } as const;
  }

  const parsed = Number.parseInt(text, 10);

  if (Number.isNaN(parsed) || parsed <= 0 || parsed > MAX_TOTAL_COST) {
    return {
      error: `合計金額は1〜${MAX_TOTAL_COST.toLocaleString("ja-JP")}の整数で入力してください`,
    } as const;
  }

  return { value: parsed } as const;
}

function parseGasStationBrand(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();

  if (!text) {
    return { value: null } as const;
  }

  if (!(GAS_STATION_BRAND_VALUES as readonly string[]).includes(text)) {
    return { error: "ガソリンスタンドブランドの値が正しくありません" } as const;
  }

  return { value: text } as const;
}

function parseFuelForm(formData: FormData) {
  const date = parseDate(formData.get("date"));
  if ("error" in date) {
    return { error: date.error } as const;
  }

  const distanceKm = parseDistanceKm(formData.get("distanceKm"));
  if ("error" in distanceKm) {
    return { error: distanceKm.error } as const;
  }

  const odometer = parseOptionalOdometer(formData.get("odometer"));
  if ("error" in odometer) {
    return { error: odometer.error } as const;
  }

  const fuelAmount = parseFuelAmount(formData.get("fuelAmount"));
  if ("error" in fuelAmount) {
    return { error: fuelAmount.error } as const;
  }

  const pricePerLiter = parsePricePerLiter(formData.get("pricePerLiter"));
  if ("error" in pricePerLiter) {
    return { error: pricePerLiter.error } as const;
  }

  const totalCost = parseTotalCost(formData.get("totalCost"));
  if ("error" in totalCost) {
    return { error: totalCost.error } as const;
  }

  const gasStationName = parseOptionalText(
    formData.get("gasStationName"),
    "スタンド名",
    MAX_GAS_STATION_NAME_LENGTH,
  );
  if ("error" in gasStationName) {
    return { error: gasStationName.error } as const;
  }

  const gasStationBrands = parseGasStationBrand(formData.get("gasStationBrands"));
  if ("error" in gasStationBrands) {
    return { error: gasStationBrands.error } as const;
  }

  const data: FuelLogInput = {
    date: date.value,
    distanceKm: distanceKm.value,
    odometer: odometer.value,
    fuelAmount: fuelAmount.value,
    pricePerLiter: pricePerLiter.value,
    totalCost: totalCost.value,
    isFull: formData.get("isFull") === "on",
    gasStationName: gasStationName.value,
    gasStationBrands: gasStationBrands.value,
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

export async function createFuelLogAction(
  vehicleId: string,
  _prevState: FuelActionState,
  formData: FormData,
): Promise<FuelActionState> {
  try {
    const userId = await requireUserId();
    const vehicleResult = await requireVehicleForUser(userId, vehicleId);

    if ("error" in vehicleResult) {
      return { ok: false, error: vehicleResult.error };
    }

    const parsed = parseFuelForm(formData);

    if ("error" in parsed) {
      return { ok: false, error: parsed.error };
    }

    const created = await createFuelLog(userId, vehicleId, parsed.data);

    if (!created) {
      return { ok: false, error: "給油記録の登録に失敗しました" };
    }

    revalidatePath("/fuel");
    revalidatePath("/");

    return { ok: true, resetToken: Date.now() };
  } catch {
    return { ok: false, error: "給油記録の登録に失敗しました" };
  }
}

export async function updateFuelLogAction(
  fuelLogId: string,
  _prevState: FuelActionState,
  formData: FormData,
): Promise<FuelActionState> {
  try {
    const userId = await requireUserId();
    const parsed = parseFuelForm(formData);

    if ("error" in parsed) {
      return { ok: false, error: parsed.error };
    }

    const updated = await updateFuelLog(userId, fuelLogId, parsed.data);

    if (!updated) {
      return { ok: false, error: "給油記録が見つかりません" };
    }

    revalidatePath("/fuel");
    revalidatePath("/");

    return { ok: true, resetToken: Date.now() };
  } catch {
    return { ok: false, error: "給油記録の更新に失敗しました" };
  }
}

export async function deleteFuelLogAction(
  fuelLogId: string,
): Promise<FuelActionState> {
  try {
    const userId = await requireUserId();
    const deleted = await deleteFuelLog(userId, fuelLogId);

    if (!deleted) {
      return { ok: false, error: "給油記録が見つかりません" };
    }

    revalidatePath("/fuel");
    revalidatePath("/");

    return { ok: true, resetToken: Date.now() };
  } catch {
    return { ok: false, error: "給油記録の削除に失敗しました" };
  }
}
