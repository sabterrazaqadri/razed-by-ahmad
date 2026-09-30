"use client";

import { useEffect, useState } from "react";

// Chrome/Edge/Samsung Internet fire this before offering "Install app".
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "razed:install-dismissed";
const DISMISS_MS = 14 * 24 * 60 * 60 * 1000;

function recentlyDismissed() {
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY) ?? 0);
    return Date.now() - at < DISMISS_MS;
  } catch {
    return false;
  }
}

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIosSafari() {
  const ua = navigator.userAgent;
  const ios = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const safari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
  return ios && safari;
}

export function InstallPrompt() {
  const [evt, setEvt] = useState<BeforeInstallPromptEvent | null>(null);
  const [mode, setMode] = useState<"hidden" | "android" | "ios">("hidden");

  useEffect(() => {
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* offline support is a nice-to-have */
      });
    }

    if (isStandalone() || recentlyDismissed()) return;

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvt(e as BeforeInstallPromptEvent);
      setMode("android");
    };
    const onInstalled = () => setMode("hidden");
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);

    let t: ReturnType<typeof setTimeout> | undefined;
    if (isIosSafari()) t = setTimeout(() => setMode("ios"), 2500);

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      if (t) clearTimeout(t);
    };
  }, []);

  function dismiss() {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* ignore */
    }
    setMode("hidden");
  }

  async function install() {
    if (!evt) return;
    await evt.prompt();
    const choice = await evt.userChoice;
    setEvt(null);
    if (choice.outcome === "accepted") setMode("hidden");
    else dismiss();
  }

  if (mode === "hidden") return null;

  return (
    <div className="install" role="region" aria-label="Install the Razed app">
      <div className="ico" aria-hidden="true">
        R
      </div>
      <div className="tx">
        <b>Install Razed</b>
        {mode === "ios" ? (
          <span>
            Tap <strong style={{ fontWeight: 400, color: "var(--color-gold-hi)" }}>Share</strong> →{" "}
            <strong style={{ fontWeight: 400, color: "var(--color-gold-hi)" }}>Add to Home Screen</strong>.
          </span>
        ) : (
          <span>Add to home screen — reorder in two taps.</span>
        )}
      </div>
      {mode === "android" && (
        <button type="button" className="go" onClick={install}>
          Install
        </button>
      )}
      <button type="button" className="x" onClick={dismiss} aria-label="Dismiss install prompt">
        &times;
      </button>
    </div>
  );
}
