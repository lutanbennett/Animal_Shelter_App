"use client";

import { useCallback, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";

type UploadStatus = "queued" | "uploading" | "done" | "error";

type QueueItem = {
  key: string;
  file: File;
  progress: number;
  status: UploadStatus;
  error?: string;
};

export type UploadedAttachment = {
  attachmentId: string;
  fileName: string;
  mimeType: string;
  fileUrl: string;
};

// Sequential, not parallel — mirrors PhotoUploader: the upload route does a
// check-then-create when resolving/creating the resident's Drive folder
// tree, so concurrent first uploads for a resident without one yet can each
// see "not found" before either finishes creating it.
const CONCURRENCY = 1;

/**
 * One multipart POST with upload progress (XHR, since fetch can't report
 * it). Exported so a form that collects files before its record exists —
 * the maintenance form — can push them through the same route afterwards.
 */
export function uploadAttachmentFile(
  t: Dictionary,
  uploadUrl: string,
  file: File,
  onProgress: (percent: number) => void,
): Promise<{ error?: string; attachment?: UploadedAttachment }> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", uploadUrl);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const body = JSON.parse(xhr.responseText);
          resolve({
            attachment: {
              attachmentId: body.attachmentId,
              fileName: body.fileName,
              mimeType: body.mimeType,
              fileUrl: body.fileUrl,
            },
          });
        } catch {
          resolve({ error: t.photos.uploader.uploadFailed(xhr.status) });
        }
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
    xhr.send(formData);
  });
}

/**
 * Drop zone + queue for attaching images and PDFs to a medical record (a
 * blood test's lab scan, a procedure's X-ray). The record's own upload
 * route — `/api/blood-tests/[id]/attachments`, `/api/procedures/[id]/…` —
 * decides where the file lands in Drive and which owner it's recorded
 * against; this component only knows the URL. The drop-zone wording is
 * passed in because each record type reads differently.
 */
export function AttachmentUploader({
  uploadUrl,
  dropHere,
  hint,
  onUploaded,
}: {
  /** POST target that accepts a multipart `file` and returns the attachment. */
  uploadUrl: string;
  dropHere: string;
  hint: string;
  onUploaded?: (attachment: UploadedAttachment) => void;
}) {
  const { t } = useI18n();
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const updateItem = useCallback((key: string, patch: Partial<QueueItem>) => {
    setQueue((prev) =>
      prev.map((item) => (item.key === key ? { ...item, ...patch } : item)),
    );
  }, []);

  const runQueue = useCallback(
    async (items: QueueItem[]) => {
      let index = 0;

      async function worker() {
        while (index < items.length) {
          const item = items[index];
          index += 1;
          updateItem(item.key, { status: "uploading" });
          const result = await uploadAttachmentFile(t, uploadUrl, item.file, (progress) =>
            updateItem(item.key, { progress }),
          );
          if (result.error) {
            updateItem(item.key, { status: "error", error: result.error });
          } else {
            updateItem(item.key, { status: "done", progress: 100 });
            if (result.attachment) onUploaded?.(result.attachment);
          }
        }
      }

      await Promise.all(
        Array.from({ length: Math.min(CONCURRENCY, items.length) }, worker),
      );
    },
    [uploadUrl, onUploaded, t, updateItem],
  );

  const addFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return;
      const files = Array.from(fileList).filter(
        (f) => f.type.startsWith("image/") || f.type === "application/pdf",
      );
      const items: QueueItem[] = files.map((file) => ({
        key: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
        file,
        progress: 0,
        status: "queued",
      }));
      if (items.length === 0) return;
      setQueue((prev) => [...prev, ...items]);
      runQueue(items);
    },
    [runQueue],
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
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          addFiles(e.dataTransfer.files);
        }}
        className={`flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed p-8 text-center transition ${
          dragActive
            ? "border-primary bg-primary/10"
            : "border-border bg-surface hover:bg-surface-hover"
        }`}
      >
        <span className="text-sm font-medium text-foreground">{dropHere}</span>
        <span className="text-xs text-muted">{hint}</span>
        <input
          ref={inputRef}
          type="file"
          accept="image/*,application/pdf"
          multiple
          hidden
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
