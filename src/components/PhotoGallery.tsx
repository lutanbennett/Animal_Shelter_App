"use client";

import { useEffect, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { driveImageUrl } from "@/lib/google/drive-client";
import { deletePhoto, setProfilePhoto } from "@/app/residents/[id]/photos/actions";
import { useI18n } from "@/lib/i18n/I18nProvider";

export type PhotoRow = {
  id: string;
  drive_file_id: string;
  file_name: string | null;
  sub_folder: string | null;
  date_taken: string | null;
};

export function PhotoGallery({
  residentId,
  photos,
  profilePhotoDriveFileId,
}: {
  residentId: string;
  photos: PhotoRow[];
  profilePhotoDriveFileId: string | null;
}) {
  const { t } = useI18n();
  const [openPhoto, setOpenPhoto] = useState<PhotoRow | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!openPhoto) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [openPhoto]);

  function close() {
    setOpenPhoto(null);
    setConfirmingDelete(false);
    setError(null);
  }

  function handleSetProfile() {
    if (!openPhoto) return;
    startTransition(async () => {
      const result = await setProfilePhoto(residentId, openPhoto.drive_file_id);
      if (result?.error) setError(result.error);
      else close();
    });
  }

  function handleDelete() {
    if (!openPhoto) return;
    startTransition(async () => {
      const result = await deletePhoto(residentId, openPhoto.id);
      if (result?.error) setError(result.error);
      else close();
    });
  }

  if (photos.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted">
        {t.photos.noPhotos}
      </p>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {photos.map((photo) => {
          const isProfile = photo.drive_file_id === profilePhotoDriveFileId;
          return (
            <button
              key={photo.id}
              type="button"
              onClick={() => setOpenPhoto(photo)}
              className={`group relative aspect-square overflow-hidden rounded-lg border bg-surface-hover ${
                isProfile ? "border-primary ring-2 ring-primary/50" : "border-border"
              }`}
            >
              <img
                src={driveImageUrl(photo.drive_file_id)}
                alt={photo.file_name ?? t.photos.residentPhotoAlt}
                className="h-full w-full object-cover transition group-hover:brightness-90"
              />
              {isProfile && (
                <span className="absolute left-1.5 top-1.5 rounded-full bg-primary px-2 py-0.5 text-[10px] font-medium text-primary-foreground">
                  {t.photos.profileBadge}
                </span>
              )}
              {(photo.sub_folder || photo.date_taken) && (
                <span className="absolute inset-x-0 bottom-0 truncate bg-black/60 px-1.5 py-1 text-[10px] text-white">
                  {[photo.sub_folder, photo.date_taken].filter(Boolean).join(" · ")}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {openPhoto &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) close();
            }}
          >
            <div className="flex max-h-[85vh] w-full max-w-2xl flex-col gap-4 rounded border border-border bg-surface p-5 shadow-xl">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-semibold text-foreground">
                    {openPhoto.file_name ?? t.photos.photoFallback}
                  </h2>
                  {(openPhoto.sub_folder || openPhoto.date_taken) && (
                    <p className="text-xs text-muted">
                      {[openPhoto.sub_folder, openPhoto.date_taken].filter(Boolean).join(" · ")}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={close}
                  aria-label={t.common.close}
                  className="text-muted hover:text-foreground"
                >
                  &times;
                </button>
              </div>

              <div className="flex-1 overflow-hidden rounded bg-background">
                <img
                  src={driveImageUrl(openPhoto.drive_file_id)}
                  alt={openPhoto.file_name ?? t.photos.residentPhotoAlt}
                  className="mx-auto max-h-[60vh] w-auto object-contain"
                />
              </div>

              {error && <p className="text-sm text-danger">{error}</p>}

              <div className="flex items-center justify-between gap-2">
                <div>
                  {confirmingDelete ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-foreground">
                        {t.photos.removeConfirmPrompt}
                      </span>
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={handleDelete}
                        className="rounded bg-danger px-3 py-1.5 text-sm font-medium text-danger-foreground hover:brightness-110 disabled:opacity-60"
                      >
                        {t.photos.confirmRemove}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmingDelete(false)}
                        className="rounded border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-surface-hover"
                      >
                        {t.common.cancel}
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmingDelete(true)}
                      className="rounded border border-border px-3 py-1.5 text-sm font-medium text-danger hover:bg-danger/10"
                    >
                      {t.photos.removePhoto}
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  disabled={isPending || openPhoto.drive_file_id === profilePhotoDriveFileId}
                  onClick={handleSetProfile}
                  className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-60"
                >
                  {openPhoto.drive_file_id === profilePhotoDriveFileId
                    ? t.photos.currentProfile
                    : t.photos.setAsProfile}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
