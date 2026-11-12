"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/I18nProvider";
import {
  ADOPTER_MAX_FILES,
  ADOPTER_MAX_PHOTO_BYTES,
  ADOPTER_MAX_VIDEO_BYTES,
  ADOPTER_NOTE_MAX_CHARS,
} from "@/lib/adopter/limits";
import { VIDEO_MIME_TYPES } from "@/lib/uploads/limits";
import { uploadAdopterVideo } from "@/lib/uploads/resumable-video";
import { uploadResidentPhoto } from "@/components/PhotoUploader";
import { sendAdopterUpdate } from "./actions";

type FileItem = {
  key: string;
  file: File;
  progress: number;
  status: "queued" | "uploading" | "done" | "error";
  error?: string;
  retrying?: boolean;
};

const MB = 1024 * 1024;
const isVideo = (f: File) => VIDEO_MIME_TYPES.has(f.type);

/** The one control on the page. It is drawn only for a resident adopter_residents() returned, the card-free scope its action asks again. */
export function AdopterUpdateForm({ residentId }: { residentId: string }) {
  const { t } = useI18n();
  const a = t.adopterUpdate;
  const router = useRouter();
  const [words, setWords] = useState("");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<"words" | "files" | null>(null);
  const [busy, setBusy] = useState(false);

  // A large video can take minutes on a phone: tell the browser not to throw the upload away if the page is closed by accident.
  useEffect(() => {
    if (!busy) return;
    const stop = (ev: BeforeUnloadEvent) => ev.preventDefault();
    window.addEventListener("beforeunload", stop);
    return () => window.removeEventListener("beforeunload", stop);
  }, [busy]);

  function patch(key: string, change: Partial<FileItem>) {
    setFiles((prev) => prev.map((f) => (f.key === key ? { ...f, ...change } : f)));
  }

  function addFiles(list: FileList | null) {
    if (!list) return;
    const items = Array.from(list).map<FileItem>((file) => {
      const video = isVideo(file);
      const accepted = video || file.type.startsWith("image/");
      const refusal = !accepted
        ? a.media.notAccepted(file.name)
        : video && file.size > ADOPTER_MAX_VIDEO_BYTES
          ? a.media.videoTooLarge(file.name, ADOPTER_MAX_VIDEO_BYTES / MB)
          : !video && file.size > ADOPTER_MAX_PHOTO_BYTES
            ? a.media.photoTooLarge(file.name, ADOPTER_MAX_PHOTO_BYTES / MB)
            : undefined;
      return { key: `${file.name}-${file.size}-${Math.random()}`, file, progress: 0, status: refusal ? "error" : "queued", error: refusal };
    });
    setFiles((prev) => [...prev, ...items]);
  }

  const sendable = files.filter((f) => f.status === "queued" || (f.status === "error" && !refused(f)));
  function refused(f: FileItem) {
    return !(isVideo(f.file) || f.file.type.startsWith("image/")) || f.file.size > (isVideo(f.file) ? ADOPTER_MAX_VIDEO_BYTES : ADOPTER_MAX_PHOTO_BYTES);
  }
  const tooMany = files.filter((f) => f.status !== "done" && !refused(f)).length > ADOPTER_MAX_FILES;

  async function submit() {
    setError(null);
    setSent(null);
    if (tooMany) return setError(a.media.tooManyFiles(ADOPTER_MAX_FILES));
    setBusy(true);
    try {
      let updateId = savedId;
      if (!updateId) {
        const r = await sendAdopterUpdate(residentId, words, sendable.length > 0);
        if (!r.ok) return setError(r.error);
        updateId = r.updateId;
        setSavedId(updateId);
        setWords("");
      }
      let failed = 0;
      for (const item of sendable) {
        patch(item.key, { status: "uploading", progress: 0, error: undefined });
        const result = isVideo(item.file)
          ? await uploadAdopterVideo(
              t,
              { residentId, updateId },
              item.file,
              (progress) => patch(item.key, { progress }),
              (retrying) => patch(item.key, { retrying }),
            )
          : await uploadResidentPhoto(t, residentId, item.file, { residentId, updateId }, (progress) => patch(item.key, { progress }), "adopter");
        if (result.error) {
          failed += 1;
          patch(item.key, { status: "error", error: result.error, retrying: false });
        } else {
          patch(item.key, { status: "done", progress: 100, retrying: false });
        }
      }
      if (failed > 0) {
        setError(a.media.filesFailed(failed));
        router.refresh();
        return;
      }
      setSent(sendable.length > 0 ? "files" : "words");
      setSavedId(null);
      setFiles([]);
      router.refresh();
    } catch {
      setError(t.common.somethingWentWrong("adopter-update"));
    } finally {
      setBusy(false);
    }
  }

  const uploadingNow = files.findIndex((f) => f.status === "uploading");
  const totalToSend = files.length;
  const canPress = !busy && (words.trim().length > 0 || sendable.length > 0);

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(ev) => {
        ev.preventDefault();
        void submit();
      }}
    >
      <label className="text-sm font-medium text-foreground" htmlFor={`words-${residentId}`}>{a.wordsLabel}</label>
      <textarea
        id={`words-${residentId}`}
        value={words}
        onChange={(ev) => setWords(ev.target.value)}
        maxLength={ADOPTER_NOTE_MAX_CHARS}
        rows={4}
        className="rounded border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40"
      />

      <label className="text-sm font-medium text-foreground" htmlFor={`files-${residentId}`}>{a.media.label}</label>
      <input
        id={`files-${residentId}`}
        type="file"
        accept="image/*,video/mp4,video/quicktime"
        multiple
        disabled={busy}
        onChange={(ev) => {
          addFiles(ev.target.files);
          ev.target.value = "";
        }}
        className="text-sm text-foreground file:mr-3 file:rounded file:border file:border-border file:bg-surface file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-foreground"
      />
      <p className="text-xs text-muted">{a.media.hint(ADOPTER_MAX_FILES, ADOPTER_MAX_PHOTO_BYTES / MB, ADOPTER_MAX_VIDEO_BYTES / MB)}</p>

      {files.length > 0 && (
        <ul className="flex flex-col gap-2">
          {files.map((item) => (
            <li key={item.key} className="flex flex-col gap-1 rounded border border-border bg-surface px-3 py-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="min-w-0 flex-1 truncate text-foreground">{item.file.name}</span>
                <span className="whitespace-nowrap text-xs text-muted">
                  {item.status === "done" ? a.media.done : item.status === "queued" ? a.media.queued : item.status === "uploading" ? `${item.progress}%` : ""}
                </span>
                {item.status !== "uploading" && item.status !== "done" && !busy && (
                  <button type="button" className="text-xs font-medium text-foreground underline" onClick={() => setFiles((prev) => prev.filter((f) => f.key !== item.key))}>
                    {a.media.remove}
                  </button>
                )}
              </div>
              {item.status === "uploading" && (
                <div role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={item.progress} className="h-2 w-full overflow-hidden rounded-full bg-surface-hover">
                  <div className="h-full bg-primary transition-all" style={{ width: `${item.progress}%` }} />
                </div>
              )}
              {item.retrying && <span className="text-xs text-muted">{a.media.retrying}</span>}
              {item.status === "error" && item.error && <span role="alert" className="text-xs text-red-700">{item.error}</span>}
            </li>
          ))}
        </ul>
      )}

      {busy && uploadingNow >= 0 && (
        <p role="status" aria-live="polite" className="rounded border border-border bg-surface px-3 py-2 text-sm font-medium text-foreground">
          {a.media.uploadingFile(Math.min(uploadingNow + 1, totalToSend), totalToSend)}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button type="submit" disabled={!canPress} className="rounded bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
          {busy ? a.sending : a.send}
        </button>
        {sent && <span role="status" className="text-sm text-foreground">{sent === "files" ? a.media.sentWithFiles : a.sentWaiting}</span>}
        {error && <span role="alert" className="text-sm text-red-700">{error}</span>}
      </div>
    </form>
  );
}
