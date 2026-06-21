"use client";

import { useEffect } from "react";

async function clearDevCaches() {
  if (!("caches" in window)) {
    return;
  }

  const keys = await caches.keys();
  await Promise.all(keys.map((key) => caches.delete(key)));
}

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    // 開発中は SW とキャッシュを無効化（古い UI が表示されるのを防ぐ）
    if (process.env.NODE_ENV === "development") {
      void (async () => {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(
          registrations.map((registration) => registration.unregister()),
        );
        await clearDevCaches();
      })();
      return;
    }

    navigator.serviceWorker.register("/sw.js").catch((error) => {
      console.error("[sw] Registration failed:", error);
    });
  }, []);

  return null;
}
