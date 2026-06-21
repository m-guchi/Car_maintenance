import { execSync } from "node:child_process";
import fs from "node:fs";
import net from "node:net";

import { PrismaClient } from "@prisma/client";

import {
  buildDatabaseUrl,
  DEV_DB_HOST,
  DEV_DB_PORT,
  getDatabaseConfig,
  usesUnixSocket,
} from "../src/lib/database-url";

const DEFAULT_SOCKET_PATHS = [
  "/var/run/mysqld/mysqld.sock",
  "/run/mysqld/mysqld.sock",
];

function maskDatabaseUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const port = parsed.port ? `:${parsed.port}` : "";
    return `${parsed.protocol}//${parsed.username}:***@${parsed.hostname}${port}${parsed.pathname}`;
  } catch {
    return "(invalid DATABASE_URL)";
  }
}

function isMysqlListeningLocally(): boolean {
  try {
    const output = execSync("ss -tln 2>/dev/null || netstat -tln 2>/dev/null", {
      encoding: "utf-8",
    });
    return output.includes(`:${DEV_DB_PORT} `);
  } catch {
    return false;
  }
}

function findLocalSocket(): string | undefined {
  return DEFAULT_SOCKET_PATHS.find((path) => fs.existsSync(path));
}

function testTcp(host: string, port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = net.connect({ host, port, timeout: 3000 });

    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });

    socket.once("error", () => {
      socket.destroy();
      resolve(false);
    });

    socket.once("timeout", () => {
      socket.destroy();
      resolve(false);
    });
  });
}

async function main() {
  const { isProduction, host, port, user, password, name } =
    getDatabaseConfig();

  console.log("環境:", isProduction ? "production" : "development");
  if (isProduction) {
    console.log("接続先:", `${host}:${port}`);
  } else {
    console.log("接続先:", `${DEV_DB_HOST}:${DEV_DB_PORT}（固定）`);
    console.log("Unix ソケット:", usesUnixSocket() ? "使用" : "未使用");
  }
  console.log("接続 URL:", maskDatabaseUrl(buildDatabaseUrl()));
  console.log("");

  if (!user || !password || !name) {
    console.error("NG: 1Password から DB 環境変数が不足しています。");
    console.error("   必要: DB_USER, DB_PASSWORD, DB_NAME");
    process.exit(1);
  }

  if (isProduction && (!host || !port)) {
    console.error("NG: 本番用 DB_HOST / DB_PORT が未設定です。");
    process.exit(1);
  }

  if (!isProduction) {
    const mysqlLocal = isMysqlListeningLocally();
    console.log("ローカル MySQL:", mysqlLocal ? "起動中" : "未起動");

    if (!mysqlLocal && !findLocalSocket()) {
      console.error("");
      console.error("NG: ローカル MySQL が見つかりません。");
      console.error("  → sudo service mysql start");
      process.exit(1);
    }

    if (!usesUnixSocket()) {
      const tcpOk = await testTcp(DEV_DB_HOST, Number(DEV_DB_PORT));
      console.log(`TCP ${DEV_DB_HOST}:${DEV_DB_PORT}:`, tcpOk ? "OK" : "NG");
      if (!tcpOk) {
        process.exit(1);
      }
    }
  }

  const prisma = new PrismaClient({
    datasources: { db: { url: buildDatabaseUrl() } },
  });

  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log("");
    console.log("Prisma 接続: OK");

    const tables = await prisma.$queryRaw<Array<{ TABLE_NAME: string }>>`
      SHOW TABLES
    `;
    console.log(`テーブル数: ${tables.length}`);
    if (tables.length === 0) {
      console.log("→ npm run db:migrate を実行してください。");
    }
  } catch (error) {
    console.error("");
    console.error("Prisma 接続: NG");
    if (error instanceof Error) {
      console.error(error.message);
    }
    console.error("");
    console.error("確認:");
    console.error("  → 1Password の db-user / db-password / db-name を確認");
    console.error("  → npm run db:setup を再実行（パスワードを MySQL に同期）");
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
