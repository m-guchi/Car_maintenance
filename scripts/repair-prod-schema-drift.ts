/**
 * 本番 DB のスキーマドリフトを検出し、欠けているカラムを修復する。
 */
import { buildDatabaseUrl, getDatabaseConfig } from "../src/lib/database-url";
import { createPrismaClient } from "../src/lib/prisma";

import { MIGRATION_REPAIRS } from "./migration-repairs.mjs";

type ColumnRow = { COLUMN_NAME: string };

type MigrationRow = {
  migration_name: string;
  finished_at: Date | null;
};

type DbIdentityRow = {
  db: string | null;
  host: string | null;
  port: number | null;
};

const REPAIRS = MIGRATION_REPAIRS;

function maskDatabaseUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const port = parsed.port ? `:${parsed.port}` : "";
    return `${parsed.protocol}//${parsed.username}:***@${parsed.hostname}${port}${parsed.pathname}`;
  } catch {
    return "(invalid)";
  }
}

async function listTableColumns(
  prisma: ReturnType<typeof createPrismaClient>,
  table: string,
): Promise<Set<string>> {
  const rows = await prisma.$queryRaw<ColumnRow[]>`
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = ${table}
  `;
  return new Set(rows.map((row) => row.COLUMN_NAME));
}

async function listAppliedMigrations(
  prisma: ReturnType<typeof createPrismaClient>,
): Promise<MigrationRow[]> {
  return prisma.$queryRaw<MigrationRow[]>`
    SELECT migration_name, finished_at
    FROM _prisma_migrations
    WHERE finished_at IS NOT NULL
    ORDER BY finished_at ASC
  `;
}

async function printDiagnostics(prisma: ReturnType<typeof createPrismaClient>) {
  const config = getDatabaseConfig();
  const [identity] = await prisma.$queryRaw<DbIdentityRow[]>`
    SELECT
      DATABASE() AS db,
      @@hostname AS host,
      @@port AS port
  `;
  const migrations = await listAppliedMigrations(prisma);

  console.log("接続診断:");
  console.log(`  DB_TARGET=${process.env.DB_TARGET ?? "(unset)"}`);
  console.log(`  DB_TUNNEL=${process.env.DB_TUNNEL ?? "(unset)"}`);
  console.log(`  adapter host:port=${config.host}:${config.port}`);
  console.log(`  DATABASE_URL=${maskDatabaseUrl(buildDatabaseUrl())}`);
  console.log(`  DATABASE()=${identity?.db ?? "(null)"}`);
  console.log(`  @@hostname / @@port=${identity?.host ?? "?"}:${identity?.port ?? "?"}`);
  console.log(`  applied migrations: ${migrations.length}`);
  if (migrations.length > 0) {
    console.log(`  latest: ${migrations[migrations.length - 1]?.migration_name}`);
  }
  console.log("");
}

async function main() {
  const config = getDatabaseConfig();
  if (!config.useProdDb) {
    console.error("Error: DB_TARGET=production で実行してください（db:repair:prod:tunnel）。");
    process.exit(1);
  }

  const prisma = createPrismaClient();
  let repaired = 0;

  try {
    await printDiagnostics(prisma);

    for (const repair of REPAIRS) {
      const existing = await listTableColumns(prisma, repair.table);
      const missing = repair.columns.filter((col) => !existing.has(col.name));
      const migrations = await listAppliedMigrations(prisma);
      const applied = migrations.some((row) => row.migration_name === repair.migration);

      console.log(`[${repair.migration}]`);
      console.log(`  migration applied: ${applied ? "yes" : "no"}`);
      console.log(
        `  missing columns: ${missing.length ? missing.map((c) => c.name).join(", ") : "(none)"}`,
      );

      if (missing.length === 0) {
        console.log("  → OK");
        console.log("");
        continue;
      }

      console.log("  → 欠けているカラムを追加します...");
      for (const column of missing) {
        await prisma.$executeRawUnsafe(
          `ALTER TABLE \`${repair.table}\` ${column.ddl}`,
        );
        console.log(`     + ${column.name}`);
      }
      repaired += 1;
      console.log("  → 修復完了");
      console.log("");
    }
  } finally {
    await prisma.$disconnect();
  }

  if (repaired > 0) {
    console.log(`修復した項目: ${repaired}`);
    console.log("開発サーバーを再起動してください。");
    console.log("");
    console.log("migrate deploy が未適用のままなら、次も実行してください:");
    console.log("  npm run db:migrate:prod:tunnel");
    console.log("カラムは揃っているのに失敗状態のとき:");
    console.log("  node scripts/reconcile-migrations-deploy.mjs");
  } else {
    console.log("修復は不要でした。");
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
