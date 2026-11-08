"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Trash2, EyeOff } from "lucide-react";
import { ActionButton } from "@/components/ActionButton";
import { useConfirm } from "@/components/ConfirmProvider";
import { formatDate } from "@/lib/format";
import { driveImageUrl } from "@/lib/google/drive-client";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useWriteCall } from "@/lib/use-write-form";
import type { WaitingEventPhoto } from "@/lib/photos/approval";
import { approveEventPhotos, removeWaitingEventPhoto, markPhotosPrivateOnly } from "./actions";

/**
 * Photos filed on a fundraising event, waiting beside the resident photos (0314). One at a time on purpose: an event photo
 * goes to the public events page, so each is looked at. The whole component is drawn only on a page that already asked
 * photos.approve, the activity both actions here ask.
 */
export function EventPhotoQueue({ photos }: { photos: WaitingEventPhoto[] }) {
  const { t, locale } = useI18n();
  const q = t.photoApproval;
  const router = useRouter();
  const confirm = useConfirm();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  // One per action: an id kept from an unknown save must never reach another action.
  const approveCall = useWriteCall();
  const removeCall = useWriteCall();
  const privateCall = useWriteCall();

  function markPrivate(id: string) {
    setMessage(null);
    startTransition(async () => {
      const result = await privateCall((requestId) => markPhotosPrivateOnly([id], "event", requestId));
      setMessage(result.ok ? { ok: true, text: q.privateOnlyDone(result.marked) } : { ok: false, text: result.error });
      router.refresh();
    });
  }

  if (photos.length === 0) return null;

  function approve(id: string) {
    setMessage(null);
    startTransition(async () => {
      const result = await approveCall((requestId) => approveEventPhotos([id], requestId));
      setMessage(result.ok ? { ok: true, text: q.approved(result.approved) } : { ok: false, text: result.error });
      router.refresh();
    });
  }

  async function remove(photo: WaitingEventPhoto) {
    const yes = await confirm({
      title: q.removeConfirmTitle,
      body: q.events.removeBody(photo.eventTitle ?? q.events.anEvent),
      consequences: [q.removeConsequence],
      confirmLabel: q.removeConfirm,
    });
    if (!yes) return;
    setMessage(null);
    startTransition(async () => {
      const result = await removeCall((requestId) => removeWaitingEventPhoto(photo.id, requestId));
      setMessage(result.ok ? { ok: true, text: result.driveWarning ?? q.removed } : { ok: false, text: result.error });
      router.refresh();
    });
  }

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold text-foreground">{q.events.heading(photos.length)}</h2>
      {message && (
        <p role="status" className={`rounded border px-3 py-2 text-sm ${message.ok ? "border-success/40 text-success" : "border-danger/40 text-danger"}`}>
          {message.text}
        </p>
      )}
      <ul className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {photos.map((photo) => {
          const title = photo.eventTitle ?? q.events.anEvent;
          return (
            <li key={photo.id} className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-3">
              <img
                src={driveImageUrl(photo.driveFileId, 800)}
                alt={q.events.photoAlt(title)}
                className="max-h-[70vh] w-full rounded bg-background object-contain"
                loading="lazy"
              />
              <div className="flex flex-col gap-1">
                <p className="text-lg font-semibold text-foreground" lang="und">{title}</p>
                {photo.eventDate && <p className="text-sm text-foreground">{q.events.eventOn(formatDate(photo.eventDate, locale))}</p>}
                <p className="text-sm text-muted">{q.addedBy(photo.addedBy, formatDate(photo.uploadedAt, locale))}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <ActionButton icon={Check} variant="primary" disabled={pending} onClick={() => approve(photo.id)}>
                  {q.approve}
                </ActionButton>
                <ActionButton icon={EyeOff} disabled={pending} onClick={() => markPrivate(photo.id)}>
                  {q.privateOnly}
                </ActionButton>
                <ActionButton icon={Trash2} disabled={pending} onClick={() => remove(photo)}>
                  {q.remove}
                </ActionButton>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
