"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FileText } from "lucide-react";
import { ActionButton } from "@/components/ActionButton";
import { ACTION_ICONS } from "@/components/hub-icons";
import { uploadAttachmentFile } from "@/components/AttachmentUploader";
import { useConfirm } from "@/components/ConfirmProvider";
import { PhotoViewer } from "@/components/PhotoViewer";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { driveImageUrl } from "@/lib/google/drive-client";
import { removeVisitReport } from "./report-actions";

export type ReportPage = { id: string; driveFileId: string; name: string; isPdf: boolean; caption: string | null };

/**
 * The doctor's report on a visit: pages as thumbnails (photos open in the shared PhotoViewer; a PDF
 * cannot be shown there, so it opens in its own tab), with Add report and Remove for those who may.
 */
export function ReportSection({
  visitId,
  pages,
  defaultDate,
  canEdit,
}: {
  visitId: string;
  pages: ReportPage[];
  defaultDate: string;
  canEdit: boolean;
}) {
  const { t } = useI18n();
  const r = t.vetVisits.record.reports;
  const router = useRouter();
  const confirm = useConfirm();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [date, setDate] = useState(defaultDate);
  const [note, setNote] = useState("");
  const [viewing, setViewing] = useState<number | null>(null);
  const [, startTransition] = useTransition();

  const images = pages.filter((p) => !p.isPdf);

  const add = async (list: FileList | null) => {
    const files = Array.from(list ?? []);
    if (files.length === 0) return;
    setBusy(true);
    setError(null);
    const q = new URLSearchParams({ date });
    if (note.trim()) q.set("note", note.trim());
    for (const file of files) {
      const result = await uploadAttachmentFile(t, `/api/clinic-visits/${visitId}/report?${q}`, file, () => {});
      if (result.error) setError(result.error);
    }
    setBusy(false);
    setNote("");
    router.refresh();
  };

  const remove = async (page: ReportPage) => {
    if (!(await confirm({ body: r.removeConfirm, confirmLabel: r.remove }))) return;
    startTransition(async () => {
      const result = await removeVisitReport(visitId, page.id);
      if (!result.ok) setError(result.error ?? r.removeFailed);
      else router.refresh();
    });
  };

  return (
    <div className="flex flex-col gap-3">
      {pages.length === 0 ? (
        <p className="text-sm text-muted">{r.none}</p>
      ) : (
        <ul className="flex flex-wrap gap-3">
          {pages.map((p) => (
            <li key={p.id} className="flex w-24 flex-col gap-1">
              {p.isPdf ? (
                <a
                  href={driveImageUrl(p.driveFileId)}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`${r.pdf}: ${p.name}`}
                  className="flex h-28 w-24 flex-col items-center justify-center gap-1 rounded border border-border bg-surface-hover text-muted"
                >
                  <FileText aria-hidden="true" className="h-8 w-8" />
                  <span className="text-xs">{r.pdf}</span>
                </a>
              ) : (
                <button
                  type="button"
                  onClick={() => setViewing(images.findIndex((i) => i.id === p.id))}
                  aria-label={r.alt}
                  className="h-28 w-24 overflow-hidden rounded border border-border bg-surface-hover"
                >
                  <img src={driveImageUrl(p.driveFileId, 400)} alt={r.alt} className="h-full w-full object-cover" />
                </button>
              )}
              {p.caption && <span className="text-xs text-muted">{p.caption}</span>}
              {canEdit && (
                <button
                  type="button"
                  onClick={() => void remove(p)}
                  className="min-h-11 text-left text-xs font-medium text-danger hover:underline md:min-h-0"
                >
                  {r.remove}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      {canEdit && (
        <div className="flex max-w-md flex-col gap-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted">{r.dateLabel}</span>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="min-h-11 rounded border border-border bg-surface px-2" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted">{r.noteLabel}</span>
            <input type="text" value={note} maxLength={500} onChange={(e) => setNote(e.target.value)} className="min-h-11 rounded border border-border bg-surface px-2" />
          </label>
          <div>
            <ActionButton compact icon={ACTION_ICONS.uploadImage} disabled={busy} onClick={() => inputRef.current?.click()}>
              {busy ? t.common.saving : pages.length > 0 ? r.addAnother : r.add}
            </ActionButton>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*,application/pdf"
            multiple
            hidden
            onChange={(e) => {
              void add(e.target.files);
              e.target.value = "";
            }}
          />
        </div>
      )}
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      {viewing !== null && viewing >= 0 && (
        <PhotoViewer
          photos={images.map((i) => ({ drive_file_id: i.driveFileId, file_name: i.name }))}
          startIndex={viewing}
          onClose={() => setViewing(null)}
        />
      )}
    </div>
  );
}
