"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { AttachmentUploader } from "@/components/AttachmentUploader";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { driveImageUrl } from "@/lib/google/drive-client";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { ProjectFolder, ProjectPhoto } from "@/lib/projects/queries";
import { deleteProjectPhoto, setProjectCoverPhoto, updateProjectPhotoCaption } from "../actions";

const IMAGE_EXTENSIONS = /\.(jpe?g|png|webp|heic|heif|gif)$/i;

function isLikelyImage(fileName: string | null) {
  return !!fileName && IMAGE_EXTENSIONS.test(fileName);
}

const inputClass =
  "w-full rounded border border-border bg-background px-2 py-1 text-xs text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40";

/**
 * A folder's photos: drop zone (anyone who can add photos), grid with
 * captions, and — for staff — cover selection, caption editing and
 * removal. Volunteers see the grid and the uploader only.
 */
export function PhotoSection({
  folder,
  photos,
  canWrite,
}: {
  folder: ProjectFolder;
  photos: ProjectPhoto[];
  canWrite: boolean;
}) {
  const { t, locale } = useI18n();
  const p = t.projects.photos;
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [removing, setRemoving] = useState<ProjectPhoto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function run(action: () => Promise<{ error?: string }>, after?: () => void) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result.error) {
        setError(result.error);
        return;
      }
      after?.();
      router.refresh();
    });
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-foreground">
          {p.heading} <span className="text-sm text-muted">({photos.length})</span>
        </h2>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="shrink-0 rounded border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-surface-hover"
        >
          {open ? t.common.close : p.add}
        </button>
      </div>

      {open && (
        <AttachmentUploader
          uploadUrl={`/api/projects/${folder.id}/photos`}
          dropHere={p.dropHere}
          hint={p.dropHint}
          onUploaded={() => router.refresh()}
        />
      )}

      {error && <p className="text-sm text-danger">{error}</p>}

      {photos.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {photos.map((photo) => {
            const url = driveImageUrl(photo.drive_file_id);
            const image = isLikelyImage(photo.file_name);
            const isCover = folder.cover_attachment_id === photo.id;
            const caption = (locale === "th" && photo.caption_th) || photo.caption;
            return (
              <figure
                key={photo.id}
                className="group flex flex-col overflow-hidden rounded border border-border bg-surface"
              >
                <div className="relative">
                  <a href={url} target="_blank" rel="noreferrer">
                    {image ? (
                      <img
                        src={url}
                        alt={caption ?? photo.file_name ?? p.fileFallback}
                        loading="lazy"
                        className="aspect-square w-full object-cover"
                      />
                    ) : (
                      <span className="flex aspect-square w-full flex-col items-center justify-center gap-1 p-2 text-center text-xs text-muted">
                        <span aria-hidden>📄</span>
                        <span className="line-clamp-2 break-all">
                          {photo.file_name ?? p.fileFallback}
                        </span>
                      </span>
                    )}
                  </a>
                  {isCover && (
                    <span className="absolute left-1 top-1 flex items-center gap-1 rounded-full bg-primary/90 px-2 py-0.5 text-xs font-medium text-primary-foreground">
                      <Star aria-hidden="true" className="h-3 w-3" />
                      {p.cover}
                    </span>
                  )}
                  {canWrite && (
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => setRemoving(photo)}
                      aria-label={p.remove}
                      className="absolute right-1 top-1 rounded-full bg-black/60 px-1.5 text-xs text-white hover:bg-danger disabled:opacity-60 md:hidden md:group-hover:block"
                    >
                      &times;
                    </button>
                  )}
                </div>

                <figcaption className="flex flex-col gap-1 p-2">
                  {editing === photo.id ? (
                    <form
                      className="flex flex-col gap-1"
                      onSubmit={(e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        run(
                          () => updateProjectPhotoCaption(folder.id, photo.id, formData),
                          () => setEditing(null),
                        );
                      }}
                    >
                      <input
                        name="caption"
                        defaultValue={photo.caption ?? ""}
                        placeholder={p.caption}
                        autoFocus
                        maxLength={300}
                        className={inputClass}
                      />
                      <input
                        name="captionTh"
                        defaultValue={photo.caption_th ?? ""}
                        placeholder={p.captionTh}
                        maxLength={300}
                        className={inputClass}
                      />
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setEditing(null)}
                          disabled={isPending}
                          className="rounded border border-border px-2 py-0.5 text-xs text-foreground hover:bg-surface-hover disabled:opacity-50"
                        >
                          {t.common.cancel}
                        </button>
                        <button
                          type="submit"
                          disabled={isPending}
                          className="rounded bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
                        >
                          {t.common.save}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      {caption ? (
                        <span className="line-clamp-2 text-xs text-foreground">{caption}</span>
                      ) : canWrite ? (
                        <button
                          type="button"
                          onClick={() => setEditing(photo.id)}
                          className="text-left text-xs text-muted hover:text-foreground"
                        >
                          {p.captionPlaceholder}
                        </button>
                      ) : null}
                      {canWrite && (
                        <span className="flex flex-wrap gap-x-2 text-xs">
                          {caption && (
                            <button
                              type="button"
                              onClick={() => setEditing(photo.id)}
                              className="text-muted hover:text-foreground"
                            >
                              {p.editCaption}
                            </button>
                          )}
                          {image && (
                            <button
                              type="button"
                              disabled={isPending}
                              onClick={() =>
                                run(() => setProjectCoverPhoto(folder.id, isCover ? null : photo.id))
                              }
                              className="text-muted hover:text-foreground disabled:opacity-50"
                            >
                              {isCover ? p.clearCover : p.setCover}
                            </button>
                          )}
                        </span>
                      )}
                    </>
                  )}
                </figcaption>
              </figure>
            );
          })}
        </div>
      ) : (
        <p className="rounded border border-dashed border-border px-4 py-5 text-center text-sm text-muted">
          {p.empty}
        </p>
      )}

      <ConfirmDialog
        open={removing !== null}
        title={p.remove}
        body={p.removeConfirm}
        confirmLabel={t.common.remove}
        pending={isPending}
        onCancel={() => setRemoving(null)}
        onConfirm={() => {
          if (!removing) return;
          run(() => deleteProjectPhoto(folder.id, removing.id), () => setRemoving(null));
        }}
      />
    </section>
  );
}
