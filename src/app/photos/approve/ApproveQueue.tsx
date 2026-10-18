"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Repeat, Trash2, X } from "lucide-react";
import { ActionButton } from "@/components/ActionButton";
import { useConfirm } from "@/components/ConfirmProvider";
import { formatDate } from "@/lib/format";
import { driveImageUrl } from "@/lib/google/drive-client";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { WaitingPhoto } from "@/lib/photos/approval";
import { ResidentPicker } from "@/app/medical/ResidentPicker";
import type { PickableResident } from "@/lib/medical/residents";
import { approvePhotos, removeWaitingPhoto } from "./actions";
import { reassignWaitingPhoto } from "./pending-actions";

/**
 * The Photos to approve list: each photo large enough to judge, the resident named beside it, Approve as the easy
 * path and Remove as the considered one. Approving several at once is only ever on photos ticked one by one:
 * there is no "select all" and no button that takes the page.
 */
export function ApproveQueue({
  photos,
  canRemove,
  canReassign,
  residents,
  loadError,
  othersWaiting,
}: {
  photos: WaitingPhoto[];
  canRemove: boolean;
  /** Fix a photo the volunteer tagged to the wrong resident, before approving. */
  canReassign: boolean;
  residents: PickableResident[];
  loadError: string | null;
  /** Photos tagged to an enclosure are waiting above this list, so "nothing is waiting" would be untrue. */
  othersWaiting: boolean;
}) {
  const { t, locale } = useI18n();
  const q = t.photoApproval;
  const router = useRouter();
  const confirm = useConfirm();
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [changing, setChanging] = useState<string | null>(null);
  const [changeQuery, setChangeQuery] = useState("");

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function approve(ids: string[], confirmFirst: boolean) {
    // Ask first, transition after: a confirm awaited inside startTransition never lets the dialog commit.
    if (confirmFirst) {
      const names = photos.filter((p) => ids.includes(p.id)).map((p) => p.residentName);
      const ok = await confirm({
        title: q.bulkConfirmTitle(ids.length),
        body: q.bulkConfirmBody(names.join(", ")),
        confirmLabel: q.approveN(ids.length),
      });
      if (!ok) return;
    }
    startTransition(async () => {
      setMessage(null);
      const result = await approvePhotos(ids);
      if (result.ok) {
        setSelected(new Set());
        setMessage({ ok: true, text: q.approved(result.approved) });
        router.refresh();
      } else {
        setMessage({ ok: false, text: result.error });
      }
    });
  }

  function reassign(photo: WaitingPhoto, to: PickableResident) {
    startTransition(async () => {
      setMessage(null);
      const result = await reassignWaitingPhoto(photo.id, to.id);
      setChanging(null);
      setChangeQuery("");
      if (result.ok) {
        setMessage({ ok: true, text: result.driveWarning ?? q.pending.reassigned(to.name) });
        router.refresh();
      } else {
        setMessage({ ok: false, text: result.error });
      }
    });
  }

  async function remove(photo: WaitingPhoto) {
    // Ask first, transition after: a confirm awaited inside startTransition never lets the dialog commit.
    const ok = await confirm({
      title: q.removeConfirmTitle,
      body: q.removeConfirmBody(photo.residentName),
      consequences: [q.removeConsequence],
      confirmLabel: q.removeConfirm,
    });
    if (!ok) return;
    startTransition(async () => {
      setMessage(null);
      const result = await removeWaitingPhoto(photo.id);
      if (result.ok) {
        setSelected((prev) => {
          const next = new Set(prev);
          next.delete(photo.id);
          return next;
        });
        setMessage({ ok: true, text: result.driveWarning ?? q.removed });
        router.refresh();
      } else {
        setMessage({ ok: false, text: result.error });
      }
    });
  }

  if (photos.length === 0 && othersWaiting) {
    return message ? <p role="status" className={`rounded border px-3 py-2 text-sm ${message.ok ? "border-success/40 text-success" : "border-danger/40 text-danger"}`}>{message.text}</p> : null;
  }

  if (photos.length === 0) {
    return (
      <section className="rounded-lg border border-border bg-surface p-4">
        <p className="text-base text-muted">{q.empty}</p>
        {message && <p className="mt-2 text-sm text-success">{message.text}</p>}
      </section>
    );
  }

  const chosen = photos.filter((p) => selected.has(p.id)).map((p) => p.id);

  return (
    <div className="flex flex-col gap-4">
      {message && (
        <p role="status" className={`rounded border px-3 py-2 text-sm ${message.ok ? "border-success/40 text-success" : "border-danger/40 text-danger"}`}>
          {message.text}
        </p>
      )}
      <ul className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {photos.map((photo) => (
          <li key={photo.id} className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-3">
            {/* The original at 800 px: big enough to judge who is in it, and what else is in the picture. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={driveImageUrl(photo.driveFileId, 800)}
              alt={q.photoAlt(photo.residentName)}
              className="max-h-[70vh] w-full rounded bg-background object-contain"
              loading="lazy"
            />
            <div className="flex flex-col gap-1">
              <Link href={`/residents/${photo.residentId}`} className="text-lg font-semibold text-foreground underline-offset-2 hover:underline">
                {photo.residentName}
              </Link>
              <p className="text-sm text-muted">{photo.residentCode}</p>
              <p className="text-sm text-muted">{q.addedBy(photo.addedBy, formatDate(photo.uploadedAt, locale))}</p>
            </div>
            <label className="flex min-h-11 items-center gap-3 text-sm text-foreground">
              <input
                type="checkbox"
                className="h-5 w-5"
                checked={selected.has(photo.id)}
                onChange={() => toggle(photo.id)}
                disabled={pending}
              />
              {q.selectToApprove}
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <ActionButton icon={Check} variant="primary" disabled={pending} onClick={() => approve([photo.id], false)}>
                {q.approve}
              </ActionButton>
              {canReassign && (
                <ActionButton
                  icon={Repeat}
                  compact
                  disabled={pending}
                  onClick={() => {
                    setChangeQuery("");
                    setChanging(changing === photo.id ? null : photo.id);
                  }}
                >
                  {changing === photo.id ? q.pending.cancelChange : q.pending.changeResident}
                </ActionButton>
              )}
              {canRemove && (
                <ActionButton icon={Trash2} variant="danger" compact disabled={pending} onClick={() => remove(photo)}>
                  {q.remove}
                </ActionButton>
              )}
            </div>
            {canReassign && changing === photo.id && (
              <div className="flex flex-col gap-2">
                <p className="text-sm text-muted">{q.pending.changeHelp(photo.residentName)}</p>
                <ResidentPicker
                  t={t}
                  locale={locale}
                  base="/photos/approve"
                  residents={residents.filter((r) => r.id !== photo.residentId)}
                  query={changeQuery}
                  error={loadError}
                  onPick={(r) => reassign(photo, r)}
                  onQueryChange={setChangeQuery}
                />
              </div>
            )}
          </li>
        ))}
      </ul>

      {chosen.length > 0 && (
        <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center gap-3 border-t border-border bg-background p-3 md:mx-0 md:rounded-lg md:border">
          <ActionButton icon={Check} variant="primary" disabled={pending} onClick={() => approve(chosen, true)}>
            {q.approveN(chosen.length)}
          </ActionButton>
          <ActionButton icon={X} disabled={pending} onClick={() => setSelected(new Set())}>
            {q.clearSelection}
          </ActionButton>
        </div>
      )}
    </div>
  );
}
