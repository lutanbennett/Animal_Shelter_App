"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Download, ExternalLink, Share2 } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { ActionButton } from "@/components/ActionButton";
import { ActionLink } from "@/components/ActionLink";
import { DateInput } from "@/components/DateInput";
import { ArchivedBadge } from "@/components/ArchivedBadge";
import { RowActionButton } from "@/components/RowAction";
import { useConfirm } from "@/components/ConfirmProvider";
import { ACTION_ICONS } from "@/components/hub-icons";
import { textareaClass } from "@/components/textareaClass";
import { driveImageUrl } from "@/lib/google/drive-client";
import { formatDate, todayIso } from "@/lib/format";
import { MEME_NOTE_MAX } from "@/lib/memes/form";
import { PLATFORMS, type Platform } from "@/lib/memes/platforms";
import { PlatformIcon } from "../PlatformIcon";
import { recordMemeShare, removeMemeShare, setMemeArchived } from "../actions";

export type ViewMeme = {
  id: string;
  drive_file_id: string;
  file_name: string | null;
  title: string;
  caption_en: string | null;
  caption_th: string | null;
  tags: string[];
  archived: boolean;
  created_at: string;
  residents: { id: string; name: string; thai_name: string | null }[];
  shares: { id: string; platform: Platform; shared_on: string; post_url: string | null; note: string | null }[];
};

const inputClass =
  "min-h-11 w-full rounded border border-border bg-background px-3 py-2 text-base text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40 sm:text-sm";
const labelClass = "text-sm font-medium text-muted";

/**
 * One meme's page: the picture full width, its words, who is in it, and the record of where it went. Record a share,
 * Edit and Archive show only at social.library Edit (`canEdit`); the database refuses a Read login that tries anyway.
 * Download is a same-origin link with `download`, so the phone saves the file instead of opening it.
 */
export function MemeView({ meme, canEdit, today }: { meme: ViewMeme; canEdit: boolean; today: string }) {
  const { t, locale } = useI18n();
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
  const downloadName = meme.file_name ?? `${meme.title.replace(/[\\/:*?"<>|]+/g, "-")}.jpg`;

  function record() {
    setMessage(null);
    startTransition(async () => {
      const result = await recordMemeShare(meme.id, { platform, sharedOn, postUrl, note });
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
      const result = await removeMemeShare(meme.id, shareId);
      if (!result.ok) return setMessage({ ok: false, text: result.error });
      setMessage({ ok: true, text: m.share.removed });
      router.refresh();
    });
  }

  async function archive(archived: boolean) {
    if (archived) {
      const ok = await confirm({ title: m.page.archiveConfirmTitle, body: m.page.archiveConfirmBody, confirmLabel: m.page.archiveConfirm });
      if (!ok) return;
    }
    setMessage(null);
    startTransition(async () => {
      const result = await setMemeArchived(meme.id, archived);
      if (!result.ok) return setMessage({ ok: false, text: result.error });
      setMessage({ ok: true, text: archived ? m.page.archived : m.page.restored });
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-5">
      {meme.archived && (
        <p className="rounded border border-border bg-surface-hover px-3 py-2 text-sm text-muted">{m.page.archivedNotice}</p>
      )}

      {/* A plain <img>: the photo route, never /_next/image (next.config.ts). The original, not a rendition: it is what gets posted. */}
      <img
        src={driveImageUrl(meme.drive_file_id)}
        alt={m.imageAlt(meme.title)}
        className="max-h-[70vh] w-full rounded-lg border border-border bg-surface-hover object-contain"
      />

      <div className="flex flex-wrap gap-2">
        <a
          href={driveImageUrl(meme.drive_file_id)}
          download={downloadName}
          title={m.page.downloadHint}
          className="inline-flex min-h-11 items-center gap-2 rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover md:min-h-9"
        >
          <Download aria-hidden="true" className="h-5 w-5 md:h-4 md:w-4" />
          {m.page.download}
        </a>
        {canEdit && !recording && (
          <ActionButton icon={Share2} onClick={() => setRecording(true)} disabled={pending}>
            {m.page.recordShare}
          </ActionButton>
        )}
        {canEdit && <ActionLink href={`/memes/${meme.id}/edit`} label={m.page.edit} icon={ACTION_ICONS.edit} iconOnlyOnMobile={false} />}
        {canEdit &&
          (meme.archived ? (
            <ActionButton icon={ACTION_ICONS.restore} onClick={() => archive(false)} disabled={pending}>
              {m.page.unarchive}
            </ActionButton>
          ) : (
            <ActionButton icon={ACTION_ICONS.archive} variant="danger" onClick={() => archive(true)} disabled={pending}>
              {m.page.archive}
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
          <h2 className="text-lg font-semibold text-foreground">{m.share.heading}</h2>
          <div className="flex flex-col gap-1">
            <span className={labelClass}>{m.share.platform}</span>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map((p) => (
                <label
                  key={p}
                  className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded border px-3 text-sm md:min-h-9 ${
                    platform === p ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted hover:bg-surface-hover"
                  }`}
                >
                  <input type="radio" name="platform" value={p} checked={platform === p} onChange={() => setPlatform(p)} className="sr-only" />
                  <PlatformIcon platform={p} />
                  {m.platforms[p]}
                </label>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="share-date" className={labelClass}>
              {m.share.date}
            </label>
            <DateInput id="share-date" value={sharedOn} onChange={(e) => setSharedOn(e.target.value)} max={today} className={inputClass} required />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="share-url" className={labelClass}>
              {m.share.link}
            </label>
            <input id="share-url" type="url" inputMode="url" value={postUrl} onChange={(e) => setPostUrl(e.target.value)} placeholder="https://" className={inputClass} />
            <span className="text-xs text-muted">{m.share.linkHint}</span>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="share-note" className={labelClass}>
              {m.share.note}
            </label>
            <textarea id="share-note" value={note} maxLength={MEME_NOTE_MAX} onChange={(e) => setNote(e.target.value)} className={textareaClass} rows={2} />
            <span className="text-xs text-muted">{m.share.noteHint}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <ActionButton type="submit" icon={Share2} variant="primary" disabled={pending}>
              {pending ? m.share.recording : m.share.record}
            </ActionButton>
            <ActionButton icon={ACTION_ICONS.clear} onClick={() => setRecording(false)} disabled={pending}>
              {t.memes.form.cancel}
            </ActionButton>
          </div>
        </form>
      )}

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-foreground">{m.page.shares}</h2>
        {meme.shares.length === 0 ? (
          <p className="text-base text-muted">{m.page.noShares}</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border rounded border border-border bg-surface">
            {meme.shares.map((s) => (
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
                    <a
                      href={s.post_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 break-all text-sm text-primary hover:underline"
                    >
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
        <h2 className="text-lg font-semibold text-foreground">{m.page.caption}</h2>
        {!meme.caption_en && !meme.caption_th ? (
          <p className="text-base text-muted">—</p>
        ) : (
          <dl className="flex flex-col gap-2">
            {meme.caption_en && (
              <div>
                <dt className="text-xs uppercase text-muted">{m.page.captionEn}</dt>
                <dd className="whitespace-pre-wrap text-base text-foreground">{meme.caption_en}</dd>
              </div>
            )}
            {meme.caption_th && (
              <div>
                <dt className="text-xs uppercase text-muted">{m.page.captionTh}</dt>
                <dd className="whitespace-pre-wrap text-base text-foreground">{meme.caption_th}</dd>
              </div>
            )}
          </dl>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-foreground">{m.page.residents}</h2>
        {meme.residents.length === 0 ? (
          <p className="text-base text-muted">{m.page.noResidents}</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {meme.residents.map((r) => (
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
        <h2 className="text-lg font-semibold text-foreground">{m.page.tags}</h2>
        {meme.tags.length === 0 ? (
          <p className="text-base text-muted">—</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {meme.tags.map((tag) => (
              <li key={tag}>
                <Link href={`/memes?tag=${encodeURIComponent(tag)}`} className="inline-flex items-center rounded-full bg-surface-hover px-2 py-0.5 text-xs font-medium text-muted hover:text-foreground">
                  #{tag}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="flex items-center gap-2 text-sm text-muted">
        {m.page.addedOn(formatDate(meme.created_at, locale))}
        {meme.archived && <ArchivedBadge label={m.archivedBadge} />}
      </p>
    </div>
  );
}
