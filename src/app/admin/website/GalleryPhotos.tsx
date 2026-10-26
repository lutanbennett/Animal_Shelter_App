"use client";

import { useConfirm } from "@/components/ConfirmProvider";
import { ACTION_ICONS } from "@/components/hub-icons";
import { ActionButton } from "@/components/ActionButton";
import { RowActionButton } from "@/components/RowAction";
import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import { driveImageUrl } from "@/lib/google/drive-client";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { PendingPuppy } from "@/components/PuppyLoader";
import { runUploadAction } from "@/lib/uploads/run-upload-action";
import { deleteGalleryPhoto, moveGalleryPhoto, uploadGalleryPhoto } from "./actions";

export type GalleryPhotoRow = { id: string; drive_file_id: string; alt: string };

/** canEdit: whether this login holds website.gallery; without it the strip is shown, with no way to change it. */
export function GalleryPhotos({ photos, canEdit }: { photos: GalleryPhotoRow[]; canEdit: boolean }) {
  const { t } = useI18n();
  const confirm = useConfirm();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // The photo waits here until it has a description: the public page needs one for visitors who cannot see it.
  const [chosen, setChosen] = useState<File | null>(null);
  const [alt, setAlt] = useState("");
  const [altTh, setAltTh] = useState("");

  function handleUpload() {
    if (!chosen) return;
    if (!alt.trim()) {
      setMessage(t.admin.website.gallery.altRequired);
      return;
    }
    setMessage(null);
    const file = chosen;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("alt", alt.trim());
    formData.append("alt_th", altTh.trim());
    startTransition(async () => {
      const result = await runUploadAction(file, t.admin.website.errors, () =>
        uploadGalleryPhoto(formData),
      );
      if (result && "error" in result) setMessage(result.error);
      else {
        setChosen(null);
        setAlt("");
        setAltTh("");
      }
    });
  }

  async function handleDelete(photoId: string) {
    if (!await confirm({ body: t.admin.website.gallery.removeConfirm })) return;
    setMessage(null);
    startTransition(async () => {
      const result = await deleteGalleryPhoto(photoId);
      if (!result.ok) setMessage(result.error);
    });
  }

  function handleMove(photoId: string, direction: "up" | "down") {
    setMessage(null);
    startTransition(async () => {
      const result = await moveGalleryPhoto(photoId, direction);
      if (!result.ok) setMessage(result.error);
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
                  alt={photo.alt}
                  fill
                  className="object-cover"
                />
              </div>
              {canEdit && (
              <div className="flex items-center justify-between gap-1">
                <div className="flex gap-1">
                  <RowActionButton
                    disabled={isPending || index === 0}
                    onClick={() => handleMove(photo.id, "up")}
                    label={t.admin.website.gallery.moveEarlier}
                    icon={ACTION_ICONS.moveLeft}
                  />
                  <RowActionButton
                    disabled={isPending || index === photos.length - 1}
                    onClick={() => handleMove(photo.id, "down")}
                    label={t.admin.website.gallery.moveLater}
                    icon={ACTION_ICONS.moveRight}
                  />
                </div>
                <RowActionButton
                  disabled={isPending}
                  onClick={() => handleDelete(photo.id)}
                  label={t.admin.website.gallery.remove}
                  icon={ACTION_ICONS.delete}
                  tone="danger"
                />
              </div>
              )}
            </div>
          ))}
        </div>
      )}

      {canEdit && (
        <div className="flex flex-col gap-3">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              setChosen(e.target.files?.[0] ?? null);
              setMessage(null);
              e.target.value = "";
            }}
          />
          {!chosen ? (
            <div>
              <ActionButton icon={ACTION_ICONS.uploadImage} disabled={isPending} onClick={() => inputRef.current?.click()}>
                {t.admin.website.gallery.addPhoto}
              </ActionButton>
            </div>
          ) : (
            <div className="flex flex-col gap-2 rounded border border-border p-3">
              <p className="text-sm font-medium text-foreground">{t.admin.website.gallery.chosen(chosen.name)}</p>
              <p className="text-sm text-muted">{t.admin.website.gallery.altHelp}</p>
              <label className="flex flex-col gap-1 text-sm text-foreground">
                {t.admin.website.gallery.alt}
                <input
                  value={alt}
                  onChange={(e) => setAlt(e.target.value)}
                  maxLength={300}
                  required
                  className="min-h-11 rounded border border-border bg-background px-3 font-normal"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm text-foreground">
                {t.admin.website.gallery.altTh}
                <input
                  value={altTh}
                  onChange={(e) => setAltTh(e.target.value)}
                  maxLength={300}
                  className="min-h-11 rounded border border-border bg-background px-3 font-normal"
                />
              </label>
              <div className="flex gap-2">
                <ActionButton icon={ACTION_ICONS.uploadImage} disabled={isPending} onClick={handleUpload}>
                  {isPending && <PendingPuppy />}
                  {isPending ? t.common.uploading : t.admin.website.gallery.addPhoto}
                </ActionButton>
                <ActionButton
                  icon={ACTION_ICONS.undo}
                  disabled={isPending}
                  onClick={() => {
                    setChosen(null);
                    setAlt("");
                    setAltTh("");
                    setMessage(null);
                  }}
                >
                  {t.admin.website.gallery.cancel}
                </ActionButton>
              </div>
            </div>
          )}
        </div>
      )}

      {message && <p className="text-sm text-danger">{message}</p>}
    </div>
  );
}
