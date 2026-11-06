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
import type { WaitingProjectPhoto } from "@/lib/photos/approval";
import { approveProjectPhotos, removeWaitingProjectPhoto, markPhotosPrivateOnly } from "./actions";

/**
 * Photos filed in a project folder, waiting beside the resident photos (0316). One at a time on purpose: a project photo
 * goes to the public Our work page, so each is looked at. Both actions ask photos.approve; the buttons are drawn only
 * when `canApprove` (that same activity) is true, and it defaults to false so a caller that forgets offers nothing.
 */
export function ProjectPhotoQueue({ photos, canApprove = false }: { photos: WaitingProjectPhoto[]; canApprove?: boolean }) {
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
      const result = await privateCall((requestId) => markPhotosPrivateOnly([id], "project", requestId));
      setMessage(result.ok ? { ok: true, text: q.privateOnlyDone(result.marked) } : { ok: false, text: result.error });
      router.refresh();
    });
  }

  if (photos.length === 0) return null;

  function approve(id: string) {
    setMessage(null);
    startTransition(async () => {
      const result = await approveCall((requestId) => approveProjectPhotos([id], requestId));
      setMessage(result.ok ? { ok: true, text: q.approved(result.approved) } : { ok: false, text: result.error });
      router.refresh();
    });
  }

  async function remove(photo: WaitingProjectPhoto) {
    const yes = await confirm({
      title: q.removeConfirmTitle,
      body: q.projects.removeBody(photo.projectName ?? q.projects.aProject),
      consequences: [q.removeConsequence],
      confirmLabel: q.removeConfirm,
    });
    if (!yes) return;
    setMessage(null);
    startTransition(async () => {
      const result = await removeCall((requestId) => removeWaitingProjectPhoto(photo.id, requestId));
      setMessage(result.ok ? { ok: true, text: result.driveWarning ?? q.removed } : { ok: false, text: result.error });
      router.refresh();
    });
  }

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold text-foreground">{q.projects.heading(photos.length)}</h2>
      {message && (
        <p role="status" className={`rounded border px-3 py-2 text-sm ${message.ok ? "border-success/40 text-success" : "border-danger/40 text-danger"}`}>
          {message.text}
        </p>
      )}
      <ul className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {photos.map((photo) => {
          const title = photo.projectName ?? q.projects.aProject;
          return (
            <li key={photo.id} className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-3">
              <img
                src={driveImageUrl(photo.driveFileId, 800)}
                alt={q.projects.photoAlt(title)}
                className="max-h-[70vh] w-full rounded bg-background object-contain"
                loading="lazy"
              />
              <div className="flex flex-col gap-1">
                <p className="text-lg font-semibold text-foreground" lang="und">{title}</p>
                <p className="text-sm text-muted">{q.addedBy(photo.addedBy, formatDate(photo.uploadedAt, locale))}</p>
              </div>
              {canApprove && (
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
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
