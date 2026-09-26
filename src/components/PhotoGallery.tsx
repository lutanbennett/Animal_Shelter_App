"use client";

import { useEffect, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { formatDate } from "@/lib/format";
import type { PhotoProvenance } from "@/lib/adoption-updates/options";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import type { Locale } from "@/lib/i18n/locales";
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
  /**
   * Set when an adopter sent the photo (attachments.adoption_update_id,
   * 0097): who, when and how. Read with RESIDENT_PHOTO_SELECT so every list
   * of resident photos carries it.
   */
  adoption_update?: PhotoProvenance | null;
};

type PhotoFilter = "all" | "shelter" | "adopters";

/** The one-line provenance of an adopter's photo, or null for the shelter's own. */
export function provenanceLine(
  t: Dictionary,
  locale: Locale,
  update: PhotoProvenance | null | undefined,
): string | null {
  if (!update) return null;
  const channel =
    (t.adoptionUpdates.channels as Record<string, string>)[update.channel] ?? update.channel;
  return t.adoptionUpdates.provenance(
    update.sender?.name ?? null,
    formatDate(update.received_on, locale),
    channel,
  );
}

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
  const { t, locale } = useI18n();
  const [openPhoto, setOpenPhoto] = useState<PhotoRow | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [filter, setFilter] = useState<PhotoFilter>("all");
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

  // The shelter's own photos and the ones adopters sent can be told apart
  // and filtered (0097); the chips only appear once there is something to
  // tell apart — both kinds, so never inside one update's own gallery.
  const adopterCount = photos.filter((p) => p.adoption_update).length;
  const showFilter = adopterCount > 0 && adopterCount < photos.length;
  const filtered =
    filter === "all"
      ? photos
      : photos.filter((p) => (filter === "adopters") === Boolean(p.adoption_update));
  const visiblePhotos = showAll ? filtered : filtered.slice(0, INITIAL_TILE_COUNT);
  const openProvenance = provenanceLine(t, locale, openPhoto?.adoption_update);

  return (
    <>
      {showFilter && (
        <div role="group" aria-label={t.photos.filter.label} className="mb-3 flex flex-wrap gap-2">
          {(
            [
              ["all", t.photos.filter.all(photos.length)],
              ["shelter", t.photos.filter.shelter(photos.length - adopterCount)],
              ["adopters", t.photos.filter.adopters(adopterCount)],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              aria-pressed={filter === key}
              onClick={() => setFilter(key)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                filter === key
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {visiblePhotos.map((photo) => {
          const isProfile = photo.drive_file_id === profilePhotoDriveFileId;
          const provenance = provenanceLine(t, locale, photo.adoption_update);
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
              {provenance ? (
                <span
                  title={provenance}
                  className="absolute inset-x-0 bottom-0 truncate bg-primary/85 px-1.5 py-1 text-[10px] text-primary-foreground"
                >
                  {provenance}
                </span>
              ) : (
                (photo.sub_folder || photo.date_taken) && (
                  <span className="absolute inset-x-0 bottom-0 truncate bg-black/60 px-1.5 py-1 text-[10px] text-white">
                    {[photo.sub_folder, photo.date_taken].filter(Boolean).join(" · ")}
                  </span>
                )
              )}
            </button>
          );
        })}
      </div>

      {filtered.length > INITIAL_TILE_COUNT && (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          aria-expanded={showAll}
          className="mt-3 w-full rounded border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-surface-hover"
        >
          {showAll ? t.photos.showFewer : t.photos.showAll(filtered.length)}
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
                  {openProvenance && openPhoto.adoption_update ? (
                    <p className="text-xs text-muted">
                      {openProvenance} ·{" "}
                      <Link
                        href={`/residents/${residentId}/adoption-updates#update-${openPhoto.adoption_update.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {t.adoptionUpdates.seeUpdate}
                      </Link>
                    </p>
                  ) : (
                    (openPhoto.sub_folder || openPhoto.date_taken) && (
                      <p className="text-xs text-muted">
                        {[openPhoto.sub_folder, openPhoto.date_taken].filter(Boolean).join(" · ")}
                      </p>
                    )
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
