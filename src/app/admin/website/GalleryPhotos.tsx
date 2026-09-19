"use client";

import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import { driveImageUrl } from "@/lib/google/drive-client";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { deleteGalleryPhoto, moveGalleryPhoto, uploadGalleryPhoto } from "./actions";

export type GalleryPhotoRow = { id: string; drive_file_id: string };

export function GalleryPhotos({ photos }: { photos: GalleryPhotoRow[] }) {
  const { t } = useI18n();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File | undefined) {
    if (!file) return;
    setMessage(null);
    const formData = new FormData();
    formData.append("file", file);
    startTransition(async () => {
      const result = await uploadGalleryPhoto(formData);
      if (result && "error" in result) setMessage(result.error);
    });
  }

  function handleDelete(photoId: string) {
    if (!window.confirm(t.admin.website.gallery.removeConfirm)) return;
    setMessage(null);
    startTransition(async () => {
      try {
        await deleteGalleryPhoto(photoId);
      } catch (err) {
        setMessage(err instanceof Error ? err.message : t.common.failedToRemove);
      }
    });
  }

  function handleMove(photoId: string, direction: "up" | "down") {
    setMessage(null);
    startTransition(async () => {
      try {
        await moveGalleryPhoto(photoId, direction);
      } catch (err) {
        setMessage(err instanceof Error ? err.message : t.common.failedToReorder);
      }
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded border border-border bg-surface p-4">
      <div>
        <h2 className="text-base font-semibold text-foreground">
          {t.admin.website.gallery.heading}
        </h2>
        <p className="text-sm text-muted">{t.admin.website.gallery.subtitle}</p>
      </div>

      {photos.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {photos.map((photo, index) => (
            <div
              key={photo.id}
              className="flex flex-col gap-2 rounded border border-border p-2"
            >
              <div className="relative aspect-square w-full overflow-hidden rounded bg-background">
                <Image
                  src={driveImageUrl(photo.drive_file_id)}
                  alt=""
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex items-center justify-between gap-1">
                <div className="flex gap-1">
                  <button
                    type="button"
                    disabled={isPending || index === 0}
                    onClick={() => handleMove(photo.id, "up")}
                    aria-label={t.admin.website.gallery.moveEarlier}
                    className="rounded border border-border px-2 py-1 text-xs text-foreground hover:bg-surface-hover disabled:opacity-30"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    disabled={isPending || index === photos.length - 1}
                    onClick={() => handleMove(photo.id, "down")}
                    aria-label={t.admin.website.gallery.moveLater}
                    className="rounded border border-border px-2 py-1 text-xs text-foreground hover:bg-surface-hover disabled:opacity-30"
                  >
                    →
                  </button>
                </div>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleDelete(photo.id)}
                  className="rounded border border-danger/40 px-2 py-1 text-xs font-medium text-danger hover:bg-danger/10 disabled:opacity-50"
                >
                  {t.admin.website.gallery.remove}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div>
        <button
          type="button"
          disabled={isPending}
          onClick={() => inputRef.current?.click()}
          className="rounded border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-hover disabled:opacity-50"
        >
          {isPending ? t.common.uploading : t.admin.website.gallery.addPhoto}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            handleFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </div>

      {message && <p className="text-sm text-danger">{message}</p>}
    </div>
  );
}
