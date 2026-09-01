"use client";

import { useEffect, useState } from "react";

const serviceWorkerVersion = "2026.08.31-android-refresh-1";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

function isStandaloneApp() {
  return window.matchMedia("(display-mode: standalone)").matches
    || (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
}

export default function PwaSupport() {
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const workerCleanups: Array<() => void> = [];

    if ("serviceWorker" in navigator) {
      const hadController = Boolean(navigator.serviceWorker.controller);
      let refreshedForThisUpdate = false;
      const requestActivation = (worker: ServiceWorker | null) => {
        if (!worker) return;
        setUpdating(true);
        worker.postMessage({ type: "SKIP_WAITING" });
      };
      const handleControllerChange = () => {
        if (!hadController || refreshedForThisUpdate) return;
        refreshedForThisUpdate = true;
        window.location.reload();
      };
      navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);
      workerCleanups.push(() => navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange));

      void navigator.serviceWorker.register(`/sw.js?v=${serviceWorkerVersion}`, {
        scope: "/",
        updateViaCache: "none",
      }).then((registration) => {
        if (cancelled) return;
        requestActivation(registration.waiting);

        const handleUpdateFound = () => {
          const installing = registration.installing;
          if (!installing) return;
          const handleStateChange = () => {
            if (installing.state === "installed" && navigator.serviceWorker.controller) {
              requestActivation(installing);
            }
          };
          installing.addEventListener("statechange", handleStateChange);
          workerCleanups.push(() => installing.removeEventListener("statechange", handleStateChange));
        };
        registration.addEventListener("updatefound", handleUpdateFound);
        const checkForUpdates = () => {
          if (document.visibilityState === "visible") void registration.update();
        };
        window.addEventListener("focus", checkForUpdates);
        document.addEventListener("visibilitychange", checkForUpdates);
        void registration.update();

        workerCleanups.push(() => {
          registration.removeEventListener("updatefound", handleUpdateFound);
          window.removeEventListener("focus", checkForUpdates);
          document.removeEventListener("visibilitychange", checkForUpdates);
        });
      }).catch(() => {
        // A failed registration must never prevent learners from entering the app.
      });
    }

    if (isStandaloneApp()) return;

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
      setVisible(true);
    };
    const handleInstalled = () => {
      setVisible(false);
      setInstallPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);
    return () => {
      cancelled = true;
      workerCleanups.forEach((cleanup) => cleanup());
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  if (updating) {
    return (
      <aside className="pwa-update-card" role="status" aria-live="polite">
        <span className="pwa-update-spinner" aria-hidden="true" />
        <div><strong>正在更新 IELTS Pass</strong><small>新版本会自动打开，请稍候</small></div>
      </aside>
    );
  }

  if (!visible || !installPrompt) return null;

  const install = async () => {
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === "accepted") setVisible(false);
    setInstallPrompt(null);
  };

  return (
    <aside className="pwa-install-card" aria-label="安装 IELTS Pass">
      <span className="pwa-install-mark" aria-hidden="true">IP</span>
      <div>
        <strong>安装 IELTS Pass</strong>
        <small>添加到安卓桌面，像 App 一样打开</small>
      </div>
      <button type="button" onClick={install}>安装</button>
      <button type="button" className="pwa-install-close" aria-label="暂不安装" onClick={() => setVisible(false)}>×</button>
    </aside>
  );
}
