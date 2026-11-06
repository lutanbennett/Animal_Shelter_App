"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Download, ExternalLink, Share2 } from "lucide-react";
import { useWriteCall } from "@/lib/use-write-form";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { ActionButton } from "@/components/ActionButton";
import { ActionLink } from "@/components/ActionLink";
import { DateInput } from "@/components/DateInput";
import { ArchivedBadge } from "@/components/ArchivedBadge";
import { NoteText } from "@/components/NoteText";
import { RowActionButton } from "@/components/RowAction";
import { useConfirm } from "@/components/ConfirmProvider";
import { ACTION_ICONS } from "@/components/hub-icons";
import { textareaClass } from "@/components/textareaClass";
import { formatDate, todayIso } from "@/lib/format";
import { formatDuration, REEL_NOTE_MAX } from "@/lib/reels/form";
import { PLATFORMS, type Platform } from "@/lib/memes/platforms";
import { PlatformIcon } from "../../memes/PlatformIcon";
import { recordReelShare, removeReelShare, setReelArchived } from "../actions";

export type ViewReel = {
  id: string;
  file_name: string | null;
  description: string;
  tags: string[];
  duration_ms: number | null;
  date_taken: string;
  archived: boolean;
  created_at: string;
  residents: { id: string; name: string; thai_name: string | null }[];
  shares: { id: string; platform: Platform; shared_on: string; post_url: string | null; note: string | null }[];
};

const inputClass =
  "min-h-11 w-full rounded border border-border bg-background px-3 py-2 text-base text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40 sm:text-sm";
const labelClass = "text-sm font-medium text-muted";

/**
 * One reel's page: the video, its description with the tagged animals as links, and the record of where it was posted.
 * Record where it was posted, Edit and Archive show only at social.library Edit (`canEdit`), the activity their
 * actions and policies ask; the database refuses a Read login that tries anyway. Download is a same-origin link with
 * `download`, so the phone saves the file instead of opening it. Nothing here publishes anywhere: recording a post is
 * bookkeeping, and posting from the app is #vkswg, on hold.
 */
export function ReelView({ reel, canEdit, today }: { reel: ViewReel; canEdit: boolean; today: string }) {
  const { t, locale } = useI18n();
  const shareWrite = useWriteCall();
  const removeShareWrite = useWriteCall();
  const archiveWrite = useWriteCall();
  const p = t.reels.page;
  const m = t.memes;
  const router = useRouter();
  const confirm = useConfirm();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [recording, setRecording] = useState(false);
  const [platform, setPlatform] = useState<Platform>("facebook");
  const [sharedOn, setSharedOn] = useState(today || todayIso());
  const [postUrl, setPostUrl] = useState("");
  const [note, setNote] = useState("");

  const residentName = (r: { name: string; thai_name: string | null }) => (locale === "th" && r.thai_name ? r.thai_name : r.name);
  const videoUrl = `/api/reels/${reel.id}/video`;
  const downloadName = reel.file_name ?? `reel-${reel.date_taken}.mp4`;
  const length = formatDuration(reel.duration_ms);

  function record() {
    setMessage(null);
    startTransition(async () => {
      const result = await shareWrite((id) => recordReelShare(reel.id, { platform, sharedOn, postUrl, note }, id));
      if (!result.ok) return setMessage({ ok: false, text: result.error });
      setRecording(false);
      setPostUrl("");
      setNote("");
      setMessage({ ok: true, text: m.share.recorded });
      router.refresh();
    });
  }

  async function remove(shareId: string) {
    const ok = await confirm({ title: m.share.removeConfirmTitle, body: m.share.removeConfirmBody, confirmLabel: m.share.remove });
    if (!ok) return;
    setMessage(null);
    startTransition(async () => {
      const result = await removeShareWrite((id) => removeReelShare(reel.id, shareId, id));
      if (!result.ok) return setMessage({ ok: false, text: result.error });
      setMessage({ ok: true, text: m.share.removed });
      router.refresh();
    });
  }

  async function archive(archived: boolean) {
    if (archived) {
      const ok = await confirm({ title: p.archiveConfirmTitle, body: p.archiveConfirmBody, confirmLabel: p.archiveConfirm });
      if (!ok) return;
    }
    setMessage(null);
    startTransition(async () => {
      const result = await archiveWrite((id) => setReelArchived(reel.id, archived, id));
      if (!result.ok) return setMessage({ ok: false, text: result.error });
      setMessage({ ok: true, text: archived ? p.archived : p.restored });
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-5">
      {reel.archived && <p className="rounded border border-border bg-surface-hover px-3 py-2 text-sm text-muted">{p.archivedNotice}</p>}

      {/* preload="metadata": the page draws the first frame and the length, and Drive is asked for the rest only on Play. */}
      <video
        controls
        playsInline
        preload="metadata"
        src={videoUrl}
        className="max-h-[70vh] w-full rounded-lg border border-border bg-black"
      >
        {p.videoUnsupported}
      </video>

      <p className="flex flex-wrap items-center gap-2 text-sm text-muted">
        <span>{p.dateTaken(formatDate(reel.date_taken, locale))}</span>
        {length && <span>· {length}</span>}
        {reel.archived && <ArchivedBadge label={t.reels.archivedBadge} />}
      </p>

      <div className="flex flex-wrap gap-2">
        <a
          href={videoUrl}
          download={downloadName}
          title={p.downloadHint}
          className="inline-flex min-h-11 items-center gap-2 rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover md:min-h-9"
        >
          <Download aria-hidden="true" className="h-5 w-5 md:h-4 md:w-4" />
          {p.download}
        </a>
        {canEdit && !recording && (
          <ActionButton icon={Share2} onClick={() => setRecording(true)} disabled={pending}>
            {p.recordPost}
          </ActionButton>
        )}
        {canEdit && <ActionLink href={`/reels/${reel.id}/edit`} label={p.edit} icon={ACTION_ICONS.edit} iconOnlyOnMobile={false} />}
        {canEdit &&
          (reel.archived ? (
            <ActionButton icon={ACTION_ICONS.restore} onClick={() => archive(false)} disabled={pending}>
              {p.unarchive}
            </ActionButton>
          ) : (
            <ActionButton icon={ACTION_ICONS.archive} variant="danger" onClick={() => archive(true)} disabled={pending}>
              {p.archive}
            </ActionButton>
          ))}
      </div>

      {message && (
        <p
          role={message.ok ? "status" : "alert"}
          className={`rounded border px-3 py-2 text-sm ${message.ok ? "border-success/50 bg-success/10 text-success" : "border-danger/40 bg-danger/10 text-danger"}`}
        >
          {message.text}
        </p>
      )}

      {canEdit && recording && (
        <form
          className="flex flex-col gap-3 rounded border border-border bg-surface p-4"
          onSubmit={(e) => {
            e.preventDefault();
            record();
          }}
        >
          <h2 className="text-lg font-semibold text-foreground">{p.recordPost}</h2>
          <div className="flex flex-col gap-1">
            <span className={labelClass}>{m.share.platform}</span>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map((pl) => (
                <label
                  key={pl}
                  className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded border px-3 text-sm md:min-h-9 ${
                    platform === pl ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted hover:bg-surface-hover"
                  }`}
                >
                  <input type="radio" name="platform" value={pl} checked={platform === pl} onChange={() => setPlatform(pl)} className="sr-only" />
                  <PlatformIcon platform={pl} />
                  {m.platforms[pl]}
                </label>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="post-date" className={labelClass}>
              {m.share.date}
            </label>
            <DateInput id="post-date" value={sharedOn} onChange={(e) => setSharedOn(e.target.value)} max={today} className={inputClass} required />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="post-url" className={labelClass}>
              {m.share.link}
            </label>
            <input id="post-url" type="url" inputMode="url" value={postUrl} onChange={(e) => setPostUrl(e.target.value)} placeholder="https://" className={inputClass} />
            <span className="text-xs text-muted">{m.share.linkHint}</span>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="post-note" className={labelClass}>
              {m.share.note}
            </label>
            <textarea id="post-note" value={note} maxLength={REEL_NOTE_MAX} onChange={(e) => setNote(e.target.value)} className={textareaClass} rows={2} />
            <span className="text-xs text-muted">{m.share.noteHint}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <ActionButton type="submit" icon={Share2} variant="primary" disabled={pending}>
              {pending ? m.share.recording : m.share.record}
            </ActionButton>
            <ActionButton icon={ACTION_ICONS.clear} onClick={() => setRecording(false)} disabled={pending}>
              {t.reels.form.cancel}
            </ActionButton>
          </div>
        </form>
      )}

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-foreground">{p.posts}</h2>
        {reel.shares.length === 0 ? (
          <p className="text-base text-muted">{p.noPosts}</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border rounded border border-border bg-surface">
            {reel.shares.map((s) => (
              <li key={s.id} className="flex items-start gap-3 p-3">
                <span className="mt-0.5 text-success">
                  <PlatformIcon platform={s.platform} className="h-5 w-5" />
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="text-sm font-medium text-foreground">
                    {m.platforms[s.platform]} · {formatDate(s.shared_on, locale)}
                  </span>
                  {s.note && <span className="text-sm text-muted">{s.note}</span>}
                  {s.post_url && (
                    <a href={s.post_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 break-all text-sm text-primary hover:underline">
                      <ExternalLink aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
                      {m.share.openPost}
                    </a>
                  )}
                </div>
                {canEdit && <RowActionButton icon={ACTION_ICONS.delete} label={m.share.remove} onClick={() => remove(s.id)} disabled={pending} />}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-foreground">{p.description}</h2>
        {reel.description ? (
          <p className="whitespace-pre-wrap text-base text-foreground">
            <NoteText text={reel.description} tags={reel.residents.map((r) => ({ id: r.id, name: r.name }))} />
          </p>
        ) : (
          <p className="text-base text-muted">—</p>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-foreground">{p.residents}</h2>
        {reel.residents.length === 0 ? (
          <p className="text-base text-muted">{p.noResidents}</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {reel.residents.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/residents/${r.id}`}
                  className="inline-flex min-h-11 items-center rounded-full border border-border bg-surface px-3 text-sm font-medium text-primary hover:bg-surface-hover md:min-h-9"
                >
                  {residentName(r)}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-foreground">{p.tags}</h2>
        {reel.tags.length === 0 ? (
          <p className="text-base text-muted">{p.noTags}</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {reel.tags.map((tag) => (
              <li key={tag} className="inline-flex items-center rounded-full bg-surface-hover px-2 py-0.5 text-xs font-medium text-muted">
                #{tag}
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-sm text-muted">{p.addedOn(formatDate(reel.created_at, locale))}</p>
    </div>
  );
}
