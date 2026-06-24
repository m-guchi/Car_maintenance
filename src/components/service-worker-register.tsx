"use client";

import { useEffect } from "react";

const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000;

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

    let refreshing = false;

    const onControllerChange = () => {
      if (refreshing) {
        return;
      }
      refreshing = true;
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener(
      "controllerchange",
      onControllerChange,
    );

    let registration: ServiceWorkerRegistration | undefined;
    let updateInterval: ReturnType<typeof setInterval> | undefined;

    const checkForUpdates = () => {
      void registration?.update();
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkForUpdates();
      }
    };

    void navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        registration = reg;
        checkForUpdates();
        updateInterval = setInterval(checkForUpdates, UPDATE_CHECK_INTERVAL_MS);
        document.addEventListener("visibilitychange", onVisibilityChange);
      })
      .catch((error) => {
        console.error("[sw] Registration failed:", error);
      });

    return () => {
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        onControllerChange,
      );
      if (updateInterval) {
        clearInterval(updateInterval);
      }
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  return null;
}
