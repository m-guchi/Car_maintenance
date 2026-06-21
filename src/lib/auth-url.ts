/**
 * Resolves the Auth.js canonical URL from split environment variables.
 *
 * Development: AUTH_URL_DEV (+ PORT when localhost)
 * Production:  AUTH_URL
 */
export function resolveAuthUrl(): string {
  const isProduction = process.env.NODE_ENV === "production";

  if (isProduction) {
    return process.env.AUTH_URL ?? "https://localhost";
  }

  const port = process.env.PORT ?? "3000";
  const devBase = process.env.AUTH_URL_DEV ?? "http://localhost:3000";

  try {
    const url = new URL(devBase);
    if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
      url.port = port;
      return url.origin;
    }
    return devBase.replace(/\/$/, "");
  } catch {
    return `http://localhost:${port}`;
  }
}

/** Sets process.env.AUTH_URL for Auth.js (production only at startup). */
export function applyAuthUrlEnv(): void {
  if (process.env.NODE_ENV === "production") {
    process.env.AUTH_URL = resolveAuthUrl();
  }
}

/**
 * In development, Auth.js must use the request origin so alternate dev ports
 * (e.g. 3001 when 3000 is busy) do not redirect to AUTH_URL_DEV's fixed port.
 */
export function applyAuthUrlFromRequest(requestUrl: string): void {
  if (process.env.NODE_ENV === "production") {
    return;
  }
  process.env.AUTH_URL = new URL(requestUrl).origin;
}
