import { prisma } from "@/lib/prisma";
import {
  OTHER_GAS_STATION_BRAND_NAME,
  validateGasStationBrandName,
  type GasStationBrandRecord,
} from "@/lib/gas-station-brand-types";
import { ensureGasStationBrandsForUser } from "@/lib/gas-station-brands";
import {
  MAX_GAS_STATION_NAME_LENGTH,
  MAX_GAS_STATION_STORE_NAME_LENGTH,
} from "@/lib/fuel-constants";
import {
  composeGasStationRegistrationName,
  type KnownGasStation,
} from "@/lib/gas-stations";
import type { RegisteredGasStationRecord } from "@/lib/registered-gas-station-types";

export type { RegisteredGasStationRecord } from "@/lib/registered-gas-station-types";

function toRecord(station: {
  id: string;
  osmId: string | null;
  registeredName: string;
  brand: string | null;
  hiddenFromPicker: boolean;
  displayOrder: number;
}): RegisteredGasStationRecord {
  return {
    id: station.id,
    osmId: station.osmId,
    registeredName: station.registeredName,
    brand: station.brand,
    hiddenFromPicker: station.hiddenFromPicker,
    displayOrder: station.displayOrder,
  };
}

function toKnownGasStation(station: RegisteredGasStationRecord): KnownGasStation {
  return {
    id: station.id,
    osmId: station.osmId,
    registeredName: station.registeredName,
    brand: station.brand,
  };
}

export async function listRegisteredGasStationsForUser(
  userId: string,
): Promise<RegisteredGasStationRecord[]> {
  const stations = await prisma.registeredGasStation.findMany({
    where: { userId },
    orderBy: [{ displayOrder: "asc" }, { registeredName: "asc" }],
  });

  return stations.map(toRecord);
}

export async function listKnownGasStationsForUser(
  userId: string,
): Promise<KnownGasStation[]> {
  const stations = await listRegisteredGasStationsForUser(userId);
  return stations.map(toKnownGasStation);
}

export async function listPickerGasStationsForUser(
  userId: string,
): Promise<KnownGasStation[]> {
  const stations = await listRegisteredGasStationsForUser(userId);
  return stations
    .filter((station) => !station.hiddenFromPicker)
    .map(toKnownGasStation);
}

async function getNextDisplayOrder(userId: string): Promise<number> {
  const last = await prisma.registeredGasStation.findFirst({
    where: { userId },
    orderBy: { displayOrder: "desc" },
    select: { displayOrder: true },
  });

  return (last?.displayOrder ?? -1) + 1;
}

export async function syncRegisteredGasStationsFromFuelLogs(userId: string) {
  const logs = await prisma.fuelLog.findMany({
    where: {
      vehicle: { userId },
      gasStationName: { not: null },
    },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    select: {
      gasStationOsmId: true,
      gasStationName: true,
      gasStationBrands: true,
    },
  });

  const seenOsmIds = new Set<string>();
  const seenManualNames = new Set<string>();

  for (const log of logs) {
    const registeredName = log.gasStationName?.trim();

    if (!registeredName) {
      continue;
    }

    if (log.gasStationOsmId) {
      if (seenOsmIds.has(log.gasStationOsmId)) {
        continue;
      }

      seenOsmIds.add(log.gasStationOsmId);

      await prisma.registeredGasStation.upsert({
        where: {
          userId_osmId: {
            userId,
            osmId: log.gasStationOsmId,
          },
        },
        create: {
          userId,
          osmId: log.gasStationOsmId,
          registeredName,
          brand: log.gasStationBrands,
          displayOrder: await getNextDisplayOrder(userId),
        },
        update: {},
      });

      continue;
    }

    if (seenManualNames.has(registeredName)) {
      continue;
    }

    seenManualNames.add(registeredName);

    await prisma.registeredGasStation.upsert({
      where: {
        userId_registeredName: {
          userId,
          registeredName,
        },
      },
      create: {
        userId,
        registeredName,
        brand: log.gasStationBrands,
        displayOrder: await getNextDisplayOrder(userId),
      },
      update: {},
    });
  }
}

export async function ensureRegisteredGasStationsForUser(
  userId: string,
): Promise<RegisteredGasStationRecord[]> {
  await syncRegisteredGasStationsFromFuelLogs(userId);
  return listRegisteredGasStationsForUser(userId);
}

export async function upsertRegisteredGasStationFromFuelLog(
  userId: string,
  input: {
    registeredName: string;
    brand: string;
    osmId?: string | null;
  },
) {
  const registeredName = input.registeredName.trim();
  const brand = input.brand.trim();

  if (!registeredName || !brand) {
    return;
  }

  if (input.osmId) {
    await prisma.registeredGasStation.upsert({
      where: {
        userId_osmId: {
          userId,
          osmId: input.osmId,
        },
      },
      create: {
        userId,
        osmId: input.osmId,
        registeredName,
        brand,
        displayOrder: await getNextDisplayOrder(userId),
      },
      update: {
        registeredName,
        brand,
      },
    });

    return;
  }

  const existing = await prisma.registeredGasStation.findFirst({
    where: {
      userId,
      osmId: null,
      registeredName,
    },
  });

  if (existing) {
    await prisma.registeredGasStation.update({
      where: { id: existing.id },
      data: { brand },
    });
    return;
  }

  await prisma.registeredGasStation.create({
    data: {
      userId,
      registeredName,
      brand,
      displayOrder: await getNextDisplayOrder(userId),
    },
  });
}

export async function updateRegisteredGasStationForUser(
  userId: string,
  stationId: string,
  input: {
    brandSelect: string;
    customBrand?: string;
    storeName: string;
    hiddenFromPicker?: boolean;
  },
) {
  const existing = await prisma.registeredGasStation.findFirst({
    where: { id: stationId, userId },
  });

  if (!existing) {
    return { error: "登録店舗が見つかりません" } as const;
  }

  const brands = await ensureGasStationBrandsForUser(userId);
  const brandNames = new Set(brands.map((brand) => brand.name));

  let effectiveBrand = input.brandSelect.trim();

  if (!effectiveBrand) {
    return { error: "ブランドを選択してください" } as const;
  }

  if (!brandNames.has(effectiveBrand)) {
    return { error: "ガソリンスタンドブランドの値が正しくありません" } as const;
  }

  if (effectiveBrand === OTHER_GAS_STATION_BRAND_NAME) {
    const customBrand = input.customBrand?.trim() ?? "";
    const customError = validateGasStationBrandName(customBrand);

    if (customError) {
      return { error: customError } as const;
    }

    effectiveBrand = customBrand;
  }

  const storeName = input.storeName.trim();

  if (!storeName) {
    return { error: "店舗名を入力してください" } as const;
  }

  if (storeName.length > MAX_GAS_STATION_STORE_NAME_LENGTH) {
    return {
      error: `店舗名は${MAX_GAS_STATION_STORE_NAME_LENGTH}文字以内で入力してください`,
    } as const;
  }

  const nextRegisteredName = composeGasStationRegistrationName(
    effectiveBrand,
    storeName,
  );

  if (nextRegisteredName.length > MAX_GAS_STATION_NAME_LENGTH) {
    return {
      error: `登録名は${MAX_GAS_STATION_NAME_LENGTH}文字以内にしてください`,
    } as const;
  }

  if (
    nextRegisteredName !== existing.registeredName &&
    (await prisma.registeredGasStation.findFirst({
      where: {
        userId,
        registeredName: nextRegisteredName,
        NOT: { id: stationId },
      },
    }))
  ) {
    return { error: "同じ登録名の店舗が既にあります" } as const;
  }

  const updated = await prisma.registeredGasStation.update({
    where: { id: stationId },
    data: {
      registeredName: nextRegisteredName,
      brand: effectiveBrand,
      hiddenFromPicker: input.hiddenFromPicker ?? existing.hiddenFromPicker,
    },
  });

  await prisma.fuelLog.updateMany({
    where: {
      vehicle: { userId },
      ...(existing.osmId
        ? { gasStationOsmId: existing.osmId }
        : {
            gasStationOsmId: null,
            gasStationName: existing.registeredName,
          }),
    },
    data: {
      gasStationName: nextRegisteredName,
      gasStationBrands: effectiveBrand,
    },
  });

  return { station: toRecord(updated) } as const;
}

export async function setRegisteredGasStationHiddenForUser(
  userId: string,
  stationId: string,
  hiddenFromPicker: boolean,
) {
  const existing = await prisma.registeredGasStation.findFirst({
    where: { id: stationId, userId },
  });

  if (!existing) {
    return { error: "登録店舗が見つかりません" } as const;
  }

  const updated = await prisma.registeredGasStation.update({
    where: { id: stationId },
    data: { hiddenFromPicker },
  });

  return { station: toRecord(updated) } as const;
}

export async function deleteRegisteredGasStationForUser(
  userId: string,
  stationId: string,
) {
  const existing = await prisma.registeredGasStation.findFirst({
    where: { id: stationId, userId },
  });

  if (!existing) {
    return { error: "登録店舗が見つかりません" } as const;
  }

  await prisma.registeredGasStation.delete({
    where: { id: stationId },
  });

  return { ok: true } as const;
}
