import { prisma } from "@/lib/prisma";
import {
  DEFAULT_GAS_STATION_BRAND_SEEDS,
  OTHER_GAS_STATION_BRAND_NAME,
  validateGasStationBrandName,
  type GasStationBrandRecord,
} from "@/lib/gas-station-brand-types";

export type { GasStationBrandRecord } from "@/lib/gas-station-brand-types";
export { OTHER_GAS_STATION_BRAND_NAME } from "@/lib/gas-station-brand-types";

function toRecord(brand: {
  id: string;
  name: string;
  matchKeywords: string | null;
  displayOrder: number;
}): GasStationBrandRecord {
  return {
    id: brand.id,
    name: brand.name,
    matchKeywords: brand.matchKeywords,
    displayOrder: brand.displayOrder,
  };
}

function sortBrands(brands: GasStationBrandRecord[]): GasStationBrandRecord[] {
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

export async function listGasStationBrandsForUser(
  userId: string,
): Promise<GasStationBrandRecord[]> {
  const brands = await prisma.gasStationBrand.findMany({
    where: { userId },
    orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
  });

  return sortBrands(brands.map(toRecord));
}

export async function ensureGasStationBrandsForUser(
  userId: string,
): Promise<GasStationBrandRecord[]> {
  const existing = await listGasStationBrandsForUser(userId);

  if (existing.length > 0) {
    return existing;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });
  if (!user) {
    // 例: ローカル DB リセット後に古い JWT が残っている
    return [];
  }

  await prisma.gasStationBrand.createMany({
    data: DEFAULT_GAS_STATION_BRAND_SEEDS.map((seed, index) => ({
      userId,
      name: seed.name,
      matchKeywords: seed.matchKeywords || null,
      displayOrder: index,
    })),
  });

  return listGasStationBrandsForUser(userId);
}

export async function createGasStationBrandForUser(
  userId: string,
  name: string,
  matchKeywords?: string | null,
) {
  const error = validateGasStationBrandName(name);

  if (error) {
    return { error } as const;
  }

  const trimmedName = name.trim();
  const brands = await ensureGasStationBrandsForUser(userId);

  if (brands.some((brand) => brand.name === trimmedName)) {
    return { error: "同じ名前のブランドが既にあります" } as const;
  }

  const nextOrder =
    brands
      .filter((brand) => brand.name !== OTHER_GAS_STATION_BRAND_NAME)
      .reduce((max, brand) => Math.max(max, brand.displayOrder), -1) + 1;

  const created = await prisma.gasStationBrand.create({
    data: {
      userId,
      name: trimmedName,
      matchKeywords: matchKeywords?.trim() || null,
      displayOrder: nextOrder,
    },
  });

  return { brand: toRecord(created) } as const;
}

export async function updateGasStationBrandForUser(
  userId: string,
  brandId: string,
  input: { name?: string; matchKeywords?: string | null },
) {
  const existing = await prisma.gasStationBrand.findFirst({
    where: { id: brandId, userId },
  });

  if (!existing) {
    return { error: "ブランドが見つかりません" } as const;
  }

  if (existing.name === OTHER_GAS_STATION_BRAND_NAME && input.name && input.name !== existing.name) {
    return { error: "「その他」は名前を変更できません" } as const;
  }

  const nextName = input.name?.trim() ?? existing.name;
  const nameError = validateGasStationBrandName(nextName);

  if (nameError) {
    return { error: nameError } as const;
  }

  if (nextName !== existing.name) {
    const duplicate = await prisma.gasStationBrand.findFirst({
      where: {
        userId,
        name: nextName,
        NOT: { id: brandId },
      },
    });

    if (duplicate) {
      return { error: "同じ名前のブランドが既にあります" } as const;
    }
  }

  const updated = await prisma.gasStationBrand.update({
    where: { id: brandId },
    data: {
      name: nextName,
      matchKeywords:
        input.matchKeywords !== undefined
          ? input.matchKeywords?.trim() || null
          : existing.matchKeywords,
    },
  });

  if (nextName !== existing.name) {
    await prisma.fuelLog.updateMany({
      where: {
        vehicle: { userId },
        gasStationBrands: existing.name,
      },
      data: {
        gasStationBrands: nextName,
      },
    });
  }

  return { brand: toRecord(updated) } as const;
}

export async function deleteGasStationBrandForUser(
  userId: string,
  brandId: string,
) {
  const existing = await prisma.gasStationBrand.findFirst({
    where: { id: brandId, userId },
  });

  if (!existing) {
    return { error: "ブランドが見つかりません" } as const;
  }

  if (existing.name === OTHER_GAS_STATION_BRAND_NAME) {
    return { error: "「その他」は削除できません" } as const;
  }

  await prisma.gasStationBrand.delete({
    where: { id: brandId },
  });

  return { ok: true } as const;
}

export async function reorderGasStationBrandsForUser(
  userId: string,
  orderedBrandIds: string[],
) {
  const brands = await listGasStationBrandsForUser(userId);
  const sortableBrands = brands.filter(
    (brand) => brand.name !== OTHER_GAS_STATION_BRAND_NAME,
  );
  const otherBrand = brands.find((brand) => brand.name === OTHER_GAS_STATION_BRAND_NAME);

  if (orderedBrandIds.length !== sortableBrands.length) {
    return { error: "並び順の更新に失敗しました" } as const;
  }

  const sortableIds = new Set(sortableBrands.map((brand) => brand.id));

  if (!orderedBrandIds.every((id) => sortableIds.has(id))) {
    return { error: "並び順の更新に失敗しました" } as const;
  }

  await prisma.$transaction([
    ...orderedBrandIds.map((id, index) =>
      prisma.gasStationBrand.update({
        where: { id },
        data: { displayOrder: index },
      }),
    ),
    ...(otherBrand
      ? [
          prisma.gasStationBrand.update({
            where: { id: otherBrand.id },
            data: { displayOrder: orderedBrandIds.length },
          }),
        ]
      : []),
  ]);

  return { ok: true } as const;
}
