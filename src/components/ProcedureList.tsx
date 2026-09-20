"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Paperclip } from "lucide-react";
import { driveImageUrl } from "@/lib/google/drive-client";
import { deleteProcedureAttachment } from "@/app/residents/[id]/procedures/actions";
import { AttachmentUploader } from "@/components/AttachmentUploader";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { formatDate } from "@/lib/format";

const IMAGE_EXTENSIONS = /\.(jpe?g|png|webp|heic|heif|gif)$/i;

function isLikelyImage(fileName: string | null) {
  return !!fileName && IMAGE_EXTENSIONS.test(fileName);
}

export type ProcedureAttachmentRow = {
  id: string;
  drive_file_id: string;
  file_name: string | null;
};

export type ProcedureRow = {
  id: string;
  date: string;
  notes: string | null;
  procedure_types: { name: string } | null;
  vet_appointments: { appointment_date: string; reason: string | null } | null;
  attachments: ProcedureAttachmentRow[];
};

/**
 * The Procedures tab list. Unlike a blood test, a procedure's files often
 * arrive after the record does (the clinic sends the X-ray later), so each
 * row can open an uploader in place rather than only right after saving.
 */
export function ProcedureList({
  residentId,
  procedures,
  readOnly = false,
}: {
  residentId: string;
  procedures: ProcedureRow[];
  /** A closed record (deceased resident): files can be opened, not changed. */
  readOnly?: boolean;
}) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [attachingTo, setAttachingTo] = useState<string | null>(null);

  function removeAttachment(attachmentId: string) {
    startTransition(async () => {
      const result = await deleteProcedureAttachment(residentId, attachmentId);
      if (!result?.error) router.refresh();
    });
  }

  if (procedures.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted">
        {t.residents.sections.empty.procedures}
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {procedures.map((procedure) => {
        const attaching = attachingTo === procedure.id;
        return (
          <li
            key={procedure.id}
            className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col">
                <span className="font-medium text-foreground">
                  {procedure.procedure_types?.name ?? t.procedures.unknownType}
                </span>
                <span className="text-xs text-muted">
                  {procedure.vet_appointments
                    ? t.procedures.linkedVisitLabel(
                        formatDate(procedure.vet_appointments.appointment_date, locale),
                        procedure.vet_appointments.reason ??
                          t.residents.sections.vetVisitFallback,
                      )
                    : t.procedures.doneAtShelter}
                </span>
              </div>
              <span className="shrink-0 text-xs text-muted">
                {formatDate(procedure.date, locale)}
              </span>
            </div>

            {procedure.notes && (
              <p className="whitespace-pre-wrap text-sm text-foreground">
                {procedure.notes}
              </p>
            )}

            {procedure.attachments.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {procedure.attachments.map((attachment) => {
                  const url = driveImageUrl(attachment.drive_file_id);
                  const image = isLikelyImage(attachment.file_name);
                  return (
                    <div
                      key={attachment.id}
                      className="group relative overflow-hidden rounded border border-border bg-surface-hover"
                    >
                      <a href={url} target="_blank" rel="noreferrer">
                        {image ? (
                          <img
                            src={url}
                            alt={attachment.file_name ?? t.procedures.fileFallback}
                            className="h-24 w-24 object-cover"
                          />
                        ) : (
                          <span className="flex h-24 w-24 flex-col items-center justify-center gap-1 p-2 text-center text-xs text-muted">
                            <span aria-hidden>📄</span>
                            <span className="truncate">
                              {attachment.file_name ?? t.procedures.fileFallback}
                            </span>
                          </span>
                        )}
                      </a>
                      {!readOnly && (
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => removeAttachment(attachment.id)}
                          aria-label={t.common.remove}
                          className="absolute right-0.5 top-0.5 hidden rounded-full bg-black/60 px-1.5 text-xs text-white hover:bg-danger group-hover:block disabled:opacity-60"
                        >
                          &times;
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-muted">{t.procedures.noFiles}</p>
            )}

            {!readOnly &&
              (attaching ? (
                <div className="flex flex-col gap-2">
                  <AttachmentUploader
                    uploadUrl={`/api/procedures/${procedure.id}/attachments`}
                    dropHere={t.procedures.uploader.dropHere}
                    hint={t.procedures.uploader.hint}
                    onUploaded={() => router.refresh()}
                  />
                  <button
                    type="button"
                    onClick={() => setAttachingTo(null)}
                    className="self-start text-xs font-medium text-muted hover:text-foreground"
                  >
                    {t.common.close}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setAttachingTo(procedure.id)}
                  className="flex items-center gap-1.5 self-start text-xs font-medium text-primary hover:underline"
                >
                  <Paperclip aria-hidden="true" className="h-3.5 w-3.5" />
                  {t.procedures.attachFiles}
                </button>
              ))}
          </li>
        );
      })}
    </ul>
  );
}
