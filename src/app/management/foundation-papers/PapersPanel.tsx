"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useWriteCall } from "@/lib/use-write-form";
import { WRITE_REQUEST_FIELD } from "@/lib/write-requests";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { MAX_UPLOAD_BYTES } from "@/lib/uploads/limits";
import { runUploadAction } from "@/lib/uploads/run-upload-action";
import { MONTHLY_CATEGORIES, type PaperCategory } from "@/lib/foundation/papers";
import { fileFoundationPaper, removeFoundationPaper } from "./actions";

export type PaperRow = {
  id: string;
  category: PaperCategory;
  title: string;
  period: string | null;
  note: string | null;
  driveFileId: string;
  fileName: string;
  createdAt: string;
};

const inputClass =
  "min-h-11 w-full rounded border border-border bg-background px-3 py-2 text-base text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40 sm:text-sm";
const labelClass = "text-sm font-medium text-muted";

/**
 * The list of papers and, for a login whose cards allow it, the form to file one and a Remove on each row. `canEdit` is the activity the
 * page's own actions ask (foundation.papers or foundation.id_copies at edit) and defaults to false: a caller that forgets offers nothing.
 * An empty store says so plainly, with no hole where a paper would be.
 */
export function PapersPanel({ rows, categories, canEdit = false }: { rows: PaperRow[]; categories: PaperCategory[]; canEdit?: boolean }) {
  const { t } = useI18n();
  const f = t.foundationPapers;
  const router = useRouter();
  const fileWrite = useWriteCall();
  const removeWrite = useWriteCall();
  const [category, setCategory] = useState<PaperCategory>(categories[0]);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const monthly = MONTHLY_CATEGORIES.includes(category);

  function submit(form: HTMLFormElement) {
    setError(null);
    setNotice(null);
    if (!file) return setError(f.errors.noFile);
    const chosen = file;
    const data = new FormData(form);
    data.set("file", chosen);
    startTransition(async () => {
      const result = await runUploadAction(chosen, { fileTooLarge: f.errors.fileTooLarge, processingFailed: f.errors.uploadFailed }, () =>
        fileWrite((id) => {
          data.set(WRITE_REQUEST_FIELD, id);
          return fileFoundationPaper(data);
        }),
      );
      if (!result.ok) return setError(result.error);
      form.reset();
      setFile(null);
      setNotice(f.filed);
      router.refresh();
    });
  }

  function remove(id: string) {
    if (!window.confirm(f.removeConfirm)) return;
    setError(null);
    setNotice(null);
    startTransition(async () => {
      const result = await removeWrite((requestId) => removeFoundationPaper(id, requestId));
      if (!result.ok) return setError(result.error);
      setNotice(f.removed);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {canEdit && (
        <form
          className="flex max-w-2xl flex-col gap-4 rounded border border-border p-4"
          onSubmit={(e) => {
            e.preventDefault();
            submit(e.currentTarget);
          }}
        >
          <h2 className="text-lg font-semibold text-foreground">{f.add}</h2>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>{f.category}</span>
            <select name="category" className={inputClass} value={category} onChange={(e) => setCategory(e.target.value as PaperCategory)}>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {f.categories[c]}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>{f.titleLabel}</span>
            <input name="title" type="text" required className={inputClass} placeholder={f.titleHint} />
          </label>
          {monthly && (
            <label className="flex flex-col gap-1">
              <span className={labelClass}>{f.month}</span>
              <input name="month" type="month" required className={inputClass} />
              <span className="text-xs text-muted">{f.monthHint}</span>
            </label>
          )}
          <label className="flex flex-col gap-1">
            <span className={labelClass}>{f.note}</span>
            <input name="note" type="text" className={inputClass} />
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>{f.file}</span>
            <input
              type="file"
              accept="application/pdf,image/jpeg,image/png,image/webp,image/heic,image/heif"
              className={inputClass}
              onChange={(e) => {
                const next = e.target.files?.[0] ?? null;
                if (next && next.size > MAX_UPLOAD_BYTES) {
                  setFile(null);
                  setError(f.errors.fileTooLarge);
                } else {
                  setFile(next);
                }
              }}
            />
          </label>
          <button type="submit" disabled={pending} className="min-h-11 self-start rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50">
            {pending ? f.saving : f.save}
          </button>
        </form>
      )}

      {error && <p role="alert" className="text-danger">{error}</p>}
      {notice && <p role="status" className="text-success">{notice}</p>}

      {rows.length === 0 ? (
        <div className="max-w-2xl rounded border border-dashed border-border p-6 text-center">
          <p className="text-base font-medium text-foreground">{f.empty}</p>
          <p className="text-sm text-muted">{f.emptyHint}</p>
        </div>
      ) : (
        <ul className="flex max-w-3xl flex-col gap-2">
          {rows.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 rounded border border-border p-3">
              <div className="min-w-0">
                <p className="truncate font-medium text-foreground">{r.title}</p>
                <p className="text-sm text-muted">
                  {f.categories[r.category]}
                  {r.period ? ` · ${r.period.slice(0, 7)}` : ""}
                </p>
                {r.note && <p className="text-sm text-muted">{r.note}</p>}
              </div>
              <div className="flex shrink-0 gap-2">
                <a
                  href={`/api/documents/${r.driveFileId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-11 items-center rounded border border-border px-3 text-sm text-foreground hover:bg-surface-hover md:min-h-9"
                >
                  {f.open}
                </a>
                {canEdit && (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => remove(r.id)}
                    className="min-h-11 rounded border border-danger/40 px-3 text-sm text-danger hover:bg-danger/10 disabled:opacity-50 md:min-h-9"
                  >
                    {f.remove}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
