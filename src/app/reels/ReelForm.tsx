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

type ClipItem = { file: File; status: "queued" | "done" | "failed"; error?: string; reelId?: string };
/** What is typed against one uploaded clip in the per-clip list, keyed by its reel id. */
type RowFields = { description: string; dateTaken: string; picks: NoteTag[]; saved?: boolean; error?: string };

/** The per-file size and type checks, as a message for that one clip or null. */
function clipProblem(file: File, m: { wrongType: (n: string) => string; tooBig: (n: string) => string }): string | null {
  if (!VIDEO_MIME_TYPES.has(file.type)) return m.wrongType(file.name);
  if (file.size > MAX_VIDEO_BYTES) return m.tooBig(file.name);
  return null;
}

/**
 * Add a reel (video, description, date taken) or edit its description and date. The video is fixed once saved: a
 * different clip is a different reel. A new video goes to Google Drive from the browser in chunks, never through the
 * app (src/lib/uploads/resumable-video.ts); the description's #tags travel with the finish call.
 *
 * `canTag` is can(perms, "resident.who_and_where", "read"), the activity the # picker's own search asks
 * (/api/reels/resident-search). Without it the box is a plain description and a save leaves the residents alone.
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
  // New reels only: the clips picked so far. One clip is the ordinary form; two or more is a batch (serial upload,
  // blank description, today's date, edited afterwards). Edit never touches this.
  const [items, setItems] = useState<ClipItem[]>([]);
  const [sending, setSending] = useState<{ n: number; total: number; index: number } | null>(null);
  const batch = mode === "new" && items.length > 1;
  const [rows, setRows] = useState<Record<string, RowFields>>({});
  const doneClips = items.filter((it) => it.status === "done" && it.reelId);
  const allDone = batch && items.length > 0 && items.every((it) => it.status === "done");
  const rowOf = (id: string): RowFields => rows[id] ?? { description: "", dateTaken: today, picks: [] };
  const setRow = (id: string, patch: Partial<RowFields>) =>
    setRows((cur) => ({ ...cur, [id]: { ...(cur[id] ?? { description: "", dateTaken: today, picks: [] }), ...patch, saved: false, error: undefined } }));

  /** Save each described row with updateReel. An untouched row is skipped: it is the reel as it already stands. */
  function saveRows() {
    setError(null);
    startTransition(async () => {
      const next = { ...rows };
      let failed = 0;
      for (const it of doneClips) {
        const id = it.reelId!;
        const r = next[id];
        if (!r || r.saved || (r.description === "" && r.dateTaken === today)) continue;
        const data = new FormData();
        data.set("description", r.description);
        data.set("dateTaken", r.dateTaken);
        if (canTag) data.set("description__tags", JSON.stringify(r.picks));
        const result = await updateWrite((wid) => {
          data.set(WRITE_REQUEST_FIELD, wid);
          return updateReel(id, data);
        });
        next[id] = result.ok ? { ...r, saved: true, error: undefined } : { ...r, error: result.error };
        if (!result.ok) failed++;
      }
      setRows(next);
      if (failed) return setError(f.rowsSomeFailed(failed));
      router.push("/reels");
      router.refresh();
    });
  }
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [pending, startTransition] = useTransition();
  const fileInput = useRef<HTMLInputElement>(null);

  function submit() {
    setError(null);
    const problem = checkReelFields({ description, dateTaken });
    if (problem) return setError(f.errors[problem]);
    if (allDone) return saveRows();
    if (mode === "new" && items.length === 0) return setError(f.errors.noFile);
    if (mode === "new" && !batch) {
      const bad = clipProblem(items[0].file, t.photos.videos.errors);
      if (bad) return setError(bad);
    }

    startTransition(async () => {
      if (batch) {
        // One after another, never in parallel: five 500 MB clips on a phone connection would stall each other.
        // A clip that fails is marked and the rest carry on; saving again retries only the ones not done.
        const queue = items.map((it): ClipItem => (it.status === "done" ? it : { file: it.file, status: "queued" }));
        const toSend = queue.map((_, i) => i).filter((i) => queue[i].status !== "done");
        // Clear earlier failures so a retry shows every unsent clip as waiting, not with the last run's error.
        setItems([...queue]);
        for (let k = 0; k < toSend.length; k++) {
          const i = toSend[k];
          setSending({ n: k + 1, total: toSend.length, index: i });
          const bad = clipProblem(queue[i].file, t.photos.videos.errors);
          if (bad) {
            queue[i] = { file: queue[i].file, status: "failed", error: bad };
          } else {
            setProgress(0);
            const result = await uploadReelVideo(t, queue[i].file, { dateTaken: today, description: "", picks: [] }, setProgress, setRetrying);
            setProgress(null);
            setRetrying(false);
            queue[i] =
              result.error || !result.reelId
                ? { file: queue[i].file, status: "failed", error: result.error ?? f.errors.saveFailed }
                : { file: queue[i].file, status: "done", reelId: result.reelId };
          }
          setItems([...queue]);
        }
        setSending(null);
        if (!queue.every((it) => it.status === "done")) {
          setError(f.batchSomeFailed(queue.filter((it) => it.status === "done").length, queue.length));
        }
        return;
      }
      if (mode === "new") {
        setProgress(0);
        const result = await uploadReelVideo(t, items[0].file, { dateTaken, description, picks: canTag ? picks : [] }, setProgress, setRetrying);
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
            multiple
            accept="video/mp4,video/quicktime"
            className="sr-only"
            onChange={(e) => {
              // Accumulate, so clips from the camera and from the library can be added in turn.
              const picked = Array.from(e.target.files ?? []);
              e.target.value = "";
              setError(null);
              setItems((cur) => [
                ...cur,
                ...picked.map((file): ClipItem => {
                  const bad = clipProblem(file, t.photos.videos.errors);
                  return bad ? { file, status: "failed", error: bad } : { file, status: "queued" };
                }),
              ]);
            }}
          />
          <span className={hintClass}>{f.pickerHint}</span>
          <ActionButton icon={Film} onClick={() => fileInput.current?.click()} disabled={pending}>
            {items.length ? f.addMoreVideos : f.chooseVideo}
          </ActionButton>
          {items.length > 0 && (
            <ul className="flex flex-col gap-1">
              {items.map((it, i) => (
                <li key={`${it.file.name}-${i}`} className="flex flex-wrap items-center gap-2 text-sm text-foreground">
                  <span>{it.file.name}</span>
                  {batch && it.status === "done" && <span className="text-muted">{f.clipDone}</span>}
                  {batch && sending && it.status === "queued" && (sending.index === i ? (
                    <strong role="status">{retrying ? f.retrying : f.uploading(progress ?? 0)}</strong>
                  ) : (
                    <span className="text-muted">{f.clipWaiting}</span>
                  ))}
                  {it.error && <span className="text-danger">{it.error}</span>}
                  {it.status !== "done" && (
                    <button type="button" className="text-xs text-muted underline" disabled={pending} onClick={() => setItems((cur) => cur.filter((_, j) => j !== i))}>
                      {f.removeClip}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
          <span className={hintClass}>{f.videoHint}</span>
          {batch && <span className={hintClass}>{f.batchHint}</span>}
        </div>
      )}

      {batch && doneClips.length > 0 && (
        <div className="flex flex-col gap-3">
          <span className={labelClass}>{f.rowsHeading}</span>
          <ul className="flex flex-col gap-4">
            {doneClips.map((it) => {
              const id = it.reelId!;
              const r = rowOf(id);
              return (
                <li key={id} className="flex flex-col gap-2 rounded border border-border p-3">
                  <span className="text-sm font-medium text-foreground">{it.file.name}</span>
                  <TagNoteField
                    name={"description-" + id}
                    id={"reel-description-" + id}
                    rows={3}
                    maxLength={REEL_DESCRIPTION_MAX}
                    defaultValue=""
                    className={textareaClass}
                    canTag={canTag}
                    searchUrl="/api/reels/resident-search"
                    initialTags={[]}
                    onTextChange={(v: string) => setRow(id, { description: v })}
                    onTagsChange={(v: NoteTag[]) => setRow(id, { picks: v })}
                  />
                  <label htmlFor={"reel-date-" + id} className={labelClass}>
                    {f.dateTaken}
                  </label>
                  <DateInput id={"reel-date-" + id} value={r.dateTaken} onChange={(e) => setRow(id, { dateTaken: e.target.value })} max={today} className={inputClass} required />
                  {r.saved && <span className="text-xs text-muted">{f.rowSaved}</span>}
                  {r.error && <span className="text-xs text-danger">{r.error}</span>}
                </li>
              );
            })}
          </ul>
          <span className={hintClass}>{f.rowsLeaveHint}</span>
        </div>
      )}

      {!batch && (
        <>
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
          searchUrl="/api/reels/resident-search"
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
        </>
      )}

      {progress !== null && !batch && (
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
          {pending ? f.saving : allDone ? f.saveRows : f.save}
        </ActionButton>
        <ActionButton icon={ACTION_ICONS.back} onClick={() => router.back()} disabled={pending}>
          {f.cancel}
        </ActionButton>
      </div>
    </form>
  );
}
