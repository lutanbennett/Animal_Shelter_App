"use client";

import { useEffect, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  Check,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  FolderInput,
  Laugh,
  Megaphone,
  Play,
  Square,
  SquareCheck,
  SquareCheckBig,
  Star,
  Trash2,
  Undo2,
  X,
} from "lucide-react";
import { ActionButton } from "@/components/ActionButton";
import { ActionLink } from "@/components/ActionLink";
import { DateInput } from "@/components/DateInput";
import { formatDate, todayIso } from "@/lib/format";
import { photoFolderLabel } from "@/lib/i18n/enum-labels";
import type { PhotoProvenance } from "@/lib/adoption-updates/options";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import type { Locale } from "@/lib/i18n/locales";
import { PHOTO_CATEGORIES, driveImageUrl, videoUrl, isMedicalFolder, type PhotoCategory } from "@/lib/google/drive-client";
import {
  deletePhoto,
  markPhotosPosted,
  movePhotoToFolder,
  setProfilePhoto,
  undoPhotoPosted,
} from "@/app/residents/[id]/photos/actions";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { SOCIAL_PLATFORMS, platformsOf, type SharesByPhoto, type SocialPlatform } from "@/lib/social-shares";

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
  /** NULL = waiting for Management to approve it (0217); the website shows only approved photos. */
  approved_at?: string | null;
  /** 'video' for a clip filed in the same folders (0229); absent or 'photo' for everything else. */
  media_kind?: "photo" | "video" | null;
  duration_ms?: number | null;
  /**
   * Set when an adopter sent the photo (attachments.adoption_update_id,
   * 0097): who, when and how. Read with RESIDENT_PHOTO_SELECT so every list
   * of resident photos carries it.
   */
  adoption_update?: PhotoProvenance | null;
};

/** 1:05 or 1:02:03 — the badge on a video tile. */
function formatDuration(ms: number): string {
  const total = Math.round(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const sec = String(total % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${sec}` : `${m}:${sec}`;
}

type PhotoFilter = "all" | "shelter" | "adopters";
type PostedFilter = "all" | "notPosted" | "posted";

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

const CHIP_ON = "border-primary bg-primary text-primary-foreground";
const CHIP_OFF = "border-border text-muted hover:text-foreground";

/**
 * The form behind "Mark as posted" (0223): where, the date (today unless
 * changed), an optional link to the post and an optional note. The same
 * form marks one photo from the lightbox and several from the grid; the
 * server action writes one `social_shares` row per photo.
 */
function MarkPostedForm({
  residentId,
  attachmentIds,
  onDone,
  onCancel,
}: {
  residentId: string;
  attachmentIds: string[];
  onDone: () => void;
  onCancel: () => void;
}) {
  const { t } = useI18n();
  const p = t.photos.posted;
  const [platform, setPlatform] = useState<SocialPlatform>("facebook");
  const [sharedOn, setSharedOn] = useState(todayIso());
  const [postUrl, setPostUrl] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await markPhotosPosted(residentId, attachmentIds, { platform, sharedOn, postUrl, note });
      if (!result.ok) setError(result.error);
      else onDone();
    });
  }

  return (
    <form
      className="flex flex-col gap-3 rounded border border-border bg-background p-3"
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <fieldset className="flex flex-col gap-1">
        <legend className="text-xs font-medium text-muted">{p.form.where}</legend>
        <div role="radiogroup" aria-label={p.form.where} className="flex flex-wrap gap-2">
          {SOCIAL_PLATFORMS.map((key) => (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={platform === key}
              onClick={() => setPlatform(key)}
              className={`min-h-11 rounded-full border px-3 py-1 text-sm font-medium transition md:min-h-0 ${platform === key ? CHIP_ON : CHIP_OFF}`}
            >
              {p.platforms[key] ?? key}
            </button>
          ))}
        </div>
      </fieldset>
      <label className="flex flex-col gap-1 text-xs font-medium text-muted">
        {p.form.date}
        <DateInput
          value={sharedOn}
          max={todayIso()}
          required
          onChange={(e) => setSharedOn(e.target.value)}
          className="min-h-11 rounded border border-border bg-surface px-2 py-1.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40 md:min-h-0"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs font-medium text-muted">
        {p.form.link}
        <input
          type="url"
          inputMode="url"
          value={postUrl}
          onChange={(e) => setPostUrl(e.target.value)}
          placeholder="https://"
          className="min-h-11 rounded border border-border bg-surface px-2 py-1.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40 md:min-h-0"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs font-medium text-muted">
        {p.form.note}
        <input
          type="text"
          maxLength={500}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="min-h-11 rounded border border-border bg-surface px-2 py-1.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40 md:min-h-0"
        />
      </label>
      <p className="text-xs text-muted">{p.neverPublic}</p>
      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="flex flex-wrap justify-end gap-2">
        <ActionButton icon={X} onClick={onCancel} disabled={isPending}>
          {t.common.cancel}
        </ActionButton>
        <ActionButton icon={Megaphone} variant="primary" type="submit" disabled={isPending}>
          {p.markSelected(attachmentIds.length)}
        </ActionButton>
      </div>
    </form>
  );
}

export function PhotoGallery({
  residentId,
  photos,
  profilePhotoDriveFileId,
  moveCategories = PHOTO_CATEGORIES,
  readOnly = false,
  shares,
  canMarkPosted = false,
  canMakeMeme = false,
}: {
  residentId: string;
  photos: PhotoRow[];
  profilePhotoDriveFileId: string | null;
  /**
   * The folders this user may move a photo INTO (photoCategoriesForRole).
   * A role with one folder (a doctor: Medical) can move a photo into it but
   * never out of it — the "Move to folder" picker only ever offers folders
   * in this list, and the server action refuses the rest regardless.
   */
  moveCategories?: readonly PhotoCategory[];
  /**
   * Viewing a closed record (a deceased resident): photos still open full
   * size, but nothing can be removed or promoted to profile photo. The
   * database rejects both writes anyway (migration 0026) — this keeps the
   * buttons from being offered in the first place.
   */
  readOnly?: boolean;
  /**
   * Where each photo has been posted on social media (0223, social_shares,
   * owner_type 'attachment' only), keyed by attachment id. Undefined means
   * the caller did not load it, and no badge or filter is shown; an empty
   * record means it was loaded and nothing is posted.
   */
  shares?: SharesByPhoto;
  /**
   * May this login record and undo posts? The same test the table's policy
   * makes: photos.resident_manage, and the caller sees all residents. The
   * badge itself shows to anyone who can see the photo.
   */
  canMarkPosted?: boolean;
  /** May this login open the meme maker (social.library at Edit)? A Medical or waiting photo never gets the button. */
  canMakeMeme?: boolean;
}) {
  const { t, locale } = useI18n();
  const p = t.photos.posted;
  const [openPhoto, setOpenPhoto] = useState<PhotoRow | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [filter, setFilter] = useState<PhotoFilter>("all");
  const [postedFilter, setPostedFilter] = useState<PostedFilter>("all");
  const [mediaFilter, setMediaFilter] = useState<"all" | "photo" | "video">("all");
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [moveTarget, setMoveTarget] = useState<PhotoCategory | "">("");
  const [marking, setMarking] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [markingSelected, setMarkingSelected] = useState(false);
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

  function open(photo: PhotoRow) {
    setOpenPhoto(photo);
    setConfirmingDelete(false);
    setMoveTarget("");
    setMarking(false);
    setError(null);
  }

  function close() {
    setOpenPhoto(null);
    setConfirmingDelete(false);
    setMoveTarget("");
    setMarking(false);
    setError(null);
  }

  function handleSetProfile() {
    if (!openPhoto) return;
    startTransition(async () => {
      const result = await setProfilePhoto(residentId, openPhoto.drive_file_id);
      if (!result.ok) setError(result.error);
      else if (result.archiveWarning) setError(result.archiveWarning);
      else close();
    });
  }

  function handleDelete() {
    if (!openPhoto) return;
    startTransition(async () => {
      const result = await deletePhoto(residentId, openPhoto.id);
      if (!result.ok) setError(result.error);
      else if (result.archiveWarning) setError(result.archiveWarning);
      else close();
    });
  }

  function handleMove() {
    if (!openPhoto || !moveTarget) return;
    startTransition(async () => {
      const result = await movePhotoToFolder(residentId, openPhoto.id, moveTarget);
      if (!result.ok) setError(result.error);
      else if (result.archiveWarning) setError(result.archiveWarning);
      else close();
    });
  }

  function handleUndo(shareId: string) {
    setError(null);
    startTransition(async () => {
      const result = await undoPhotoPosted(residentId, shareId);
      if (!result.ok) setError(result.error);
    });
  }

  function toggleSelected(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function stopSelecting() {
    setSelecting(false);
    setSelected(new Set());
    setMarkingSelected(false);
  }

  if (photos.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted">
        {t.photos.noPhotos}
      </p>
    );
  }

  // Posted = at least one social_shares row for this attachment. `shares`
  // only ever holds owner_type 'attachment' rows (loadPhotoShares pins it),
  // so a meme's share can never make a photograph read as posted.
  const isPosted = (photo: PhotoRow) => (shares?.[photo.id]?.length ?? 0) > 0;
  const postedCount = shares ? photos.filter(isPosted).length : 0;
  const showPostedFilter = shares !== undefined;

  // The shelter's own photos and the ones adopters sent can be told apart
  // and filtered (0097); the chips only appear once there is something to
  // tell apart — both kinds, so never inside one update's own gallery.
  const adopterCount = photos.filter((p) => p.adoption_update).length;
  const showFilter = adopterCount > 0 && adopterCount < photos.length;
  // Photos / Videos / All (0229): the chips appear once the resident has a video, since until then there is nothing to filter.
  const videoCount = photos.filter((p) => p.media_kind === "video").length;
  const byMedia = mediaFilter === "all" ? photos : photos.filter((p) => (mediaFilter === "video") === (p.media_kind === "video"));
  const byKind =
    filter === "all"
      ? byMedia
      : byMedia.filter((p) => (filter === "adopters") === Boolean(p.adoption_update));
  const filtered =
    postedFilter === "all" ? byKind : byKind.filter((p) => (postedFilter === "posted") === isPosted(p));
  const visiblePhotos = showAll ? filtered : filtered.slice(0, INITIAL_TILE_COUNT);
  const openProvenance = provenanceLine(t, locale, openPhoto?.adoption_update);
  const openShares = openPhoto ? (shares?.[openPhoto.id] ?? []) : [];
  // A photo an adopter sent, or one whose folder isn't a Photos category at
  // all (legacy data), can't be refiled — moveCategories only ever offers
  // folders this role may move photos INTO (photoCategoriesForRole).
  const moveOptions =
    openPhoto && !openPhoto.adoption_update && PHOTO_CATEGORIES.includes(openPhoto.sub_folder as PhotoCategory)
      ? moveCategories.filter((c) => c !== openPhoto.sub_folder)
      : [];
  const mayMark = canMarkPosted && !readOnly && shares !== undefined;
  const selectedIds = Array.from(selected).filter((id) => photos.some((ph) => ph.id === id));

  const chip = (on: boolean) =>
    `rounded-full border px-3 py-1 text-xs font-medium transition ${on ? CHIP_ON : CHIP_OFF}`;

  return (
    <>
      {videoCount > 0 && (
        <div role="group" aria-label={t.photos.videos.filter.label} className="mb-3 flex flex-wrap gap-2">
          {(
            [
              ["photo", t.photos.videos.filter.photos(photos.length - videoCount)],
              ["video", t.photos.videos.filter.videos(videoCount)],
              ["all", t.photos.videos.filter.all(photos.length)],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              aria-pressed={mediaFilter === key}
              onClick={() => setMediaFilter(key)}
              className={chip(mediaFilter === key)}
            >
              {label}
            </button>
          ))}
        </div>
      )}
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
              className={chip(filter === key)}
            >
              {label}
            </button>
          ))}
        </div>
      )}
      {showPostedFilter && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div role="group" aria-label={p.heading} className="flex flex-wrap gap-2">
            {(
              [
                ["notPosted", p.filter.notPosted(photos.length - postedCount)],
                ["posted", p.filter.posted(postedCount)],
                ["all", p.filter.all(photos.length)],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                aria-pressed={postedFilter === key}
                onClick={() => setPostedFilter(key)}
                className={chip(postedFilter === key)}
              >
                {label}
              </button>
            ))}
          </div>
          {mayMark && !selecting && (
            <ActionButton icon={SquareCheck} compact onClick={() => setSelecting(true)}>
              {p.select}
            </ActionButton>
          )}
        </div>
      )}
      {selecting && (
        <div className="mb-3 flex flex-col gap-2 rounded border border-primary/40 bg-primary/5 p-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-foreground">{p.selected(selectedIds.length)}</span>
            <span className="text-xs text-muted">{p.selectHint}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <ActionButton
              icon={SquareCheckBig}
              compact
              onClick={() => setSelected(new Set([...selected, ...visiblePhotos.map((ph) => ph.id)]))}
            >
              {p.selectAllShown}
            </ActionButton>
            <ActionButton icon={Square} compact disabled={selectedIds.length === 0} onClick={() => setSelected(new Set())}>
              {p.clearSelection}
            </ActionButton>
            <ActionButton
              icon={Megaphone}
              variant="primary"
              compact
              disabled={selectedIds.length === 0}
              onClick={() => setMarkingSelected(true)}
            >
              {p.markAsPosted}
            </ActionButton>
            <ActionButton icon={X} compact onClick={stopSelecting}>
              {p.doneSelecting}
            </ActionButton>
          </div>
          {markingSelected && selectedIds.length > 0 && (
            <MarkPostedForm
              residentId={residentId}
              attachmentIds={selectedIds}
              onDone={stopSelecting}
              onCancel={() => setMarkingSelected(false)}
            />
          )}
        </div>
      )}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {visiblePhotos.map((photo) => {
          const isProfile = photo.drive_file_id === profilePhotoDriveFileId;
          const provenance = provenanceLine(t, locale, photo.adoption_update);
          const platforms = platformsOf(shares?.[photo.id]);
          const isSelected = selecting && selected.has(photo.id);
          return (
            <button
              key={photo.id}
              type="button"
              aria-pressed={selecting ? isSelected : undefined}
              onClick={() => (selecting ? toggleSelected(photo.id) : open(photo))}
              className={`group relative aspect-square overflow-hidden rounded-lg border bg-surface-hover ${
                isSelected
                  ? "border-primary ring-4 ring-primary"
                  : isProfile
                    ? "border-primary ring-2 ring-primary/50"
                    : "border-border"
              }`}
            >
              <img
                src={driveImageUrl(photo.drive_file_id, photo.media_kind === "video" ? 400 : undefined)}
                alt={photo.media_kind === "video" ? t.photos.videos.videoAlt(photo.file_name ?? "") : (photo.file_name ?? t.photos.residentPhotoAlt)}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover transition group-hover:brightness-90"
              />
              {photo.media_kind === "video" && (
                <span aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-black/60 text-white">
                    <Play className="h-6 w-6" fill="currentColor" />
                  </span>
                  {photo.duration_ms ? (
                    <span className="absolute bottom-7 right-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white">
                      {formatDuration(photo.duration_ms)}
                    </span>
                  ) : null}
                </span>
              )}
              {selecting && (
                <span
                  aria-hidden="true"
                  className={`absolute left-1.5 top-1.5 inline-flex h-6 w-6 items-center justify-center rounded border-2 ${
                    isSelected ? "border-primary bg-primary text-primary-foreground" : "border-white bg-black/40 text-transparent"
                  }`}
                >
                  <Check className="h-4 w-4" />
                </span>
              )}
              <span className="absolute right-1.5 top-1.5 flex flex-col items-end gap-1">
                {photo.approved_at === null && (
                  <span className="rounded-full bg-amber-600 px-2 py-0.5 text-[10px] font-medium text-white">
                    {t.photos.waitingForApproval}
                  </span>
                )}
                {platforms.length > 0 && (
                  <span
                    title={platforms.map((k) => p.platforms[k] ?? k).join(", ")}
                    className="inline-flex items-center gap-1 rounded-full bg-success px-2 py-0.5 text-[10px] font-medium text-white"
                  >
                    <Megaphone aria-hidden="true" className="h-3 w-3" />
                    {p.badge}
                    <span className="sr-only">: </span>
                    <span className="font-semibold">{platforms.map((k) => p.platformShort[k] ?? k).join(" ")}</span>
                  </span>
                )}
              </span>
              {isProfile && !selecting && (
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
                    {[photoFolderLabel(t, photo.sub_folder), photo.date_taken && formatDate(photo.date_taken, locale)].filter(Boolean).join(" · ")}
                  </span>
                )
              )}
            </button>
          );
        })}
      </div>
      {filtered.length === 0 && (
        <p className="mt-3 rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted">
          {t.photos.noPhotos}
        </p>
      )}

      {filtered.length > INITIAL_TILE_COUNT && (
        <div className="mt-3 flex flex-col">
          <ActionButton
            icon={showAll ? ChevronUp : ChevronDown}
            onClick={() => setShowAll((v) => !v)}
            aria-expanded={showAll}
          >
            {showAll ? t.photos.showFewer : t.photos.showAll(filtered.length)}
          </ActionButton>
        </div>
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
            <div className="flex max-h-[85vh] w-full max-w-2xl flex-col gap-4 overflow-y-auto rounded border border-border bg-surface p-5 shadow-xl">
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
                        {[photoFolderLabel(t, openPhoto.sub_folder), openPhoto.date_taken && formatDate(openPhoto.date_taken, locale)].filter(Boolean).join(" · ")}
                      </p>
                    )
                  )}
                </div>
                <button
                  type="button"
                  onClick={close}
                  aria-label={t.common.close}
                  className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded text-muted hover:text-foreground md:h-8 md:w-8"
                >
                  <X aria-hidden="true" className="h-5 w-5" />
                </button>
              </div>

              <div className="shrink-0 overflow-hidden rounded bg-background">
                {openPhoto.media_kind === "video" ? (
                  <video
                    key={openPhoto.drive_file_id}
                    src={videoUrl(openPhoto.drive_file_id)}
                    poster={driveImageUrl(openPhoto.drive_file_id, 800)}
                    controls
                    playsInline
                    preload="metadata"
                    aria-label={t.photos.videos.videoAlt(openPhoto.file_name ?? "")}
                    className="mx-auto max-h-[50vh] w-auto max-w-full bg-black"
                  >
                    {t.photos.videos.cannotPlay}
                  </video>
                ) : (
                  <img
                    src={driveImageUrl(openPhoto.drive_file_id)}
                    alt={openPhoto.file_name ?? t.photos.residentPhotoAlt}
                    className="mx-auto max-h-[50vh] w-auto object-contain"
                  />
                )}
              </div>

              {openPhoto.approved_at === null && <p className="text-sm font-medium text-foreground">{t.photos.waitingNote}</p>}
              {error && <p className="text-sm text-danger">{error}</p>}

              {/* Posted on social media (0223): where this photo went, Undo per post, Mark as posted. The list shows to
                  anyone who can see the photo; the buttons only to a login the table lets write. */}
              {shares !== undefined && (
                <section aria-label={p.heading} className="flex flex-col gap-2 rounded border border-border p-3">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Megaphone aria-hidden="true" className="h-4 w-4" />
                    {p.heading}
                  </h3>
                  {openShares.length === 0 ? (
                    <p className="text-sm text-muted">{p.none}</p>
                  ) : (
                    <ul className="flex flex-col gap-1">
                      {openShares.map((s) => (
                        <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 text-sm text-foreground">
                          <span className="min-w-0">
                            {p.postedOn(p.platforms[s.platform] ?? s.platform, formatDate(s.shared_on, locale))}
                            {s.note && <span className="text-muted"> · {s.note}</span>}
                            {s.post_url && (
                              <>
                                {" · "}
                                <a
                                  href={s.post_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                                >
                                  {p.openPost}
                                  <ExternalLink aria-hidden="true" className="h-3 w-3" />
                                </a>
                              </>
                            )}
                          </span>
                          {mayMark && (
                            <ActionButton icon={Undo2} compact disabled={isPending} onClick={() => handleUndo(s.id)}>
                              {p.undo}
                            </ActionButton>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                  {mayMark && !marking && (
                    <div className="flex justify-end">
                      <ActionButton icon={Megaphone} compact onClick={() => setMarking(true)}>
                        {p.markAsPosted}
                      </ActionButton>
                    </div>
                  )}
                  {mayMark && marking && (
                    <MarkPostedForm
                      residentId={residentId}
                      attachmentIds={[openPhoto.id]}
                      onDone={() => setMarking(false)}
                      onCancel={() => setMarking(false)}
                    />
                  )}
                </section>
              )}

              {canMakeMeme && openPhoto.media_kind !== "video" && openPhoto.approved_at !== null && !isMedicalFolder(openPhoto.sub_folder) && !openPhoto.adoption_update && (
                <div>
                  <ActionLink href={`/memes/make?photo=${openPhoto.drive_file_id}`} label={t.memes.maker.button} icon={Laugh} iconOnlyOnMobile={false} />
                </div>
              )}

              {readOnly ? (
                <p className="text-sm text-muted">{t.photos.readOnly}</p>
              ) : (
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-col">
                    {confirmingDelete ? (
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <span className="text-sm text-foreground">
                          {t.photos.removeConfirmPrompt}
                        </span>
                        <ActionButton icon={Trash2} variant="danger" disabled={isPending} onClick={handleDelete}>
                          {t.photos.confirmRemove}
                        </ActionButton>
                        <ActionButton icon={X} onClick={() => setConfirmingDelete(false)}>
                          {t.common.cancel}
                        </ActionButton>
                      </div>
                    ) : (
                      <ActionButton icon={Trash2} variant="danger" onClick={() => setConfirmingDelete(true)}>
                        {t.photos.removePhoto}
                      </ActionButton>
                    )}
                  </div>
                  {/* A Medical photo is never on the website, so it is not
                      offered as the profile photo (setResidentProfilePhoto
                      refuses it too). One already there stays labelled. */}
                  {openPhoto.media_kind === "video" ? null : openPhoto.approved_at === null ? (
                    <p className="max-w-xs text-right text-xs text-muted">{t.photos.waitingProfile}</p>
                  ) : isMedicalFolder(openPhoto.sub_folder) &&
                  openPhoto.drive_file_id !== profilePhotoDriveFileId ? (
                    <p className="max-w-xs text-right text-xs text-muted">
                      {t.photos.medicalNotProfile}
                    </p>
                  ) : (
                    <ActionButton
                      icon={openPhoto.drive_file_id === profilePhotoDriveFileId ? Check : Star}
                      variant="primary"
                      disabled={
                        isPending ||
                        openPhoto.drive_file_id === profilePhotoDriveFileId
                      }
                      onClick={handleSetProfile}
                    >
                      {openPhoto.drive_file_id === profilePhotoDriveFileId
                        ? t.photos.currentProfile
                        : t.photos.setAsProfile}
                    </ActionButton>
                  )}
                </div>
              )}

              {!readOnly && moveOptions.length > 0 && (
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                  <select
                    aria-label={t.photos.moveToFolder}
                    value={moveTarget}
                    onChange={(e) => setMoveTarget(e.target.value as PhotoCategory)}
                    className="min-h-11 rounded border border-border bg-surface px-2 py-1.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40 md:min-h-0"
                  >
                    <option value="" disabled>
                      {t.photos.moveToFolder}
                    </option>
                    {moveOptions.map((c) => (
                      <option key={c} value={c}>
                        {photoFolderLabel(t, c)}
                      </option>
                    ))}
                  </select>
                  <ActionButton icon={FolderInput} disabled={isPending || moveTarget === ""} onClick={handleMove}>
                    {moveTarget === "" ? t.photos.moveToFolder : t.photos.moveButton(photoFolderLabel(t, moveTarget))}
                  </ActionButton>
                </div>
              )}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
