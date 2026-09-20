"use client";

import { useCallback, useRef, useState, type ReactNode, type RefObject } from "react";
import Link from "next/link";
import { Camera, X } from "lucide-react";
import { uploadAttachmentFile } from "@/components/AttachmentUploader";
import { useI18n } from "@/lib/i18n/I18nProvider";

export type PendingFile = {
  key: string;
  file: File;
  /** Object URL for an image thumbnail; null for PDFs. */
  previewUrl: string | null;
  progress: number;
  status: "queued" | "uploading" | "done" | "error";
  error?: string;
};

/**
 * Files picked on a form before the record they belong to exists. The form
 * collects them with `addFiles`, saves its details, and then calls
 * `upload(url)` with the new record's attachment route; each file is posted
 * one at a time with progress, and a failed one can be retried by passing
 * it back to `upload` on its own. Sequential on purpose — see the
 * CONCURRENCY note in AttachmentUploader: the routes do a check-then-create
 * on the Drive folder, which isn't safe for two first uploads at once.
 *
 * Only images and PDFs are accepted; anything else dropped in is ignored.
 */
export function useDeferredUploads() {
  const { t } = useI18n();
  const [files, setFiles] = useState<PendingFile[]>([]);

  const addFiles = useCallback((list: FileList | null) => {
    if (!list) return;
    const accepted = Array.from(list).filter(
      (file) => file.type.startsWith("image/") || file.type === "application/pdf",
    );
    setFiles((prev) => [
      ...prev,
      ...accepted.map((file) => ({
        key: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
        file,
        previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
        progress: 0,
        status: "queued" as const,
      })),
    ]);
  }, []);

  const removeFile = useCallback((key: string) => {
    setFiles((prev) => {
      const target = prev.find((item) => item.key === key);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((item) => item.key !== key);
    });
  }, []);

  const patchFile = useCallback((key: string, patch: Partial<PendingFile>) => {
    setFiles((prev) =>
      prev.map((item) => (item.key === key ? { ...item, ...patch } : item)),
    );
  }, []);

  /**
   * Push `items` (default: everything still queued) to `uploadUrl` in
   * order. Resolves once they have all either landed or failed; the caller
   * decides what to do when `failed` is true (typically: stay on the page
   * so the user can retry).
   */
  const upload = useCallback(
    async (uploadUrl: string, items?: PendingFile[]): Promise<{ failed: boolean }> => {
      const targets = items ?? files.filter((item) => item.status === "queued");
      let failed = false;
      for (const item of targets) {
        patchFile(item.key, { status: "uploading", progress: 0, error: undefined });
        const result = await uploadAttachmentFile(t, uploadUrl, item.file, (progress) =>
          patchFile(item.key, { progress }),
        );
        if (result.error) {
          failed = true;
          patchFile(item.key, { status: "error", error: result.error });
        } else {
          patchFile(item.key, { status: "done", progress: 100 });
        }
      }
      return { failed };
    },
    [files, patchFile, t],
  );

  return {
    files,
    addFiles,
    removeFile,
    upload,
    queued: files.filter((item) => item.status === "queued"),
    uploading: files.some((item) => item.status === "uploading"),
    failures: files.filter((item) => item.status === "error"),
    uploadedCount: files.filter((item) => item.status === "done").length,
  };
}

/**
 * The dashed click-or-drop target. Wording is passed in because each record
 * type reads differently ("Drop X-rays…", "Drop photos…").
 */
export function FileDropZone({
  label,
  hint,
  onFiles,
  inputRef,
}: {
  label: string;
  hint: string;
  onFiles: (list: FileList | null) => void;
  inputRef?: RefObject<HTMLInputElement | null>;
}) {
  const ownRef = useRef<HTMLInputElement>(null);
  const ref = inputRef ?? ownRef;
  const [dragActive, setDragActive] = useState(false);

  return (
    <div
      onClick={() => ref.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragActive(true);
      }}
      onDragLeave={() => setDragActive(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragActive(false);
        onFiles(e.dataTransfer.files);
      }}
      className={`flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed p-6 text-center transition ${
        dragActive
          ? "border-primary bg-primary/10"
          : "border-border bg-surface hover:bg-surface-hover"
      }`}
    >
      <Camera aria-hidden="true" className="h-6 w-6 text-muted" />
      <span className="text-sm font-medium text-foreground">{label}</span>
      <span className="text-xs text-muted">{hint}</span>
      <input
        ref={ref}
        type="file"
        accept="image/*,application/pdf"
        multiple
        hidden
        onChange={(e) => {
          onFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}

/** Thumbnail grid of the picked files with per-file progress, error and retry. */
export function PendingFileList({
  files,
  onRemove,
  onRetry,
}: {
  files: PendingFile[];
  /** Removes a still-queued file; null once uploading has started. */
  onRemove: ((key: string) => void) | null;
  onRetry: ((item: PendingFile) => void) | null;
}) {
  const { t } = useI18n();
  if (files.length === 0) return null;

  return (
    <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {files.map((item) => (
        <li
          key={item.key}
          className="relative flex flex-col overflow-hidden rounded border border-border bg-surface-hover"
        >
          {item.previewUrl ? (
            <img
              src={item.previewUrl}
              alt={item.file.name}
              className="aspect-square w-full object-cover"
            />
          ) : (
            <span className="flex aspect-square w-full flex-col items-center justify-center gap-1 p-2 text-center text-xs text-muted">
              <span aria-hidden>📄</span>
              <span className="line-clamp-2 break-all">{item.file.name}</span>
            </span>
          )}
          {item.status === "uploading" && (
            <div className="absolute inset-x-0 bottom-0 h-1.5 bg-black/40">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${item.progress}%` }}
              />
            </div>
          )}
          {item.status === "done" && (
            <span className="absolute bottom-1 left-1 rounded bg-success px-1.5 text-xs font-medium text-success-foreground">
              {t.photos.uploader.done}
            </span>
          )}
          {item.status === "error" && (
            <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1 bg-black/70 p-1.5">
              <span className="line-clamp-2 text-xs text-danger">{item.error}</span>
              {onRetry && (
                <button
                  type="button"
                  onClick={() => onRetry(item)}
                  className="rounded bg-surface px-2 py-1 text-xs font-medium text-foreground hover:bg-surface-hover"
                >
                  {t.common.retry}
                </button>
              )}
            </div>
          )}
          {onRemove && item.status === "queued" && (
            <button
              type="button"
              onClick={() => onRemove(item.key)}
              aria-label={t.uploads.removeFile}
              className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white hover:bg-danger"
            >
              <X aria-hidden="true" className="h-3.5 w-3.5" />
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}

/**
 * What a form shows once its record is saved and the picked files are on
 * their way: the saved message with a running count, then — only if some
 * failed — the retry grid and a way to move on without them. A form that
 * has nothing to upload never renders this; it navigates straight away.
 */
export function UploadProgressPanel({
  saved,
  uploads,
  onRetry,
  continueHref,
  continueLabel,
  labels,
}: {
  saved: ReactNode;
  uploads: ReturnType<typeof useDeferredUploads>;
  onRetry: (item: PendingFile) => void;
  continueHref: string;
  continueLabel: string;
  /** Overrides for a form whose files are all photos, say. */
  labels?: {
    uploading?: (done: number, total: number) => string;
    uploadsFailed?: string;
  };
}) {
  const { t } = useI18n();
  const { files, uploading, failures, uploadedCount } = uploads;
  const uploadingLabel = labels?.uploading ?? t.uploads.uploading;
  const failedLabel = labels?.uploadsFailed ?? t.uploads.uploadsFailed;

  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <p className="rounded-lg border border-success/40 bg-success/10 p-4 text-sm font-medium text-success">
        {saved}{" "}
        {uploading || failures.length === 0 ? uploadingLabel(uploadedCount, files.length) : null}
      </p>
      {!uploading && failures.length > 0 && (
        <p className="text-sm text-danger">{failedLabel}</p>
      )}
      <PendingFileList
        files={files}
        onRemove={null}
        onRetry={!uploading ? onRetry : null}
      />
      {!uploading && failures.length > 0 && (
        <div>
          <Link
            href={continueHref}
            className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
          >
            {continueLabel}
          </Link>
        </div>
      )}
    </div>
  );
}
