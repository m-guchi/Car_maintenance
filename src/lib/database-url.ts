import fs from "node:fs";

/** 開発環境の DB 接続先（固定） */
export const DEV_DB_HOST = "127.0.0.1";
export const DEV_DB_PORT = "3306";

/** SSH トンネル経由時のローカル待受ポート（既定） */
export const PROD_DB_TUNNEL_LOCAL_PORT = "3307";

/**
 * Builds a MySQL connection URL from split DB environment variables.
 *
 * Development (DB_TARGET=local): 127.0.0.1:3306 固定（Unix ソケット優先）
 * Production / DB_TARGET=production: DB_HOST, DB_PORT（1Password）
 * DB_TUNNEL=true: 127.0.0.1:PROD_DB_LOCAL_PORT（SSH トンネル先）
 */
const DEFAULT_SOCKET_PATHS = [
  "/var/run/mysqld/mysqld.sock",
  "/run/mysqld/mysqld.sock",
];

function trim(value: string | undefined): string | undefined {
  return value?.trim() || undefined;
}

export function normalizeMysqlHost(host: string): string {
  const lower = host.trim().toLowerCase();
  if (lower === "localhost" || lower === "::1") {
    return "127.0.0.1";
  }
  return host.trim();
}

function resolveLocalSocket(): string | undefined {
  const explicit = trim(process.env.DB_SOCKET_PATH);
  if (explicit) {
    return fs.existsSync(explicit) ? explicit : undefined;
  }
  if (process.env.DB_FORCE_TCP === "true") {
    return undefined;
  }
  return DEFAULT_SOCKET_PATHS.find((path) => fs.existsSync(path));
}

export function usesProductionDatabase(): boolean {
  if (process.env.NODE_ENV === "production") {
    return true;
  }
  return trim(process.env.DB_TARGET)?.toLowerCase() === "production";
}

function usesSshTunnel(): boolean {
  return trim(process.env.DB_TUNNEL)?.toLowerCase() === "true";
}

export function getDatabaseConfig() {
  const isProduction = process.env.NODE_ENV === "production";
  const useProdDb = usesProductionDatabase();
  const useTunnel = useProdDb && usesSshTunnel();

  const host = useProdDb
    ? useTunnel
      ? DEV_DB_HOST
      : trim(process.env.DB_HOST)
    : DEV_DB_HOST;
  const port = useProdDb
    ? useTunnel
      ? trim(process.env.PROD_DB_LOCAL_PORT) ?? PROD_DB_TUNNEL_LOCAL_PORT
      : trim(process.env.DB_PORT)
    : DEV_DB_PORT;
  const user = trim(process.env.DB_USER);
  const password = trim(process.env.DB_PASSWORD);
  const name = trim(process.env.DB_NAME) ?? "car_maintenance";

  return {
    isProduction,
    useProdDb,
    useTunnel,
    host,
    port,
    user,
    password,
    name,
  };
}

export function buildDatabaseUrl(): string {
  const { useProdDb, host, port, user, password, name } = getDatabaseConfig();

  if (!user || !password) {
    return `mysql://placeholder:placeholder@${DEV_DB_HOST}:${DEV_DB_PORT}/car_maintenance`;
  }

  if (!useProdDb) {
    const encodedPassword = encodeURIComponent(password);
    const socket = resolveLocalSocket();
    if (socket) {
      return `mysql://${user}:${encodedPassword}@${DEV_DB_HOST}/${name}?socket=${encodeURIComponent(socket)}`;
    }
    return `mysql://${user}:${encodedPassword}@${DEV_DB_HOST}:${DEV_DB_PORT}/${name}`;
  }

  if (!host || !port) {
    return `mysql://placeholder:placeholder@${DEV_DB_HOST}:${DEV_DB_PORT}/car_maintenance`;
  }

  const encodedPassword = encodeURIComponent(password);
  const normalizedHost = normalizeMysqlHost(host);
  return `mysql://${user}:${encodedPassword}@${normalizedHost}:${port}/${name}`;
}

export function usesUnixSocket(): boolean {
  return buildDatabaseUrl().includes("socket=");
}
