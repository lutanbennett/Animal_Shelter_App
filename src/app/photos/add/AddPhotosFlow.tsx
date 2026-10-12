"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Camera, CheckCircle2, ImagePlus, Loader2, RotateCcw, XCircle } from "lucide-react";
import { ActionButton } from "@/components/ActionButton";
import { uploadResidentPhoto } from "@/components/PhotoUploader";
import { ResidentPicker } from "@/app/medical/ResidentPicker";
import { ScanCardSeam } from "./ScanCardSeam";
import { placeName } from "@/lib/enclosures/names";
import { photoFolderLabel } from "@/lib/i18n/enum-labels";
import { todayIso } from "@/lib/format";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { matchesQuery, type PickableResident } from "@/lib/medical/residents";
import type { PhotoCategory } from "@/lib/google/drive-client";

type Status = "saving" | "saved" | "failed";

/** One photo saved (or being saved) to one resident. A photo with two dogs has two of these. */
type Tag = { residentId: string; name: string; status: Status; error?: string };

type Photo = { key: string; file: File; preview: string; tags: Tag[] };

/** One upload waiting its turn. Sequential: the first upload for a resident may create their Drive folder. */
type Job = { photoKey: string; residentId: string; folder: PhotoCategory };

const RECENT_KEY = "photos-add:recent";
const RECENT_MAX = 8;

function readRecent(): string[] {
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    const list = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(list) ? list.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function writeRecent(ids: string[]) {
  try {
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(ids.slice(0, RECENT_MAX)));
  } catch {
    /* private window or blocked storage: the page works without recents */
  }
}

/**
 * Photo first, then the resident. The photos live in the browser until each is tagged; tagging a photo
 * to a resident uploads it at once, through the same routes the hub and Add Medical Photos use.
 *
 * Which photos a tap tags: the picked one, or every photo in "all to the same resident" mode. A photo
 * can be tagged again to a second resident (two dogs in one picture); each tag is its own upload, as
 * uploads are today. Leaving with untagged or unsaved photos asks first.
 */
export function AddPhotosFlow({
  categories,
  route,
  residents,
  loadError,
}: {
  categories: readonly PhotoCategory[];
  route: "staff" | "medical";
  residents: PickableResident[];
  loadError: string | null;
}) {
  const { t, locale } = useI18n();
  const a = t.addPhotos;
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [pickedKey, setPickedKey] = useState<string | null>(null);
  const [allToOne, setAllToOne] = useState(false);
  const [folder, setFolder] = useState<PhotoCategory>(categories.includes("Shelter") ? "Shelter" : categories[0]);
  const [query, setQuery] = useState("");
  const [recentIds, setRecentIds] = useState<string[]>(() => (typeof window === "undefined" ? [] : readRecent()));
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  // The refs are what the drain loop reads; state is only what is drawn.
  const photosRef = useRef<Photo[]>([]);
  const jobs = useRef<Job[]>([]);
  const running = useRef(false);

  const commit = useCallback((next: Photo[]) => {
    photosRef.current = next;
    setPhotos(next);
  }, []);

  const patchTag = useCallback(
    (photoKey: string, residentId: string, change: Partial<Tag>) => {
      commit(
        photosRef.current.map((p) =>
          p.key === photoKey
            ? { ...p, tags: p.tags.map((tag) => (tag.residentId === residentId ? { ...tag, ...change } : tag)) }
            : p,
        ),
      );
    },
    [commit],
  );

  const drain = useCallback(async () => {
    if (running.current) return;
    running.current = true;
    try {
      for (;;) {
        const job = jobs.current.shift();
        if (!job) break;
        const photo = photosRef.current.find((p) => p.key === job.photoKey);
        if (!photo) continue;
        const result = await uploadResidentPhoto(
          t,
          job.residentId,
          photo.file,
          { category: job.folder, dateTaken: todayIso() },
          () => {},
          route,
        );
        patchTag(
          job.photoKey,
          job.residentId,
          result.error ? { status: "failed", error: result.error } : { status: "saved", error: undefined },
        );
      }
    } finally {
      running.current = false;
    }
  }, [patchTag, route, t]);

  const add = (list: FileList | null) => {
    if (!list) return;
    const fresh: Photo[] = Array.from(list)
      .filter((f) => f.type.startsWith("image/"))
      .map((file) => ({
        key: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
        file,
        preview: URL.createObjectURL(file),
        tags: [],
      }));
    if (fresh.length === 0) return;
    commit([...photosRef.current, ...fresh]);
    setPickedKey((k) => k ?? fresh[0].key);
  };

  const nameOf = useCallback(
    (r: PickableResident) => (locale === "th" && r.thaiName?.trim() ? r.thaiName.trim() : r.name),
    [locale],
  );

  const queue = (photoKey: string, r: PickableResident) => {
    const photo = photosRef.current.find((p) => p.key === photoKey);
    if (!photo || photo.tags.some((tag) => tag.residentId === r.id && tag.status !== "failed")) return;
    const tag: Tag = { residentId: r.id, name: nameOf(r), status: "saving" };
    commit(
      photosRef.current.map((p) =>
        p.key === photoKey ? { ...p, tags: [...p.tags.filter((x) => x.residentId !== r.id), tag] } : p,
      ),
    );
    jobs.current.push({ photoKey, residentId: r.id, folder });
  };

  const pick = (r: PickableResident) => {
    const targets = allToOne
      ? photosRef.current.filter((p) => p.tags.length === 0).map((p) => p.key)
      : pickedKey
        ? [pickedKey]
        : [];
    if (targets.length === 0) return;
    for (const key of targets) queue(key, r);
    void drain();
    const next = [r.id, ...readRecent().filter((id) => id !== r.id)];
    writeRecent(next);
    setRecentIds(next.slice(0, RECENT_MAX));
    setQuery("");
    // Move on to the next photo with nobody tagged yet.
    const after = photosRef.current.find((p) => p.tags.length === 0 && !targets.includes(p.key));
    setPickedKey(after ? after.key : allToOne ? null : pickedKey);
    if (!after) setAllToOne(false);
  };

  const retry = (photoKey: string, residentId: string) => {
    const r = residents.find((x) => x.id === residentId);
    if (r) {
      queue(photoKey, r);
      void drain();
    }
  };

  // Free the previews when the page goes.
  useEffect(
    () => () => {
      for (const p of photosRef.current) URL.revokeObjectURL(p.preview);
    },
    [],
  );

  const total = photos.length;
  const tagged = photos.filter((p) => p.tags.length > 0).length;
  const untagged = total - tagged;
  const saving = photos.some((p) => p.tags.some((x) => x.status === "saving"));
  const failed = photos.some((p) => p.tags.some((x) => x.status === "failed"));
  const unsafe = untagged > 0 || saving || failed;

  // Leaving with photos not yet tagged or saved asks first: the browser's own prompt for closing the
  // tab or reloading, ours for a link inside the app (captured before the router sees the click).
  useEffect(() => {
    if (!unsafe) return;
    const message = untagged > 0 || failed ? a.leave : a.leaveSaving;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    const onClick = (e: MouseEvent) => {
      const anchor = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname === window.location.pathname) return;
      if (!window.confirm(message)) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onClick, true);
    };
  }, [unsafe, untagged, failed, a.leave, a.leaveSaving]);

  const residentById = useMemo(() => new Map(residents.map((r) => [r.id, r])), [residents]);
  // Recent: the residents this person tagged last. Nearby: the others in the enclosure of the latest one.
  const recent = recentIds.map((id) => residentById.get(id)).filter((r): r is PickableResident => !!r);
  const lastOne = recent[0];
  const nearby = lastOne?.enclosure
    ? residents.filter((r) => r.id !== lastOne.id && r.enclosure?.name === lastOne.enclosure?.name)
    : [];
  const shortcuts = (rows: PickableResident[]) =>
    rows.filter((r) => matchesQuery(r, query)).slice(0, RECENT_MAX);

  const button =
    "flex min-h-24 flex-col items-center justify-center gap-1 rounded-lg border-2 border-foreground bg-surface px-2 text-foreground";
  const chip = (r: PickableResident) => (
    <button
      key={r.id}
      type="button"
      onClick={() => pick(r)}
      className="min-h-11 rounded-full border border-border bg-surface px-4 text-base font-medium text-foreground"
    >
      {nameOf(r)}
    </button>
  );
  const recentRows = shortcuts(recent);
  const nearbyRows = shortcuts(nearby);
  const canTag = photos.length > 0 && (allToOne || pickedKey !== null);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <button type="button" onClick={() => cameraRef.current?.click()} className={button}>
          <Camera aria-hidden className="h-10 w-10" />
          <span className="text-center text-lg font-semibold leading-tight">{a.take}</span>
        </button>
        <button type="button" onClick={() => galleryRef.current?.click()} className={button}>
          <ImagePlus aria-hidden className="h-10 w-10" />
          <span className="text-center text-lg font-semibold leading-tight">{a.choose}</span>
        </button>
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          hidden
          onChange={(e) => {
            add(e.target.files);
            e.target.value = "";
          }}
        />
        <input
          ref={galleryRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => {
            add(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {categories.length > 1 ? (
        <label className="flex flex-col gap-1 text-base font-semibold text-foreground">
          {a.folderLabel}
          <select
            value={folder}
            onChange={(e) => setFolder(e.target.value as PhotoCategory)}
            className="min-h-12 rounded-lg border border-border bg-surface px-3 text-lg font-normal text-foreground"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {photoFolderLabel(t, c)}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <p className="text-sm text-muted">{a.goesIn(photoFolderLabel(t, categories[0]))}</p>
      )}
      {folder === "Medical" && <p className="text-sm text-muted">{a.medicalNever}</p>}

      {photos.length === 0 ? (
        <p className="rounded-lg border border-border bg-surface p-4 text-muted">{a.noPhotos}</p>
      ) : (
        <>
          <p role="status" className="text-lg font-semibold text-foreground">
            {untagged === 0 && !saving && !failed ? a.allDone : a.tagged(tagged, total)}
          </p>
          <ul className="grid grid-cols-3 gap-2">
            {photos.map((p) => {
              const isPicked = allToOne ? p.tags.length === 0 : p.key === pickedKey;
              return (
                <li key={p.key} className="flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setAllToOne(false);
                      setPickedKey(p.key);
                    }}
                    aria-pressed={isPicked}
                    className={`relative block aspect-square overflow-hidden rounded-lg border-2 bg-background ${
                      isPicked ? "border-primary ring-2 ring-primary/50" : "border-border"
                    }`}
                  >
                    <img src={p.preview} alt={p.file.name} className="h-full w-full object-cover" />
                    {p.tags.length === 0 && (
                      <span className="absolute inset-x-0 bottom-0 bg-black/60 px-1 py-0.5 text-xs font-medium text-white">
                        {a.untagged}
                      </span>
                    )}
                  </button>
                  {p.tags.map((tag) => (
                    <span key={tag.residentId} className="flex flex-col gap-1">
                      <span className="flex items-center gap-1 break-words text-sm font-medium text-foreground">
                        {tag.status === "saved" && <CheckCircle2 aria-label={a.saved} role="img" className="h-4 w-4 shrink-0 text-green-700" />}
                        {tag.status === "saving" && <Loader2 aria-label={a.saving} role="img" className="h-4 w-4 shrink-0 animate-spin" />}
                        {tag.status === "failed" && <XCircle aria-label={a.failed} role="img" className="h-4 w-4 shrink-0 text-red-700" />}
                        {tag.name}
                      </span>
                      {tag.status === "failed" && (
                        <>
                          <span className="break-words text-xs text-red-800">{tag.error}</span>
                          <ActionButton icon={RotateCcw} compact onClick={() => retry(p.key, tag.residentId)}>
                            {a.retry}
                          </ActionButton>
                        </>
                      )}
                    </span>
                  ))}
                </li>
              );
            })}
          </ul>

          {total > 1 && (
            <button
              type="button"
              aria-pressed={allToOne}
              onClick={() => setAllToOne((v) => !v)}
              className="min-h-11 self-start rounded-lg border-2 border-foreground bg-surface px-4 text-base font-semibold text-foreground"
            >
              {allToOne ? a.oneAtATime : a.allToOne}
            </button>
          )}

          <h2 className="text-xl font-semibold text-foreground">
            {allToOne ? a.whoForAll(untagged) : a.whoFor}
          </h2>
          <p className="text-sm text-muted">{a.another}</p>

          {canTag && (
            <>
              {(recentRows.length > 0 || nearbyRows.length > 0) && (
                <div className="flex flex-col gap-2">
                  {recentRows.length > 0 && (
                    <div className="flex flex-col gap-1">
                      <h3 className="text-base font-semibold text-foreground">{a.recent}</h3>
                      <div className="flex flex-wrap gap-2">{recentRows.map(chip)}</div>
                    </div>
                  )}
                  {nearbyRows.length > 0 && lastOne?.enclosure && (
                    <div className="flex flex-col gap-1">
                      <h3 className="text-base font-semibold text-foreground">
                        {a.nearby(placeName(locale, lastOne.enclosure.name, lastOne.enclosure.nameTh))}
                      </h3>
                      <div className="flex flex-wrap gap-2">{nearbyRows.map(chip)}</div>
                    </div>
                  )}
                </div>
              )}
              <ScanCardSeam residents={residents} onFound={pick} />
              <ResidentPicker
                t={t}
                locale={locale}
                base="/photos/add"
                residents={residents}
                query={query}
                error={loadError}
                onPick={pick}
                onQueryChange={setQuery}
              />
            </>
          )}
        </>
      )}
    </div>
  );
}
