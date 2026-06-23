/**
 * 本番 DB 接続先とマイグレーション履歴を表示（トラブルシュート用）。
 */
import { buildDatabaseUrl, getDatabaseConfig } from "../src/lib/database-url";
import { createPrismaClient } from "../src/lib/prisma";

type MigrationRow = {
  migration_name: string;
  finished_at: Date | null;
};

type ColumnRow = { COLUMN_NAME: string };

function maskDatabaseUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const port = parsed.port ? `:${parsed.port}` : "";
    return `${parsed.protocol}//${parsed.username}:***@${parsed.hostname}${port}${parsed.pathname}`;
  } catch {
    return "(invalid)";
  }
}

async function main() {
  const config = getDatabaseConfig();
  if (!config.useProdDb) {
    console.error("Error: DB_TARGET=production で実行してください（db:diagnose:prod:tunnel）。");
    process.exit(1);
  }

  const prisma = createPrismaClient();

  try {
    const [identity] = await prisma.$queryRaw<
      Array<{ db: string | null; host: string | null; port: number | null }>
    >`
      SELECT DATABASE() AS db, @@hostname AS host, @@port AS port
    `;

    const migrations = await prisma.$queryRaw<MigrationRow[]>`
      SELECT migration_name, finished_at
      FROM _prisma_migrations
      ORDER BY finished_at ASC
    `;

    const columns = await prisma.$queryRaw<ColumnRow[]>`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'maintenance_categories'
      ORDER BY ORDINAL_POSITION ASC
    `;

    console.log("=== 本番 DB 診断 ===");
    console.log(`DB_TARGET=${process.env.DB_TARGET ?? "(unset)"}`);
    console.log(`DB_TUNNEL=${process.env.DB_TUNNEL ?? "(unset)"}`);
    console.log(`adapter: ${config.host}:${config.port} / db=${config.name}`);
    console.log(`DATABASE_URL: ${maskDatabaseUrl(buildDatabaseUrl())}`);
    console.log(`DATABASE(): ${identity?.db ?? "(null)"}`);
    console.log(`@@hostname:@@port: ${identity?.host}:${identity?.port}`);
    console.log("");
    console.log(`_prisma_migrations (${migrations.length} rows):`);
    for (const row of migrations) {
      const status = row.finished_at ? "applied" : "pending/failed";
      console.log(`  - ${row.migration_name} [${status}]`);
    }
    console.log("");
    console.log("maintenance_categories columns:");
    for (const row of columns) {
      console.log(`  - ${row.COLUMN_NAME}`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
