"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { ActionButton } from "@/components/ActionButton";
import { ACTION_ICONS } from "@/components/hub-icons";
import { ResidentPicker, type ResidentOption } from "@/components/ResidentPicker";
import { textareaClass } from "@/components/textareaClass";
import { driveImageUrl } from "@/lib/google/drive-client";
import { MAX_UPLOAD_BYTES } from "@/lib/uploads/limits";
import { runUploadAction } from "@/lib/uploads/run-upload-action";
import { checkMemeFields, MEME_CAPTION_MAX, MEME_TITLE_MAX, type MemeFields } from "@/lib/memes/form";
import { createMeme, updateMeme } from "./actions";

const inputClass =
  "min-h-11 w-full rounded border border-border bg-background px-3 py-2 text-base text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40 sm:text-sm";
const labelClass = "text-sm font-medium text-muted";
const hintClass = "text-xs text-muted";

/**
 * Add a meme (image, title, captions, tags, residents) or edit its words. On a phone the image field opens the photo
 * library or the files app; `capture` is deliberately not set, since a meme is made elsewhere and chosen, not shot
 * here. The image is fixed once saved: a different picture is a different meme.
 */
export function MemeForm({
  mode,
  memeId,
  initial,
  driveFileId,
  residents,
}: {
  mode: "new" | "edit";
  memeId?: string;
  initial: MemeFields;
  /** Edit only: the picture, shown so the person knows which meme they are editing. */
  driveFileId?: string;
  residents: ResidentOption[];
}) {
  const { t } = useI18n();
  const f = t.memes.form;
  const router = useRouter();
  const [fields, setFields] = useState<MemeFields>(initial);
  const [file, setFile] = useState<File | null>(null);
  // The chosen file's preview URL, made when the file is picked and released when it is replaced or the form goes.
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  function pick(next: File | null) {
    setFile(next);
    setPreview(next ? URL.createObjectURL(next) : null);
  }

  const set = <K extends keyof MemeFields>(key: K, value: MemeFields[K]) => setFields((p) => ({ ...p, [key]: value }));

  function submit() {
    setError(null);
    const problem = checkMemeFields(fields);
    if (problem) return setError(f.errors[problem]);
    if (mode === "new" && !file) return setError(f.errors.noFile);
    if (file && file.size > MAX_UPLOAD_BYTES) return setError(f.errors.fileTooLarge);

    const data = new FormData();
    data.set("title", fields.title);
    data.set("captionEn", fields.captionEn);
    data.set("captionTh", fields.captionTh);
    data.set("tags", fields.tags);
    for (const id of fields.residentIds) data.append("residentIds", id);

    startTransition(async () => {
      if (mode === "new") {
        data.set("file", file!);
        const result = await runUploadAction(
          file!,
          { fileTooLarge: f.errors.fileTooLarge, processingFailed: f.errors.uploadFailed },
          () => createMeme(data),
        );
        if (!result.ok) return setError(result.error);
        router.push(`/memes/${result.id}`);
        return;
      }
      const result = await updateMeme(memeId!, data);
      if (!result.ok) return setError(result.error);
      router.push(`/memes/${memeId}`);
      router.refresh();
    });
  }

  const shownImage = preview ?? (driveFileId ? driveImageUrl(driveFileId, 800) : null);

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
          <span className={labelClass}>{f.image}</span>
          {shownImage && (
            <img src={shownImage} alt="" className="max-h-80 w-full rounded border border-border object-contain bg-surface-hover" />
          )}
          <input
            ref={fileInput}
            type="file"
            name="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif"
            className="sr-only"
            onChange={(e) => pick(e.target.files?.[0] ?? null)}
          />
          <ActionButton icon={ACTION_ICONS.uploadImage} onClick={() => fileInput.current?.click()} disabled={pending}>
            {file ? f.changeImage : f.chooseImage}
          </ActionButton>
          {file && <span className="text-sm text-foreground">{file.name}</span>}
          <span className={hintClass}>{f.imageHint}</span>
        </div>
      )}
      {mode === "edit" && shownImage && (
        <img src={shownImage} alt={t.memes.imageAlt(initial.title)} className="max-h-80 w-full rounded border border-border object-contain bg-surface-hover" />
      )}

      <div className="flex flex-col gap-1">
        <label htmlFor="meme-title" className={labelClass}>
          {f.title}
        </label>
        <input
          id="meme-title"
          value={fields.title}
          maxLength={MEME_TITLE_MAX}
          onChange={(e) => set("title", e.target.value)}
          className={inputClass}
          required
        />
        <span className={hintClass}>{f.titleHint}</span>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="meme-caption-en" className={labelClass}>
          {f.captionEn}
        </label>
        <textarea
          id="meme-caption-en"
          value={fields.captionEn}
          maxLength={MEME_CAPTION_MAX}
          onChange={(e) => set("captionEn", e.target.value)}
          className={textareaClass}
          rows={3}
        />
        <span className={hintClass}>{f.captionHint}</span>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="meme-caption-th" className={labelClass}>
          {f.captionTh}
        </label>
        <textarea
          id="meme-caption-th"
          value={fields.captionTh}
          maxLength={MEME_CAPTION_MAX}
          onChange={(e) => set("captionTh", e.target.value)}
          className={textareaClass}
          rows={3}
        />
      </div>

      <div className="flex flex-col gap-1">
        <span className={labelClass}>{f.residents}</span>
        <ResidentPicker
          residents={residents}
          selectedIds={fields.residentIds}
          onChange={(ids) => set("residentIds", ids)}
          triggerLabel={f.pickResidents}
        />
        <span className={hintClass}>{f.residentsHint}</span>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="meme-tags" className={labelClass}>
          {f.tags}
        </label>
        <input id="meme-tags" value={fields.tags} onChange={(e) => set("tags", e.target.value)} className={inputClass} />
        <span className={hintClass}>{f.tagsHint}</span>
      </div>

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
