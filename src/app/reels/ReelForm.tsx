"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Film } from "lucide-react";
import { useWriteCall } from "@/lib/use-write-form";
import { WRITE_REQUEST_FIELD } from "@/lib/write-requests";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { ActionButton } from "@/components/ActionButton";
import { DateInput } from "@/components/DateInput";
import { TagNoteField } from "@/components/TagNoteField";
import { ACTION_ICONS } from "@/components/hub-icons";
import { textareaClass } from "@/components/textareaClass";
import type { NoteTag } from "@/lib/note-tags/text";
import { MAX_VIDEO_BYTES, VIDEO_MIME_TYPES } from "@/lib/uploads/limits";
import { uploadReelVideo } from "@/lib/uploads/resumable-video";
import { checkReelFields, REEL_DESCRIPTION_MAX } from "@/lib/reels/form";
import { updateReel } from "./actions";

const inputClass =
  "min-h-11 w-full rounded border border-border bg-background px-3 py-2 text-base text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40 sm:text-sm";
const labelClass = "text-sm font-medium text-muted";
const hintClass = "text-xs text-muted";

/**
 * Add a reel (video, description, date taken) or edit its description and date. The video is fixed once saved: a
 * different clip is a different reel. A new video goes to Google Drive from the browser in chunks, never through the
 * app (src/lib/uploads/resumable-video.ts); the description's #tags travel with the finish call.
 *
 * `canTag` is can(perms, "resident.record", "read"), the activity the # picker's own search asks
 * (/api/residents/tag-search). Without it the box is a plain description and a save leaves the residents alone.
 */
export function ReelForm({
  mode,
  reelId,
  initial,
  initialTags = [],
  today,
  canTag,
}: {
  mode: "new" | "edit";
  reelId?: string;
  initial: { description: string; dateTaken: string };
  initialTags?: NoteTag[];
  today: string;
  canTag: boolean;
}) {
  const { t } = useI18n();
  const f = t.reels.form;
  const router = useRouter();
  const updateWrite = useWriteCall();
  const [description, setDescription] = useState(initial.description);
  const [dateTaken, setDateTaken] = useState(initial.dateTaken);
  const [picks, setPicks] = useState<NoteTag[]>(initialTags);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [pending, startTransition] = useTransition();
  const fileInput = useRef<HTMLInputElement>(null);

  function submit() {
    setError(null);
    const problem = checkReelFields({ description, dateTaken });
    if (problem) return setError(f.errors[problem]);
    if (mode === "new") {
      if (!file) return setError(f.errors.noFile);
      if (!VIDEO_MIME_TYPES.has(file.type)) return setError(t.photos.videos.errors.wrongType(file.name));
      if (file.size > MAX_VIDEO_BYTES) return setError(t.photos.videos.errors.tooBig(file.name));
    }

    startTransition(async () => {
      if (mode === "new") {
        setProgress(0);
        const result = await uploadReelVideo(t, file!, { dateTaken, description, picks: canTag ? picks : [] }, setProgress, setRetrying);
        setProgress(null);
        setRetrying(false);
        if (result.error || !result.reelId) return setError(result.error ?? f.errors.saveFailed);
        // A reel whose tags could not be linked is saved; say so on the way past rather than hide it.
        router.push(`/reels/${result.reelId}${result.linkFailed ? "?links=failed" : ""}`);
        return;
      }
      const data = new FormData();
      data.set("description", description);
      data.set("dateTaken", dateTaken);
      if (canTag) data.set("description__tags", JSON.stringify(picks));
      const result = await updateWrite((id) => {
        data.set(WRITE_REQUEST_FIELD, id);
        return updateReel(reelId!, data);
      });
      if (!result.ok) return setError(result.error);
      router.push(`/reels/${reelId}`);
      router.refresh();
    });
  }

  return (
    <form
      className="flex max-w-2xl flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      {mode === "new" && (
        <div className="flex flex-col gap-2">
          <span className={labelClass}>{f.video}</span>
          <input
            ref={fileInput}
            type="file"
            name="file"
            accept="video/mp4,video/quicktime"
            className="sr-only"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <ActionButton icon={Film} onClick={() => fileInput.current?.click()} disabled={pending}>
            {file ? f.changeVideo : f.chooseVideo}
          </ActionButton>
          {file && <span className="text-sm text-foreground">{file.name}</span>}
          <span className={hintClass}>{f.videoHint}</span>
        </div>
      )}

      <div className="flex flex-col gap-1">
        <label htmlFor="reel-description" className={labelClass}>
          {f.description}
        </label>
        <TagNoteField
          name="description"
          id="reel-description"
          rows={4}
          maxLength={REEL_DESCRIPTION_MAX}
          defaultValue={initial.description}
          className={textareaClass}
          canTag={canTag}
          initialTags={initialTags}
          onTextChange={setDescription}
          onTagsChange={setPicks}
        />
        <span className={hintClass}>{f.descriptionHint}</span>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="reel-date" className={labelClass}>
          {f.dateTaken}
        </label>
        <DateInput id="reel-date" value={dateTaken} onChange={(e) => setDateTaken(e.target.value)} max={today} className={inputClass} required />
        <span className={hintClass}>{f.dateTakenHint}</span>
      </div>

      {progress !== null && (
        <p role="status" className="rounded border border-border bg-surface px-3 py-2 text-sm text-foreground">
          {retrying ? f.retrying : f.uploading(progress)}
        </p>
      )}
      {error && (
        <p role="alert" className="rounded border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <ActionButton type="submit" icon={ACTION_ICONS.add} variant="primary" disabled={pending}>
          {pending ? f.saving : f.save}
        </ActionButton>
        <ActionButton icon={ACTION_ICONS.back} onClick={() => router.back()} disabled={pending}>
          {f.cancel}
        </ActionButton>
      </div>
    </form>
  );
}
