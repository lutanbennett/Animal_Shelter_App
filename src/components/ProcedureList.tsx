"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Paperclip, X } from "lucide-react";
import { driveImageUrl } from "@/lib/google/drive-client";
import { deleteProcedureAttachment } from "@/app/residents/[id]/procedures/actions";
import { ActionButton } from "@/components/ActionButton";
import { AttachmentUploader } from "@/components/AttachmentUploader";
import { useConfirm } from "@/components/ConfirmProvider";
import { RowActionButton } from "@/components/RowAction";
import { FileTypeIcon } from "@/components/FileTypeIcon";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { fileKind } from "@/lib/uploads/file-kind";
import { formatDate } from "@/lib/format";

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
  clinic_visits: { appointment_date: string; reason: string | null } | null;
  attachments: ProcedureAttachmentRow[];
};

/**
 * The Procedures tab list. Files are normally picked on the form, but a
 * procedure's often arrive after the record does (the clinic sends the
 * X-ray later), so each row can open an uploader in place.
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
  const confirm = useConfirm();
  const [attachingTo, setAttachingTo] = useState<string | null>(null);

  async function removeAttachment(attachmentId: string, fileName: string) {
    if (!await confirm({ body: t.common.removeFileConfirm(fileName), confirmLabel: t.common.remove })) return;
    startTransition(async () => {
      const result = await deleteProcedureAttachment(residentId, attachmentId);
      if (result.ok) router.refresh();
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
                  {procedure.clinic_visits
                    ? t.procedures.linkedVisitLabel(
                        formatDate(procedure.clinic_visits.appointment_date, locale),
                        procedure.clinic_visits.reason ??
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
                  const kind = fileKind(attachment.file_name);
                  return (
                    <div
                      key={attachment.id}
                      className="group relative overflow-hidden rounded border border-border bg-surface-hover"
                    >
                      <a href={url} target="_blank" rel="noreferrer">
                        {kind === "image" ? (
                          <img
                            src={url}
                            alt={attachment.file_name ?? t.procedures.fileFallback}
                            className="h-24 w-24 object-cover"
                          />
                        ) : (
                          <span className="flex h-24 w-24 flex-col items-center justify-center gap-1 p-2 text-center text-xs text-muted">
                            <FileTypeIcon kind={kind} />
                            <span className="max-w-full truncate">
                              {attachment.file_name ?? t.procedures.fileFallback}
                            </span>
                          </span>
                        )}
                      </a>
                      {!readOnly && (
                        // Always shown on a phone (there is no hover); on hover with a mouse.
                        <div className="absolute right-0.5 top-0.5 md:hidden md:group-hover:block">
                          <RowActionButton
                            icon={X}
                            tone="overlay"
                            label={t.common.remove}
                            subject={attachment.file_name ?? t.procedures.fileFallback}
                            disabled={isPending}
                            onClick={() =>
                              void removeAttachment(attachment.id, attachment.file_name ?? t.procedures.fileFallback)
                            }
                          />
                        </div>
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
                  <div className="self-start">
                    <ActionButton icon={X} compact onClick={() => setAttachingTo(null)}>
                      {t.common.close}
                    </ActionButton>
                  </div>
                </div>
              ) : (
                <div className="self-start">
                  <ActionButton icon={Paperclip} compact onClick={() => setAttachingTo(procedure.id)}>
                    {t.procedures.attachFiles}
                  </ActionButton>
                </div>
              ))}
          </li>
        );
      })}
    </ul>
  );
}
