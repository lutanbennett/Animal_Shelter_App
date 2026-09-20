"use client";

import { useActionState } from "react";
import { FileText, FolderOpen, Globe, HeartCrack } from "lucide-react";
import { retryDeceasedArchive } from "./actions";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { formatDate } from "@/lib/format";
import { driveFileUrl, driveFolderUrl } from "@/lib/google/drive-client";

export type DeceasedArchive = {
  archivedAt: string | null;
  summaryDriveFileId: string | null;
  indexDriveFileId: string | null;
  driveFolderId: string | null;
};

const linkClass =
  "inline-flex items-center gap-2 rounded border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface-hover";

/**
 * Shown at the top of the hub for a resident who has died: when and why,
 * that the record is now read-only, and where the archive lives. When the
 * Drive half of the workflow didn't finish (Drive was down when the death
 * was recorded), it also carries the retry — the database side is never
 * blocked on Drive, so this is how the two are reconciled.
 */
export function DeceasedBanner({
  residentId,
  dateOfDeath,
  causeOfDeath,
  archive,
  canRetryArchive,
}: {
  residentId: string;
  dateOfDeath: string | null;
  causeOfDeath: string | null;
  archive: DeceasedArchive;
  canRetryArchive: boolean;
}) {
  const { t, locale } = useI18n();
  const d = t.residents.deceased;
  const [state, formAction, pending] = useActionState(
    retryDeceasedArchive.bind(null, residentId),
    undefined,
  );

  const archived = Boolean(archive.archivedAt);

  return (
    <section className="flex flex-col gap-3 rounded-lg border border-border bg-surface-hover p-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 rounded-full bg-surface p-2 text-muted">
          <HeartCrack aria-hidden="true" className="h-5 w-5" />
        </span>
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-semibold text-foreground">
            {dateOfDeath
              ? d.banner.title(formatDate(dateOfDeath, locale))
              : d.banner.titleNoDate}
          </h2>
          {causeOfDeath && (
            <p className="text-sm text-muted">{d.banner.cause(causeOfDeath)}</p>
          )}
          <p className="text-sm text-muted">{d.banner.readOnly}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {archive.summaryDriveFileId && (
          <a
            className={linkClass}
            href={driveFileUrl(archive.summaryDriveFileId)}
            target="_blank"
            rel="noreferrer noopener"
          >
            <FileText aria-hidden="true" className="h-4 w-4" />
            {d.banner.summaryPdf}
          </a>
        )}
        {archive.indexDriveFileId && (
          <a
            className={linkClass}
            href={driveFileUrl(archive.indexDriveFileId)}
            target="_blank"
            rel="noreferrer noopener"
          >
            <Globe aria-hidden="true" className="h-4 w-4" />
            {d.banner.offlineIndex}
          </a>
        )}
        {archive.driveFolderId && (
          <a
            className={linkClass}
            href={driveFolderUrl(archive.driveFolderId)}
            target="_blank"
            rel="noreferrer noopener"
          >
            <FolderOpen aria-hidden="true" className="h-4 w-4" />
            {d.banner.driveFolder}
          </a>
        )}
      </div>

      {archived ? (
        <p className="text-xs text-muted">
          {d.banner.archivedAt(formatDate(archive.archivedAt, locale))}
        </p>
      ) : (
        <form action={formAction} className="flex flex-wrap items-center gap-3">
          <p className="text-xs text-danger">{d.banner.archiveIncomplete}</p>
          {canRetryArchive && (
            <button
              type="submit"
              disabled={pending}
              className="rounded border border-primary/40 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 disabled:opacity-50"
            >
              {pending ? d.banner.archiving : d.banner.retryArchive}
            </button>
          )}
          {state && "error" in state && (
            <span className="text-xs text-danger">{state.error}</span>
          )}
        </form>
      )}
    </section>
  );
}
