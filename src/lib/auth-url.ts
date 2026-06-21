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

/**
 * Builds the public origin Auth.js should use for the current request.
 * When the dev server binds to 0.0.0.0, request URLs may contain that
 * address; prefer the Host header so OAuth redirect URIs stay valid.
 */
export function resolveRequestAuthUrl(
  requestUrl: string,
  hostHeader?: string | null,
): string {
  const url = new URL(requestUrl);
  const protocol = url.protocol || "http:";

  if (hostHeader && !hostHeader.startsWith("0.0.0.0")) {
    return `${protocol}//${hostHeader}`;
  }

  if (url.hostname === "0.0.0.0") {
    const port = url.port || process.env.PORT || "3000";
    return `${protocol}//localhost:${port}`;
  }

  return url.origin;
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
export function applyAuthUrlFromRequest(
  requestUrl: string,
  hostHeader?: string | null,
): void {
  if (process.env.NODE_ENV === "production") {
    return;
  }
  process.env.AUTH_URL = resolveRequestAuthUrl(requestUrl, hostHeader);
}
