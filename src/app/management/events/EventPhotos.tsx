"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AttachmentUploader } from "@/components/AttachmentUploader";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { driveImageUrl } from "@/lib/google/drive-client";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useWriteCall } from "@/lib/use-write-form";
import type { ActionResult } from "@/lib/action-result";
import type { StaffEventPhoto } from "@/lib/events/staff";
import { removeEventPhoto, setEventCover, setEventPhotoMeme } from "./actions";

const buttonClass = "min-h-11 rounded border border-border px-3 text-sm font-medium text-foreground hover:bg-surface-hover disabled:opacity-60";

/**
 * An event's gallery. Whoever sees this holds events.run, which is what the upload route, every action here and the
 * table's own policy ask, so each control is drawn only for a login the action will accept. A new photo waits in
 * /photos/approve unless the uploader can approve it, and says so on its tile.
 */
export function EventPhotos({ eventId, photos }: { eventId: string; photos: StaffEventPhoto[] }) {
  const { t } = useI18n();
  const p = t.eventsAdmin.photos;
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [removing, setRemoving] = useState<StaffEventPhoto | null>(null);
  // One per action: an id kept from an unknown save must never reach another action.
  const coverCall = useWriteCall();
  const memeCall = useWriteCall();
  const removeCall = useWriteCall();

  function run(action: () => Promise<ActionResult>, after?: () => void) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) return setError(result.error);
      after?.();
      router.refresh();
    });
  }

  return (
    <section className="flex max-w-3xl flex-col gap-3 rounded border border-border bg-surface p-4">
      <h2 className="text-base font-semibold text-foreground">{p.heading} <span className="text-sm text-muted">({photos.length})</span></h2>
      <p className="text-sm text-muted">{p.hint}</p>
      <AttachmentUploader uploadUrl={`/api/events/${eventId}/photos`} dropHere={p.dropHere} hint={p.dropHint} onUploaded={() => router.refresh()} />
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      {photos.length === 0 ? (
        <p className="rounded border border-dashed border-border px-4 py-5 text-center text-sm text-muted">{p.empty}</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {photos.map((photo) => (
            <li key={photo.id} className="flex flex-col gap-2 rounded-lg border border-border p-2">
              <img src={driveImageUrl(photo.driveFileId)} alt={photo.fileName ?? p.fileFallback} loading="lazy" className="h-40 w-full rounded object-cover" />
              <p className="flex flex-wrap gap-2 text-xs">
                <span className={`rounded-full px-2 py-0.5 font-semibold ${photo.approved ? "bg-success/10 text-success" : "bg-primary/10 text-foreground"}`}>
                  {photo.approved ? p.approved : p.waiting}
                </span>
                {photo.isCover && <span className="rounded-full bg-primary/10 px-2 py-0.5 font-semibold text-foreground">{p.cover}</span>}
                {photo.isMeme && <span className="rounded-full bg-primary/10 px-2 py-0.5 font-semibold text-foreground">{p.meme}</span>}
              </p>
              <div className="flex flex-wrap gap-2">
                {!photo.isMeme && (
                  <button type="button" className={buttonClass} disabled={pending} onClick={() => run(() => coverCall((id) => setEventCover(eventId, photo.isCover ? null : photo.id, id)))}>
                    {photo.isCover ? p.clearCover : p.makeCover}
                  </button>
                )}
                <button type="button" className={buttonClass} disabled={pending} onClick={() => run(() => memeCall((id) => setEventPhotoMeme(eventId, photo.id, !photo.isMeme, id)))}>
                  {photo.isMeme ? p.unmarkMeme : p.markMeme}
                </button>
                <button type="button" className={buttonClass} disabled={pending} onClick={() => setRemoving(photo)}>
                  {p.remove}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <ConfirmDialog
        open={removing !== null}
        title={p.remove}
        body={p.removeConfirm}
        confirmLabel={t.common.remove}
        pending={pending}
        onCancel={() => setRemoving(null)}
        onConfirm={() => {
          if (!removing) return;
          run(() => removeCall((id) => removeEventPhoto(eventId, removing.id, id)), () => setRemoving(null));
        }}
      />
    </section>
  );
}
