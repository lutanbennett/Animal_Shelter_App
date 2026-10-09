"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ActionButton } from "@/components/ActionButton";
import { ACTION_ICONS } from "@/components/hub-icons";
import { useConfirm } from "@/components/ConfirmProvider";
import { FileDropZone, PendingFileList, useDeferredUploads } from "@/components/DeferredUploads";
import { driveImageUrl } from "@/lib/google/drive-client";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { OutingPhoto } from "@/lib/outreach/outings";
import { deleteOuting, deleteOutingPhoto, setOutingPhotoPublic } from "../../actions";

/**
 * A visit's photos, and the visit's Delete. Each photo has the Director's
 * "never public unless ticked" tick (0169, is_public defaults false). The
 * tick is recorded only: nothing on the website reads it yet, and the page
 * says so rather than letting it look published.
 */
export function OutingPhotos({ outingId, photos }: { outingId: string; photos: OutingPhoto[] }) {
  const { t } = useI18n();
  const o = t.outreach;
  const router = useRouter();
  const confirm = useConfirm();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const uploads = useDeferredUploads();

  function run(action: () => Promise<{ ok: boolean; error?: string }>, after?: () => void) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        setError(result.error ?? t.common.somethingWentWrong("—"));
        return;
      }
      if (after) after();
      else router.refresh();
    });
  }

  return (
    <>
      <section className="flex max-w-xl flex-col gap-4 rounded border border-border bg-surface p-4">
        <h2 className="text-lg font-semibold text-foreground">{o.photosHeading}</h2>
        {photos.length === 0 ? (
          <p className="text-sm text-muted">{o.noPhotos}</p>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {photos.map((p) => (
              <li key={p.id} className="flex flex-col gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element -- served by our own photo proxy */}
                <img
                  src={driveImageUrl(p.drive_file_id, 400)}
                  alt={p.file_name ?? ""}
                  className="aspect-square w-full rounded object-cover"
                />
                <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm text-foreground">
                  <input
                    type="checkbox"
                    checked={p.is_public}
                    disabled={pending}
                    onChange={(e) => {
                      const next = e.target.checked;
                      run(() => setOutingPhotoPublic(p.id, next));
                    }}
                    className="size-5"
                  />
                  {o.showOnWebsite}
                </label>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() =>
                    void confirm({ body: o.removePhotoConfirm, confirmLabel: o.removePhoto }).then((ok) => {
                      if (ok) run(() => deleteOutingPhoto(p.id));
                    })
                  }
                  className="inline-flex min-h-11 items-center text-sm text-danger hover:underline disabled:opacity-50"
                >
                  {o.removePhoto}
                </button>
              </li>
            ))}
          </ul>
        )}
        <p className="text-xs text-muted">{o.publicNote}</p>

        <div className="flex flex-col gap-2 border-t border-border pt-4">
          <span className="text-sm font-medium text-muted">{o.addPhotos}</span>
          <FileDropZone label={o.dropHere} hint={o.dropHint} onFiles={uploads.addFiles} />
          <PendingFileList
            files={uploads.files}
            onRemove={uploads.uploading ? null : uploads.removeFile}
            onRetry={(item) =>
              void uploads.upload(`/api/outreach/${outingId}/photos`, [item]).then(() => router.refresh())
            }
          />
          {uploads.queued.length > 0 && (
            <div>
              <ActionButton
                type="button"
                variant="primary"
                icon={ACTION_ICONS.uploadImage}
                disabled={uploads.uploading}
                onClick={() =>
                  void uploads.upload(`/api/outreach/${outingId}/photos`).then(() => router.refresh())
                }
              >
                {uploads.uploading ? t.common.uploading : o.uploadPhotos}
              </ActionButton>
            </div>
          )}
        </div>
      </section>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div>
        <ActionButton
          type="button"
          variant="danger"
          icon={ACTION_ICONS.delete}
          disabled={pending}
          onClick={() =>
            void confirm({ body: o.deleteConfirm, confirmLabel: o.delete }).then((ok) => {
              if (ok) run(() => deleteOuting(outingId), () => router.push("/outreach"));
            })
          }
        >
          {o.delete}
        </ActionButton>
      </div>
    </>
  );
}
