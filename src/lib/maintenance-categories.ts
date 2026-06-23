import { prisma } from "@/lib/prisma";
import {
  DEFAULT_MAINTENANCE_CATEGORY_SEEDS,
  validateMaintenanceCategoryName,
  type MaintenanceCategoryRecord,
} from "@/lib/maintenance-category-types";

export type { MaintenanceCategoryRecord } from "@/lib/maintenance-category-types";

function toRecord(category: {
  id: string;
  name: string;
  displayOrder: number;
}): MaintenanceCategoryRecord {
  return {
    id: category.id,
    name: category.name,
    displayOrder: category.displayOrder,
  };
}

export async function listMaintenanceCategoriesForUser(
  userId: string,
): Promise<MaintenanceCategoryRecord[]> {
  const categories = await prisma.maintenanceCategory.findMany({
    where: { userId },
    orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
  });

  return categories.map(toRecord);
}

export async function ensureMaintenanceCategoriesForUser(
  userId: string,
): Promise<MaintenanceCategoryRecord[]> {
  const existing = await listMaintenanceCategoriesForUser(userId);

  if (existing.length > 0) {
    return existing;
  }

  await prisma.maintenanceCategory.createMany({
    data: DEFAULT_MAINTENANCE_CATEGORY_SEEDS.map((name, index) => ({
      userId,
      name,
      displayOrder: index,
    })),
  });

  return listMaintenanceCategoriesForUser(userId);
}

export async function getMaintenanceCategoryForUser(
  userId: string,
  categoryId: string,
) {
  return prisma.maintenanceCategory.findFirst({
    where: { id: categoryId, userId },
  });
}

export async function createMaintenanceCategoryForUser(
  userId: string,
  name: string,
) {
  const error = validateMaintenanceCategoryName(name);

  if (error) {
    return { error } as const;
  }

  const trimmedName = name.trim();
  const categories = await ensureMaintenanceCategoriesForUser(userId);

  if (categories.some((category) => category.name === trimmedName)) {
    return { error: "同じ名前のカテゴリが既にあります" } as const;
  }

  const nextOrder =
    categories.reduce((max, category) => Math.max(max, category.displayOrder), -1) + 1;

  const created = await prisma.maintenanceCategory.create({
    data: {
      userId,
      name: trimmedName,
      displayOrder: nextOrder,
    },
  });

  return { category: toRecord(created) } as const;
}

export async function updateMaintenanceCategoryForUser(
  userId: string,
  categoryId: string,
  input: { name?: string },
) {
  const existing = await getMaintenanceCategoryForUser(userId, categoryId);

  if (!existing) {
    return { error: "カテゴリが見つかりません" } as const;
  }

  const nextName = input.name?.trim() ?? existing.name;
  const nameError = validateMaintenanceCategoryName(nextName);

  if (nameError) {
    return { error: nameError } as const;
  }

  if (nextName !== existing.name) {
    const duplicate = await prisma.maintenanceCategory.findFirst({
      where: {
        userId,
        name: nextName,
        NOT: { id: categoryId },
      },
    });

    if (duplicate) {
      return { error: "同じ名前のカテゴリが既にあります" } as const;
    }
  }

  const updated = await prisma.maintenanceCategory.update({
    where: { id: categoryId },
    data: { name: nextName },
  });

  return { category: toRecord(updated) } as const;
}

export async function getMaintenanceLogCountsByCategoryId(userId: string) {
  const counts = await prisma.maintenanceLog.groupBy({
    by: ["categoryId"],
    where: { vehicle: { userId } },
    _count: { id: true },
  });

  return Object.fromEntries(
    counts.map((entry) => [entry.categoryId, entry._count.id]),
  ) as Record<string, number>;
}

export async function deleteMaintenanceCategoryForUser(
  userId: string,
  categoryId: string,
) {
  const existing = await getMaintenanceCategoryForUser(userId, categoryId);

  if (!existing) {
    return { error: "カテゴリが見つかりません" } as const;
  }

  await prisma.maintenanceCategory.delete({
    where: { id: categoryId },
  });

  return { ok: true } as const;
}

export async function reorderMaintenanceCategoriesForUser(
  userId: string,
  orderedCategoryIds: string[],
) {
  const categories = await listMaintenanceCategoriesForUser(userId);

  if (orderedCategoryIds.length !== categories.length) {
    return { error: "並び順の更新に失敗しました" } as const;
  }

  const categoryIds = new Set(categories.map((category) => category.id));

  if (!orderedCategoryIds.every((id) => categoryIds.has(id))) {
    return { error: "並び順の更新に失敗しました" } as const;
  }

  await prisma.$transaction(
    orderedCategoryIds.map((id, index) =>
      prisma.maintenanceCategory.update({
        where: { id },
        data: { displayOrder: index },
      }),
    ),
  );

  return { ok: true } as const;
}
