"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { driveImageUrl } from "@/lib/google/drive-client";
import { deleteBloodTestAttachment } from "@/app/residents/[id]/blood-tests/actions";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { formatDate } from "@/lib/format";

const IMAGE_EXTENSIONS = /\.(jpe?g|png|webp|heic|heif|gif)$/i;

function isLikelyImage(fileName: string | null) {
  return !!fileName && IMAGE_EXTENSIONS.test(fileName);
}

export type BloodTestAttachmentRow = {
  id: string;
  drive_file_id: string;
  file_name: string | null;
};

export type BloodTestRow = {
  id: string;
  date: string;
  results: string | null;
  vet_appointments: { appointment_date: string; reason: string | null } | null;
  attachments: BloodTestAttachmentRow[];
};

export function BloodTestList({
  residentId,
  bloodTests,
  readOnly = false,
}: {
  residentId: string;
  bloodTests: BloodTestRow[];
  /** A closed record (deceased resident): files can be opened, not removed. */
  readOnly?: boolean;
}) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function removeAttachment(attachmentId: string) {
    startTransition(async () => {
      const result = await deleteBloodTestAttachment(residentId, attachmentId);
      if (!result?.error) router.refresh();
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
      {bloodTests.map((test) => (
        <li
          key={test.id}
          className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col">
              <span className="font-medium text-foreground">
                {formatDate(test.date, locale)}
              </span>
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
                          alt={attachment.file_name ?? t.bloodTests.fileFallback}
                          className="h-24 w-24 object-cover"
                        />
                      ) : (
                        <span className="flex h-24 w-24 flex-col items-center justify-center gap-1 p-2 text-center text-xs text-muted">
                          <span aria-hidden>📄</span>
                          <span className="truncate">
                            {attachment.file_name ?? t.bloodTests.fileFallback}
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
            <p className="text-xs text-muted">{t.bloodTests.noFiles}</p>
          )}
        </li>
      ))}
    </ul>
  );
}
