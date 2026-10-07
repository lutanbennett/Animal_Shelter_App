"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Paperclip, X } from "lucide-react";
import { driveImageUrl } from "@/lib/google/drive-client";
import { deleteBloodTestAttachment } from "@/app/residents/[id]/blood-tests/actions";
import { ActionButton } from "@/components/ActionButton";
import { AttachmentUploader } from "@/components/AttachmentUploader";
import { useConfirm } from "@/components/ConfirmProvider";
import { RowActionButton } from "@/components/RowAction";
import { FileTypeIcon } from "@/components/FileTypeIcon";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { fileKind } from "@/lib/uploads/file-kind";
import { formatDate } from "@/lib/format";

export type BloodTestAttachmentRow = {
  id: string;
  drive_file_id: string;
  file_name: string | null;
};

export type BloodTestRow = {
  id: string;
  date: string;
  results: string | null;
  blood_test_types: { name: string } | null;
  vet_appointments: { appointment_date: string; reason: string | null } | null;
  attachments: BloodTestAttachmentRow[];
};

/**
 * The Blood Tests tab list. The scan is normally picked on the form, but a
 * lab report that arrives after the test was logged is attached here: each
 * row can open an uploader in place, as the Procedures tab does.
 */
export function BloodTestList({
  residentId,
  bloodTests,
  readOnly = false,
}: {
  residentId: string;
  bloodTests: BloodTestRow[];
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
      const result = await deleteBloodTestAttachment(residentId, attachmentId);
      if (result.ok) router.refresh();
    });
  }

  if (bloodTests.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted">
        {t.residents.sections.empty.bloodTests}
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {bloodTests.map((test) => {
        const attaching = attachingTo === test.id;
        return (
          <li
            key={test.id}
            className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col">
                <span className="font-medium text-foreground">
                  {test.blood_test_types?.name ?? t.bloodTests.unknownType}
                </span>
                <span className="text-xs text-muted">{formatDate(test.date, locale)}</span>
                {test.vet_appointments && (
                  <span className="text-xs text-muted">
                    {t.bloodTests.linkedVisitLabel(
                      formatDate(test.vet_appointments.appointment_date, locale),
                      test.vet_appointments.reason ?? t.residents.sections.vetVisitFallback,
                    )}
                  </span>
                )}
              </div>
            </div>

            {test.results && (
              <p className="whitespace-pre-wrap text-sm text-foreground">
                {test.results}
              </p>
            )}

            {test.attachments.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {test.attachments.map((attachment) => {
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
                            alt={attachment.file_name ?? t.bloodTests.fileFallback}
                            className="h-24 w-24 object-cover"
                          />
                        ) : (
                          <span className="flex h-24 w-24 flex-col items-center justify-center gap-1 p-2 text-center text-xs text-muted">
                            <FileTypeIcon kind={kind} />
                            <span className="max-w-full truncate">
                              {attachment.file_name ?? t.bloodTests.fileFallback}
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
                            subject={attachment.file_name ?? t.bloodTests.fileFallback}
                            disabled={isPending}
                            onClick={() =>
                              void removeAttachment(attachment.id, attachment.file_name ?? t.bloodTests.fileFallback)
                            }
                          />
                        </div>
                      )}
                    </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-muted">{t.bloodTests.noFiles}</p>
          )}

          {!readOnly &&
            (attaching ? (
              <div className="flex flex-col gap-2">
                <AttachmentUploader
                  uploadUrl={`/api/blood-tests/${test.id}/attachments`}
                  dropHere={t.bloodTests.uploader.dropHere}
                  hint={t.bloodTests.uploader.hint}
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
                <ActionButton icon={Paperclip} compact onClick={() => setAttachingTo(test.id)}>
                  {t.bloodTests.attachFiles}
                </ActionButton>
              </div>
            ))}
          </li>
        );
      })}
    </ul>
  );
}
