"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { driveImageUrl } from "@/lib/google/drive-client";
import { saveAppealPhotos } from "./actions";

export type PhotoCandidate = { attachmentId: string; fileId: string; name: string };
export type PhotoChosen = { attachmentId: string; isCover: boolean; isGraphic: boolean };

/**
 * Which of the resident's photos the appeal shows. Only non-Medical images are
 * offered (the page that renders this filters them, the database refuses the
 * rest), and each chosen photo can be marked distressing so the public page
 * blurs it behind a warning.
 */
export function AppealPhotosEditor({
  appealId,
  candidates,
  chosen,
}: {
  appealId: string;
  candidates: PhotoCandidate[];
  chosen: PhotoChosen[];
}) {
  const { t } = useI18n();
  const p = t.appealsAdmin.photos;
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [state, setState] = useState<Record<string, { isCover: boolean; isGraphic: boolean }>>(
    Object.fromEntries(chosen.map((c) => [c.attachmentId, { isCover: c.isCover, isGraphic: c.isGraphic }])),
  );

  const picked = candidates.filter((c) => state[c.attachmentId]);
  const cover = picked.find((c) => state[c.attachmentId].isCover)?.attachmentId ?? null;

  function toggle(id: string, on: boolean) {
    setMessage(null);
    setState((prev) => {
      const next = { ...prev };
      if (on) next[id] = { isCover: false, isGraphic: false };
      else delete next[id];
      return next;
    });
  }
  function makeCover(id: string) {
    setMessage(null);
    setState((prev) => Object.fromEntries(Object.entries(prev).map(([k, v]) => [k, { ...v, isCover: k === id }])));
  }
  function setGraphic(id: string, on: boolean) {
    setMessage(null);
    setState((prev) => ({ ...prev, [id]: { ...prev[id], isGraphic: on } }));
  }

  function save() {
    setMessage(null);
    startTransition(async () => {
      const result = await saveAppealPhotos(
        appealId,
        cover,
        picked.map((c) => ({ attachmentId: c.attachmentId, isGraphic: state[c.attachmentId].isGraphic })),
      );
      if (!result.ok) return setMessage({ type: "error", text: result.error });
      setMessage({ type: "ok", text: p.saved });
      router.refresh();
    });
  }

  return (
    <section className="flex max-w-3xl flex-col gap-3 rounded border border-border bg-surface p-4">
      <h2 className="text-base font-semibold text-foreground">{p.heading}</h2>
      <p className="text-sm text-muted">{p.hint}</p>
      <p className="text-sm text-muted">{p.medicalNote}</p>
      {candidates.length === 0 ? (
        <p className="rounded border border-border bg-background px-3 py-2 text-sm text-muted">{p.none}</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {candidates.map((c) => {
            const on = !!state[c.attachmentId];
            return (
              <li key={c.attachmentId} className={`flex flex-col gap-2 rounded-lg border-2 p-2 ${on ? "border-primary" : "border-border"}`}>
                <img src={driveImageUrl(c.fileId)} alt={c.name} loading="lazy" className="h-40 w-full rounded object-cover" />
                <label className="flex min-h-11 items-center gap-2 text-sm text-foreground">
                  <input type="checkbox" checked={on} onChange={(e) => toggle(c.attachmentId, e.target.checked)} />
                  {p.show}
                </label>
                {on && (
                  <>
                    <label className="flex min-h-11 items-center gap-2 text-sm text-foreground">
                      <input type="radio" name="appeal-cover" checked={state[c.attachmentId].isCover} onChange={() => makeCover(c.attachmentId)} />
                      {state[c.attachmentId].isCover ? p.cover : p.makeCover}
                    </label>
                    <label className="flex min-h-11 items-start gap-2 text-sm text-foreground">
                      <input className="mt-1" type="checkbox" checked={state[c.attachmentId].isGraphic} onChange={(e) => setGraphic(c.attachmentId, e.target.checked)} />
                      <span className="flex flex-col">
                        {p.graphic}
                        <span className="text-xs text-muted">{p.graphicHint}</span>
                      </span>
                    </label>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {picked.length > 0 && !cover && <p className="text-xs text-muted">{p.noCover}</p>}
      {message && (
        <p role={message.type === "error" ? "alert" : "status"} className={`rounded border px-3 py-2 text-sm ${message.type === "error" ? "border-danger bg-danger/10 text-danger" : "border-success/50 bg-success/10 text-success"}`}>
          {message.text}
        </p>
      )}
      {candidates.length > 0 && (
        <button type="button" onClick={save} disabled={pending} className="min-h-11 self-start rounded bg-primary px-5 text-base font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-60">
          {pending ? p.saving : p.save}
        </button>
      )}
    </section>
  );
}
