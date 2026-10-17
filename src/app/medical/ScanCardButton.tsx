"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { Nfc } from "lucide-react";
import type { ScanCardStrings } from "./scan-card-strings";
import type { PickableResident } from "@/lib/medical/residents";
import { residentCodeFrom } from "@/lib/tags/links";
import type { CardWaitJob } from "@/lib/residents/card-wait";
import { startCardWait, stopCardWait } from "./scan-actions";

/**
 * "Scan card" for the resident picker (docs/decisions/2026-10-16-name-card-scanning.md).
 *
 * Web NFC (Chrome on Android) reads the card's link, the R-code is taken out of it, and the resident
 * is found in `residents`: the very list the picker offers this person, so a card for someone they may
 * not pick, a deceased resident or an unknown code finds nothing and says so. It never falls back to
 * a near match, a recent choice or the first hit. Scanning only chooses; nothing is written here.
 * Where the browser has no Web NFC (every iPhone) the button is not shown by this component.
 */

type NdefRecordLike = { recordType: string; data?: DataView; encoding?: string };
type NdefReadingEvent = { message: { records: NdefRecordLike[] } };
type NdefReaderLike = {
  scan(o?: { signal?: AbortSignal }): Promise<void>;
  onreading: ((e: NdefReadingEvent) => void) | null;
  onreadingerror: (() => void) | null;
};

export function hasWebNfc(): boolean {
  return typeof window !== "undefined" && "NDEFReader" in window;
}

function textsOf(records: NdefRecordLike[]): string[] {
  const out: string[] = [];
  for (const rec of records) {
    if (!rec.data) continue;
    if (rec.recordType !== "url" && rec.recordType !== "absolute-url" && rec.recordType !== "text") continue;
    try {
      out.push(new TextDecoder(rec.encoding || "utf-8").decode(rec.data));
    } catch {
      /* an unreadable record is skipped; with none left the scan says so */
    }
  }
  return out;
}

/** The one resident a card's records name, or why none: nothing readable, or not in the list. */
export function residentForCard(
  texts: string[],
  residents: PickableResident[],
): { resident: PickableResident } | { problem: "unreadable" | "unknown" } {
  const codes = texts.map((x) => residentCodeFrom(x)).filter((c): c is string => !!c);
  if (codes.length === 0) return { problem: "unreadable" };
  for (const code of codes) {
    const hit = residents.find((r) => r.id.toLowerCase() === code || (r.code ?? "").toLowerCase() === code.toLowerCase());
    if (hit) return { resident: hit };
  }
  return { problem: "unknown" };
}

export function ScanCardButton({
  strings: p,
  base,
  residents,
  onFound,
  job,
}: {
  strings: ScanCardStrings;
  /** Where a found resident opens when the picker is a plain page: `${base}?resident=<id>`. */
  base: string;
  residents: PickableResident[];
  onFound?: (r: PickableResident) => void;
  /** The job a waiting marker names where there is no Web NFC (iPhone). Without it there, no button. */
  job?: CardWaitJob;
}) {
  const router = useRouter();
  const supported = useSyncExternalStore(() => () => {}, hasWebNfc, () => false);
  const [state, setState] = useState<"idle" | "waiting" | "unreadable" | "unknown" | "denied">("idle");
  const [marker, setMarker] = useState<"off" | "on" | "refused">("off");
  const abort = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => abort.current?.abort();
  }, []);

  if (!supported) {
    if (!job) return null;
    return (
      <div className="flex flex-col gap-2">
        {marker !== "on" ? (
          <button
            type="button"
            onClick={async () => setMarker((await startCardWait(job)).ok ? "on" : "refused")}
            className="flex min-h-12 items-center justify-center gap-2 rounded-lg border border-primary px-4 text-base font-medium text-primary"
          >
            <Nfc aria-hidden className="h-5 w-5" />
            {p.scanCard}
          </button>
        ) : (
          <>
            <p role="status" className="rounded-lg border border-border bg-surface p-3 text-base text-foreground">
              {p.waitHold}
            </p>
            <button
              type="button"
              onClick={async () => {
                await stopCardWait();
                setMarker("off");
              }}
              className="inline-flex min-h-11 items-center self-start text-sm font-medium text-primary hover:underline"
            >
              {p.waitStop}
            </button>
          </>
        )}
        {marker === "refused" && (
          <p role="alert" className="rounded-lg border border-border bg-surface p-3 text-base text-foreground">
            {p.waitRefused}
          </p>
        )}
      </div>
    );
  }

  async function start() {
    abort.current?.abort();
    const ctl = new AbortController();
    abort.current = ctl;
    setState("waiting");
    try {
      const Reader = (window as unknown as { NDEFReader: new () => NdefReaderLike }).NDEFReader;
      const reader = new Reader();
      reader.onreadingerror = () => setState("unreadable");
      reader.onreading = (e) => {
        const found = residentForCard(textsOf(e.message.records), residents);
        if ("problem" in found) {
          setState(found.problem);
          return;
        }
        ctl.abort();
        setState("idle");
        if (onFound) onFound(found.resident);
        else router.push(`${base}?resident=${found.resident.id}`);
      };
      await reader.scan({ signal: ctl.signal });
    } catch {
      if (!ctl.signal.aborted) setState("denied");
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={start}
        className="flex min-h-12 items-center justify-center gap-2 rounded-lg border border-primary px-4 text-base font-medium text-primary"
      >
        <Nfc aria-hidden className="h-5 w-5" />
        {p.scanCard}
      </button>
      {state !== "idle" && (
        <p role={state === "waiting" ? "status" : "alert"} className="rounded-lg border border-border bg-surface p-3 text-base text-foreground">
          {state === "waiting" ? p.scanHold : state === "unreadable" ? p.scanUnreadable : state === "unknown" ? p.scanUnknown : p.scanDenied}
        </p>
      )}
    </div>
  );
}
