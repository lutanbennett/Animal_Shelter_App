"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { Check, PawPrint, Search, Trash2, X } from "lucide-react";
import { ActionButton } from "@/components/ActionButton";
import { useConfirm } from "@/components/ConfirmProvider";
import { ResidentPicker } from "@/app/medical/ResidentPicker";
import { placeName } from "@/lib/enclosures/names";
import { formatDate } from "@/lib/format";
import { driveImageUrl } from "@/lib/google/drive-client";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { PickableResident } from "@/lib/medical/residents";
import type { PendingPhoto } from "@/lib/photos/pending";
import { assignPendingPhoto, discardPendingPhoto } from "./pending-actions";

/** A resident the approver has chosen for one photo; the name is kept so the confirmation can say it. */
type Chosen = { id: string; label: string };

/**
 * Photos tagged to an enclosure by someone who did not know the animal (0218). Each is its own card: the picture
 * large, then the residents who were in that enclosure on the day WITH THEIR OWN PHOTOS (a placement record says
 * where an animal was, not who is in the picture, so the approver compares faces and never names alone), then a
 * search for anyone else. One photo can go to several residents. Assigning approves it, unless the approver asks to
 * keep it off the website. Nothing here can make a photo public except pressing the one button that says so.
 */
export function PendingQueue({ photos, residents, loadError }: { photos: PendingPhoto[]; residents: PickableResident[]; loadError: string | null }) {
  const { t, locale } = useI18n();
  const p = t.photoApproval.pending;
  const confirm = useConfirm();
  const [busy, startTransition] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  // Per photo: who is chosen, whether to keep it private, whether the search is open and what was typed.
  const [chosen, setChosen] = useState<Record<string, Chosen[]>>({});
  const [priv, setPriv] = useState<Record<string, boolean>>({});
  const [searching, setSearching] = useState<Record<string, boolean>>({});
  const [query, setQuery] = useState<Record<string, string>>({});

  if (photos.length === 0) return null;

  const nameOf = (r: PickableResident) => (locale === "th" && r.thaiName?.trim() ? r.thaiName.trim() : r.name);
  const labelOf = (r: PickableResident) => (r.code ? `${nameOf(r)} · ${r.code}` : nameOf(r));

  function toggle(photoId: string, who: Chosen) {
    setChosen((prev) => {
      const now = prev[photoId] ?? [];
      return { ...prev, [photoId]: now.some((c) => c.id === who.id) ? now.filter((c) => c.id !== who.id) : [...now, who] };
    });
  }

  function assign(photo: PendingPhoto) {
    const who = chosen[photo.id] ?? [];
    const approve = !priv[photo.id];
    startTransition(async () => {
      setMessage(null);
      const result = await assignPendingPhoto(photo.id, who.map((c) => c.id), approve);
      setMessage(
        result.ok
          ? { ok: true, text: result.driveWarning ?? p.assigned(result.assigned, approve) }
          : { ok: false, text: result.error },
      );
    });
  }

  async function discard(photo: PendingPhoto) {
    // Ask first, transition after: a confirm awaited inside startTransition never lets the dialog commit.
    const ok = await confirm({
      title: p.discardConfirmTitle,
      body: p.discardConfirmBody,
      consequences: [t.photoApproval.removeConsequence],
      confirmLabel: p.discardConfirm,
    });
    if (!ok) return;
    startTransition(async () => {
      setMessage(null);
      const result = await discardPendingPhoto(photo.id);
      setMessage(result.ok ? { ok: true, text: result.driveWarning ?? p.discarded } : { ok: false, text: result.error });
    });
  }

  return (
    <section aria-labelledby="pending-heading" className="flex flex-col gap-4">
      <div>
        <h2 id="pending-heading" className="text-xl font-semibold text-foreground">
          {p.heading(photos.length)}
        </h2>
        <p className="text-base text-muted">{p.intro}</p>
      </div>
      {message && (
        <p role="status" className={`rounded border px-3 py-2 text-sm ${message.ok ? "border-success/40 text-success" : "border-danger/40 text-danger"}`}>
          {message.text}
        </p>
      )}
      <ul className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {photos.map((photo) => {
          const place = photo.enclosureName ? placeName(locale, photo.enclosureName, photo.enclosureNameTh) : p.someEnclosure;
          const who = chosen[photo.id] ?? [];
          const isChosen = (id: string) => who.some((c) => c.id === id);
          const candidateIds = new Set(photo.candidates.map((c) => c.residentId));
          const extras = who.filter((c) => !candidateIds.has(c.id));
          const approve = !priv[photo.id];
          return (
            <li key={photo.id} className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-3">
              <img
                src={driveImageUrl(photo.driveFileId, 800)}
                alt={p.photoAlt(place)}
                className="max-h-[70vh] w-full rounded bg-background object-contain"
                loading="lazy"
              />
              <div className="flex flex-col gap-1">
                <p className="break-words text-lg font-semibold text-foreground">{p.taken(place)}</p>
                <p className="text-sm text-muted">{t.photoApproval.addedBy(photo.addedBy, formatDate(photo.takenAt, locale))}</p>
              </div>

              <div className="flex flex-col gap-2">
                <h3 className="text-base font-semibold text-foreground">{p.wereThere(place, formatDate(photo.takenAt, locale))}</h3>
                {photo.candidates.length === 0 ? (
                  <p className="text-sm text-muted">{p.noneThere}</p>
                ) : (
                  <>
                    <p className="text-sm text-muted">{p.compareFaces}</p>
                    <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {photo.candidates.map((c) => {
                        const on = isChosen(c.residentId);
                        const label = c.code ? `${c.name} · ${c.code}` : c.name;
                        return (
                          <li key={c.residentId}>
                            <button
                              type="button"
                              aria-pressed={on}
                              disabled={busy}
                              onClick={() => toggle(photo.id, { id: c.residentId, label })}
                              className={`flex min-h-11 w-full flex-col items-center gap-1 rounded-lg border-2 p-2 text-center ${
                                on ? "border-primary bg-primary/10 ring-2 ring-primary/50" : "border-border bg-background"
                              }`}
                            >
                              <span className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-lg border border-border bg-surface">
                                {c.photoFileId ? (
                                  <Image src={driveImageUrl(c.photoFileId, 400)} alt={p.candidatePhotoAlt(c.name)} fill sizes="96px" className="object-cover" />
                                ) : (
                                  <PawPrint aria-label={p.noPhoto} role="img" className="h-10 w-10 text-muted" />
                                )}
                              </span>
                              <span className="w-full break-words text-base font-semibold leading-tight text-foreground">{c.name}</span>
                              {c.code && <span className="w-full break-words text-xs text-muted">{c.code}</span>}
                              {on && <span className="text-xs font-medium text-primary">{p.chosenMark}</span>}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </>
                )}
                {extras.length > 0 && (
                  <ul className="flex flex-wrap gap-2">
                    {extras.map((c) => (
                      <li key={c.id}>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => toggle(photo.id, c)}
                          aria-label={p.takeOff(c.label)}
                          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-primary bg-primary/10 px-4 text-base font-medium text-foreground"
                        >
                          {c.label}
                          <X aria-hidden className="h-4 w-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <ActionButton
                  icon={Search}
                  compact
                  disabled={busy}
                  onClick={() => setSearching((prev) => ({ ...prev, [photo.id]: !prev[photo.id] }))}
                >
                  {searching[photo.id] ? p.hideSearch : p.someoneElse}
                </ActionButton>
                {searching[photo.id] && (
                  <ResidentPicker
                    t={t}
                    locale={locale}
                    base="/photos/approve"
                    residents={residents}
                    query={query[photo.id] ?? ""}
                    error={loadError}
                    onPick={(r) => {
                      if (!isChosen(r.id)) toggle(photo.id, { id: r.id, label: labelOf(r) });
                      setQuery((prev) => ({ ...prev, [photo.id]: "" }));
                      setSearching((prev) => ({ ...prev, [photo.id]: false }));
                    }}
                    onQueryChange={(q) => setQuery((prev) => ({ ...prev, [photo.id]: q }))}
                  />
                )}
              </div>

              <p className="text-sm text-foreground">{who.length === 0 ? p.nobodyYet : p.chosenList(who.map((c) => c.label).join(", "))}</p>
              <label className="flex min-h-11 items-start gap-3 text-sm text-foreground">
                <input
                  type="checkbox"
                  className="mt-0.5 h-5 w-5 shrink-0"
                  checked={!approve}
                  disabled={busy}
                  onChange={(e) => setPriv((prev) => ({ ...prev, [photo.id]: e.target.checked }))}
                />
                <span>
                  {p.keepPrivate}
                  <span className="block text-xs text-muted">{p.keepPrivateHelp}</span>
                </span>
              </label>
              <div className="flex flex-wrap items-center gap-3">
                <ActionButton icon={Check} variant="primary" disabled={busy || who.length === 0} onClick={() => assign(photo)}>
                  {approve ? p.assignApprove(who.length) : p.assignPrivate(who.length)}
                </ActionButton>
                <ActionButton icon={Trash2} variant="danger" compact disabled={busy} onClick={() => discard(photo)}>
                  {p.discard}
                </ActionButton>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
