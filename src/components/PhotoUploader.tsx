"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PHOTO_CATEGORIES, type PhotoCategory } from "@/lib/google/drive-client";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { todayIso } from "@/lib/format";

type UploadStatus = "queued" | "uploading" | "done" | "error";

type QueueItem = {
  key: string;
  file: File;
  dateTaken: string;
  category: PhotoCategory;
  progress: number;
  status: UploadStatus;
  error?: string;
};

// Sequential, not parallel: the upload route does a check-then-create when
// resolving/creating the resident's Drive folder tree. Concurrent uploads
// for a resident that doesn't have a Drive folder yet can each see "not
// found" before any of them finish creating it, producing duplicate
// folders. Uploading one at a time means every upload after the first
// reuses the folder the first one just created/cached.
const CONCURRENCY = 1;

/**
 * Sends one photo to the resident photo route. `fields` is the rest of the
 * form: dateTaken plus either a category or, for a photo an adopter sent,
 * adoptionUpdateId (AdoptionUpdateForm) — one route for both.
 */
export function uploadResidentPhoto(
  t: Dictionary,
  residentId: string,
  file: File,
  fields: Record<string, string>,
  onProgress: (percent: number) => void,
): Promise<{ error?: string }> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `/api/residents/${residentId}/photos`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve({});
        return;
      }
      try {
        const body = JSON.parse(xhr.responseText);
        resolve({ error: body.error ?? t.photos.uploader.uploadFailed(xhr.status) });
      } catch {
        resolve({ error: t.photos.uploader.uploadFailed(xhr.status) });
      }
    };

    xhr.onerror = () => resolve({ error: t.photos.uploader.networkError });

    const formData = new FormData();
    formData.append("file", file);
    for (const [key, value] of Object.entries(fields)) formData.append(key, value);
    xhr.send(formData);
  });
}

export function PhotoUploader({ residentId }: { residentId: string }) {
  const router = useRouter();
  const { t } = useI18n();
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [dateTaken, setDateTaken] = useState(todayIso);
  // Empty by default, deliberately — a photo dropped in before picking a
  // folder should be rejected, not silently filed under a guessed default.
  const [category, setCategory] = useState<PhotoCategory | "">("");
  const inputRef = useRef<HTMLInputElement>(null);
  const canUpload = category !== "" && dateTaken !== "";

  const updateItem = useCallback((key: string, patch: Partial<QueueItem>) => {
    setQueue((prev) =>
      prev.map((item) => (item.key === key ? { ...item, ...patch } : item)),
    );
  }, []);

  const runQueue = useCallback(
    async (items: QueueItem[]) => {
      let index = 0;
      let refreshNeeded = false;

      async function worker() {
        while (index < items.length) {
          const item = items[index];
          index += 1;
          updateItem(item.key, { status: "uploading" });
          const result = await uploadResidentPhoto(
            t,
            residentId,
            item.file,
            { dateTaken: item.dateTaken, category: item.category },
            (progress) => updateItem(item.key, { progress }),
          );
          if (result.error) {
            updateItem(item.key, { status: "error", error: result.error });
          } else {
            updateItem(item.key, { status: "done", progress: 100 });
            refreshNeeded = true;
          }
        }
      }

      await Promise.all(
        Array.from({ length: Math.min(CONCURRENCY, items.length) }, worker),
      );

      if (refreshNeeded) router.refresh();
    },
    [residentId, router, t, updateItem],
  );

  const addFiles = useCallback(
    (fileList: FileList | null) => {
      if (!canUpload || !fileList || fileList.length === 0) return;
      const files = Array.from(fileList).filter((f) => f.type.startsWith("image/"));
      const items: QueueItem[] = files.map((file) => ({
        key: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
        file,
        dateTaken,
        category: category as PhotoCategory,
        progress: 0,
        status: "queued",
      }));
      if (items.length === 0) return;
      setQueue((prev) => [...prev, ...items]);
      runQueue(items);
    },
    [runQueue, dateTaken, category, canUpload],
  );

  function retry(item: QueueItem) {
    updateItem(item.key, { status: "queued", progress: 0, error: undefined });
    runQueue([item]);
  }

  function dismiss(key: string) {
    setQueue((prev) => prev.filter((item) => item.key !== key));
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="photo-date-taken" className="text-sm font-medium text-muted">
            {t.photos.uploader.dateTaken}
          </label>
          <input
            id="photo-date-taken"
            type="date"
            value={dateTaken}
            max={todayIso()}
            onChange={(e) => setDateTaken(e.target.value)}
            className="rounded border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="photo-category" className="text-sm font-medium text-muted">
            {t.photos.uploader.folder}
          </label>
          <select
            id="photo-category"
            required
            value={category}
            onChange={(e) => setCategory(e.target.value as PhotoCategory)}
            className={`rounded border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/40 ${
              category === "" ? "border-danger" : "border-border focus:border-primary"
            }`}
          >
            <option value="" disabled>
              {t.photos.uploader.selectFolder}
            </option>
            {PHOTO_CATEGORIES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        <p className="pb-2 text-xs text-muted">{t.photos.uploader.folderHint}</p>
      </div>

      <div
        onClick={() => canUpload && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          if (canUpload) setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          addFiles(e.dataTransfer.files);
        }}
        aria-disabled={!canUpload}
        className={`flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed p-8 text-center transition ${
          !canUpload
            ? "cursor-not-allowed border-border bg-surface opacity-60"
            : dragActive
              ? "cursor-pointer border-primary bg-primary/10"
              : "cursor-pointer border-border bg-surface hover:bg-surface-hover"
        }`}
      >
        <span className="text-sm font-medium text-foreground">
          {canUpload
            ? t.photos.uploader.dropHere
            : t.photos.uploader.selectFolderFirst}
        </span>
        <span className="text-xs text-muted">
          {t.photos.uploader.multipleHint}
        </span>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          disabled={!canUpload}
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {queue.length > 0 && (
        <ul className="flex flex-col gap-2">
          {queue.map((item) => (
            <li
              key={item.key}
              className="flex items-center gap-3 rounded border border-border bg-surface px-3 py-2 text-sm"
            >
              <span className="flex-1 truncate text-foreground">
                {item.file.name}
              </span>
              {item.status === "error" ? (
                <>
                  <span className="text-xs text-danger">{item.error}</span>
                  <button
                    type="button"
                    onClick={() => retry(item)}
                    className="rounded border border-border px-2 py-1 text-xs font-medium text-foreground hover:bg-surface-hover"
                  >
                    {t.common.retry}
                  </button>
                  <button
                    type="button"
                    onClick={() => dismiss(item.key)}
                    aria-label={t.common.dismiss}
                    className="text-muted hover:text-foreground"
                  >
                    &times;
                  </button>
                </>
              ) : item.status === "done" ? (
                <span className="text-xs font-medium text-success">
                  {t.photos.uploader.done}
                </span>
              ) : (
                <div className="h-1.5 w-24 overflow-hidden rounded-full bg-surface-hover">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
