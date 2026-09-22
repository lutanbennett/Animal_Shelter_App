"use client";

import { useEffect, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { driveImageUrl } from "@/lib/google/drive-client";
import { deletePhoto, setProfilePhoto } from "@/app/residents/[id]/photos/actions";
import { useI18n } from "@/lib/i18n/I18nProvider";

/**
 * Tiles shown before "Show all". Two full rows on the widest grid, so a
 * resident with dozens of photos no longer pushes the rest of the tab off
 * the bottom of the screen; the hidden tiles aren't rendered at all, so
 * they don't go through the photo proxy until asked for.
 */
const INITIAL_TILE_COUNT = 8;

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
  readOnly = false,
}: {
  residentId: string;
  photos: PhotoRow[];
  profilePhotoDriveFileId: string | null;
  /**
   * Viewing a closed record (a deceased resident): photos still open full
   * size, but nothing can be removed or promoted to profile photo. The
   * database rejects both writes anyway (migration 0026) — this keeps the
   * buttons from being offered in the first place.
   */
  readOnly?: boolean;
}) {
  const { t } = useI18n();
  const [openPhoto, setOpenPhoto] = useState<PhotoRow | null>(null);
  const [showAll, setShowAll] = useState(false);
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

  const visiblePhotos = showAll ? photos : photos.slice(0, INITIAL_TILE_COUNT);

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {visiblePhotos.map((photo) => {
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
                loading="lazy"
                decoding="async"
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

      {photos.length > INITIAL_TILE_COUNT && (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          aria-expanded={showAll}
          className="mt-3 w-full rounded border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-surface-hover"
        >
          {showAll ? t.photos.showFewer : t.photos.showAll(photos.length)}
        </button>
      )}

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

              {readOnly ? (
                <p className="text-sm text-muted">{t.photos.readOnly}</p>
              ) : (
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
                    disabled={
                      isPending ||
                      openPhoto.drive_file_id === profilePhotoDriveFileId
                    }
                    onClick={handleSetProfile}
                    className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-60"
                  >
                    {openPhoto.drive_file_id === profilePhotoDriveFileId
                      ? t.photos.currentProfile
                      : t.photos.setAsProfile}
                  </button>
                </div>
              )}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
