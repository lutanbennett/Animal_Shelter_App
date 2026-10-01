"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";

const PROBE_URL = "/lca-logo.jpg";
const PROBE_EVERY_MS = 10_000;

/**
 * "You're offline, changes will not save."
 *
 * navigator.onLine is only a hint: it stays true on Wi-Fi with no route
 * out, which is the shelter's likely failure. The truth is a fetch that
 * rejects — a rejected fetch is a network failure, whereas an expired
 * session or a server error still comes back as a response — so fetch is
 * wrapped here, and while the banner is up a small probe decides when the
 * network is back.
 */
export function OfflineBanner() {
  const { t } = useI18n();
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    setOffline(!navigator.onLine);
    const goOffline = () => setOffline(true);
    const goOnline = () => setOffline(false);
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);

    const realFetch = window.fetch;
    window.fetch = async (...args: Parameters<typeof fetch>) => {
      try {
        const response = await realFetch(...args);
        goOnline();
        return response;
      } catch (error) {
        // An aborted request is the caller's doing, not the network's.
        if (!(error instanceof DOMException && error.name === "AbortError")) goOffline();
        throw error;
      }
    };

    return () => {
      window.fetch = realFetch;
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  useEffect(() => {
    if (!offline) return;
    const id = window.setInterval(() => {
      // Goes through the wrapped fetch: success clears the banner.
      fetch(PROBE_URL, { method: "HEAD", cache: "no-store" }).catch(() => {});
    }, PROBE_EVERY_MS);
    return () => window.clearInterval(id);
  }, [offline]);

  if (!offline) return null;
  return (
    <div
      role="status"
      className="sticky top-0 z-40 flex items-center justify-center gap-2 bg-danger px-4 py-2 text-sm font-medium text-danger-foreground"
    >
      <WifiOff aria-hidden="true" className="h-4 w-4" />
      {t.common.offlineBanner}
    </div>
  );
}
