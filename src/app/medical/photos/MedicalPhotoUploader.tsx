"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, CheckCircle2, ImagePlus, Loader2, RotateCcw, XCircle } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";

type Status = "queued" | "uploading" | "done" | "error";

type Item = {
  key: string;
  file: File;
  preview: string;
  progress: number;
  status: Status;
  error?: string;
};

/**
 * The Head of Medical's photo uploader: a camera button and a gallery button, big, and a tile
 * per photo that shows the picture itself with a tick, a spinner or a red cross over it. She
 * cannot read `attachments` (0140), so the local preview is also how she sees what she filed.
 * One at a time, as the staff uploader does: the first upload may create the resident's Drive
 * folder and two at once would make two. Posts to the sibling route (not the staff one).
 */
export function MedicalPhotoUploader({ residentId }: { residentId: string }) {
  const { t } = useI18n();
  const p = t.medicalJobs.photos;
  const [items, setItems] = useState<Item[]>([]);
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const running = useRef(false);
  // The ref is the queue the drain loop reads; state is only what is drawn.
  const itemsRef = useRef<Item[]>([]);

  const commit = useCallback((next: Item[]) => {
    itemsRef.current = next;
    setItems(next);
  }, []);

  const patch = useCallback(
    (key: string, change: Partial<Item>) => {
      commit(itemsRef.current.map((i) => (i.key === key ? { ...i, ...change } : i)));
    },
    [commit],
  );

  const send = useCallback(
    (item: Item) =>
      new Promise<void>((resolve) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `/api/medical/residents/${residentId}/photos`);
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) patch(item.key, { progress: Math.round((e.loaded / e.total) * 100) });
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            patch(item.key, { status: "done", progress: 100 });
          } else {
            let message = t.photos.uploader.uploadFailed(xhr.status);
            try {
              message = JSON.parse(xhr.responseText).error ?? message;
            } catch {
              /* keep the status sentence */
            }
            patch(item.key, { status: "error", error: message });
          }
          resolve();
        };
        xhr.onerror = () => {
          patch(item.key, { status: "error", error: t.photos.uploader.networkError });
          resolve();
        };
        const form = new FormData();
        form.append("file", item.file);
        xhr.send(form);
      }),
    [patch, residentId, t],
  );

  const drain = useCallback(async () => {
    if (running.current) return;
    running.current = true;
    try {
      for (;;) {
        const next = itemsRef.current.find((i) => i.status === "queued");
        if (!next) break;
        patch(next.key, { status: "uploading" });
        await send(next);
      }
    } finally {
      running.current = false;
    }
  }, [patch, send]);

  const add = (list: FileList | null) => {
    if (!list) return;
    const fresh: Item[] = Array.from(list)
      .filter((f) => f.type.startsWith("image/"))
      .map((file) => ({
        key: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
        file,
        preview: URL.createObjectURL(file),
        progress: 0,
        status: "queued" as const,
      }));
    if (fresh.length === 0) return;
    commit([...itemsRef.current, ...fresh]);
    void drain();
  };

  const retry = (key: string) => {
    patch(key, { status: "queued", progress: 0, error: undefined });
    void drain();
  };

  // Free the previews when the page goes.
  useEffect(
    () => () => {
      for (const i of itemsRef.current) URL.revokeObjectURL(i.preview);
    },
    [],
  );

  const saved = items.filter((i) => i.status === "done").length;
  const button =
    "flex min-h-24 flex-col items-center justify-center gap-1 rounded-lg border-2 border-foreground bg-surface px-2 text-foreground";

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <button type="button" onClick={() => cameraRef.current?.click()} className={button}>
          <Camera aria-hidden className="h-10 w-10" />
          <span className="text-center text-lg font-semibold leading-tight">{p.take}</span>
        </button>
        <button type="button" onClick={() => galleryRef.current?.click()} className={button}>
          <ImagePlus aria-hidden className="h-10 w-10" />
          <span className="text-center text-lg font-semibold leading-tight">{p.choose}</span>
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

      {items.length > 0 && (
        <>
          <p role="status" className="text-lg font-semibold text-foreground">
            {p.count(saved)}
          </p>
          <ul className="grid grid-cols-3 gap-2">
            {items.map((item) => (
              <li key={item.key} className="flex flex-col gap-1">
                <span className="relative block aspect-square overflow-hidden rounded-lg border border-border bg-background">
                  <img src={item.preview} alt={item.file.name} className="h-full w-full object-cover" />
                  <span
                    className={`absolute inset-0 flex items-center justify-center ${
                      item.status === "done" ? "bg-green-600/30" : item.status === "error" ? "bg-red-600/40" : "bg-black/30"
                    }`}
                  >
                    {item.status === "done" && (
                      <CheckCircle2 aria-label={p.done} role="img" className="h-10 w-10 text-white drop-shadow" />
                    )}
                    {item.status === "error" && (
                      <XCircle aria-label={p.failed} role="img" className="h-10 w-10 text-white drop-shadow" />
                    )}
                    {(item.status === "queued" || item.status === "uploading") && (
                      <Loader2 aria-label={p.uploading} role="img" className="h-10 w-10 animate-spin text-white drop-shadow" />
                    )}
                  </span>
                </span>
                {item.status === "error" && (
                  <>
                    <span className="break-words text-xs text-red-800">{item.error}</span>
                    <button
                      type="button"
                      onClick={() => retry(item.key)}
                      className="flex min-h-10 items-center justify-center gap-1 rounded border border-border text-sm font-medium text-foreground"
                    >
                      <RotateCcw aria-hidden className="h-4 w-4" />
                      {p.retry}
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
