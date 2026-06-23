import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { prisma } from "../src/lib/prisma";

const MIGRATIONS_DIR = path.join(process.cwd(), "prisma/migrations");

function migrationChecksum(contents: string): string {
  return createHash("sha256").update(contents).digest("hex");
}

function readMigrationChecksum(migrationName: string): string {
  const filePath = path.join(MIGRATIONS_DIR, migrationName, "migration.sql");
  const contents = readFileSync(filePath, "utf-8").replace(/\r\n/g, "\n");
  return migrationChecksum(contents);
}

async function main() {
  const migrationNames = readdirSync(MIGRATIONS_DIR)
    .filter((entry) => /^\d{14}_/.test(entry))
    .sort();

  if (migrationNames.length === 0) {
    console.log("マイグレーションが見つかりません。");
    return;
  }

  let updated = 0;

  for (const migrationName of migrationNames) {
    const checksum = readMigrationChecksum(migrationName);
    const result = await prisma.$executeRaw`
      UPDATE _prisma_migrations
      SET checksum = ${checksum}, applied_steps_count = 1
      WHERE migration_name = ${migrationName}
    `;

    if (typeof result === "number" && result > 0) {
      console.log(`updated ${migrationName} -> ${checksum.slice(0, 12)}…`);
      updated += result;
    }
  }

  if (updated === 0) {
    console.log("更新対象のマイグレーション履歴がありません（未適用のみの可能性）。");
  } else {
    console.log(`完了: ${updated} 件の checksum を更新しました。`);
  }
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
