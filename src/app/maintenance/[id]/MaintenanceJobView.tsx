"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarClock, Pencil } from "lucide-react";
import { ENCLOSURE_ICONS } from "@/components/hub-icons";
import { AttachmentUploader } from "@/components/AttachmentUploader";
import { driveImageUrl } from "@/lib/google/drive-client";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { formatBaht, formatDate } from "@/lib/format";
import type {
  MaintenanceAttachment,
  MaintenanceJob,
  MaintenancePhase,
} from "@/lib/maintenance/queries";
import {
  DUE_TONE,
  MAINTENANCE_STATUSES,
  STATUS_TONE,
  dueState,
  maintenanceStatusLabel,
  type MaintenanceStatus,
} from "@/lib/maintenance/status";
import { deleteMaintenanceAttachment, setMaintenanceStatus } from "../actions";

const IMAGE_EXTENSIONS = /\.(jpe?g|png|webp|heic|heif|gif)$/i;

function isLikelyImage(fileName: string | null) {
  return !!fileName && IMAGE_EXTENSIONS.test(fileName);
}

export function MaintenanceJobView({
  job,
  canWrite,
}: {
  job: MaintenanceJob;
  /** Staff/admin: change status and details, remove files. */
  canWrite: boolean;
}) {
  const { t, locale } = useI18n();
  const d = t.maintenance.detail;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [driveWarning, setDriveWarning] = useState<string | null>(null);
  // Which status the row is heading to while the action runs, so the
  // button lights up straight away rather than after the Drive move.
  const [optimisticStatus, setOptimisticStatus] = useState<MaintenanceStatus | null>(null);
  const status = optimisticStatus ?? job.status;

  function changeStatus(next: MaintenanceStatus) {
    if (next === status) return;
    setError(null);
    setDriveWarning(null);
    setOptimisticStatus(next);
    startTransition(async () => {
      const result = await setMaintenanceStatus(job.id, next);
      setOptimisticStatus(null);
      if (result.error) setError(result.error);
      if (result.driveWarning) setDriveWarning(result.driveWarning);
      router.refresh();
    });
  }

  function removeAttachment(attachmentId: string) {
    setError(null);
    startTransition(async () => {
      const result = await deleteMaintenanceAttachment(job.id, attachmentId);
      if (result.error) setError(result.error);
      router.refresh();
    });
  }

  const due = dueState(job.due_date, status);
  const tone = STATUS_TONE[status];
  const before = job.attachments.filter((a) => a.phase !== "after");
  const after = job.attachments.filter((a) => a.phase === "after");

  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      <Link href="/maintenance" className="text-sm text-muted hover:text-foreground">
        {t.maintenance.backToBoard}
      </Link>

      <header
        className={`flex flex-col gap-3 rounded-lg border border-l-4 border-border bg-surface p-5 ${DUE_TONE[due].card}`}
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs text-muted">{job.job_code}</span>
          <span
            className={`rounded-full border px-2 py-0.5 text-xs font-medium ${tone.badge}`}
          >
            {maintenanceStatusLabel(t, status)}
          </span>
          {due !== "none" && (
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${DUE_TONE[due].badge}`}
            >
              {due === "overdue" ? d.overdue : d.dueSoon}
            </span>
          )}
        </div>
        <h1 className="text-2xl font-semibold text-foreground">{job.title}</h1>
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
          <span className="flex items-center gap-1">
            <ENCLOSURE_ICONS.zone aria-hidden="true" className="h-4 w-4" />
            {job.zone_name}
          </span>
          {job.enclosure_id ? (
            <Link
              href={`/enclosures/${job.enclosure_id}`}
              className="flex items-center gap-1 hover:text-foreground hover:underline"
            >
              <ENCLOSURE_ICONS.enclosure aria-hidden="true" className="h-4 w-4" />
              {job.enclosure_name}
            </Link>
          ) : (
            <span className="flex items-center gap-1">
              <ENCLOSURE_ICONS.enclosure aria-hidden="true" className="h-4 w-4" />
              {t.maintenance.zoneWide}
            </span>
          )}
          <span className="flex items-center gap-1">
            <CalendarClock aria-hidden="true" className="h-4 w-4" />
            {job.due_date ? d.due(formatDate(job.due_date, locale)) : d.noDueDate}
          </span>
        </p>
        <p className="text-xs text-muted">
          {d.logged(formatDate(job.date_created, locale))}
          {job.date_completed && ` · ${d.completed(formatDate(job.date_completed, locale))}`}
        </p>
      </header>

      {canWrite ? (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-medium text-muted">{d.status}</h2>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            {MAINTENANCE_STATUSES.map((option) => {
              const active = option === status;
              const optionTone = STATUS_TONE[option];
              return (
                <button
                  key={option}
                  type="button"
                  disabled={isPending}
                  aria-pressed={active}
                  onClick={() => changeStatus(option)}
                  className={`flex items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition disabled:opacity-60 sm:py-2 ${
                    active
                      ? `${optionTone.badge} ring-2 ring-primary/40`
                      : "border-border bg-surface text-foreground hover:bg-surface-hover"
                  }`}
                >
                  <span className={`h-2.5 w-2.5 rounded-full ${optionTone.dot}`} />
                  {maintenanceStatusLabel(t, option)}
                </button>
              );
            })}
          </div>
          {driveWarning && (
            <p className="text-xs text-primary">{d.driveWarning(driveWarning)}</p>
          )}
        </section>
      ) : (
        <p className="text-sm text-muted">{d.readOnly}</p>
      )}

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-6">
          <PhotoSection
            job={job}
            phase="before"
            heading={d.before}
            hint={d.beforeHint}
            empty={d.noBefore}
            addLabel={d.addBefore}
            dropHere={d.dropBefore}
            attachments={before}
            canRemove={canWrite}
            disabled={isPending}
            onRemove={removeAttachment}
          />
          <PhotoSection
            job={job}
            phase="after"
            heading={d.after}
            hint={d.afterHint}
            empty={d.noAfter}
            addLabel={d.addAfter}
            dropHere={d.dropAfter}
            attachments={after}
            canRemove={canWrite}
            disabled={isPending}
            onRemove={removeAttachment}
          />
        </div>

        <aside className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-medium text-muted">
                {t.maintenance.fields.description}
              </h3>
              {canWrite && (
                <Link
                  href={`/maintenance/${job.id}/edit`}
                  className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  <Pencil aria-hidden="true" className="h-3.5 w-3.5" />
                  {d.editDetails}
                </Link>
              )}
            </div>
            {job.description ? (
              <p className="whitespace-pre-line text-sm text-foreground">{job.description}</p>
            ) : (
              <p className="text-sm text-muted">{d.noDescription}</p>
            )}
          </div>

          <dl className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-surface p-4 text-sm">
            <div className="flex flex-col">
              <dt className="text-xs text-muted">{d.estimated}</dt>
              <dd className="font-medium text-foreground">
                {job.estimated_cost != null ? formatBaht(job.estimated_cost, locale) : d.notSet}
              </dd>
            </div>
            <div className="flex flex-col">
              <dt className="text-xs text-muted">{d.actual}</dt>
              <dd className="font-medium text-foreground">
                {job.actual_cost != null ? formatBaht(job.actual_cost, locale) : d.notSet}
              </dd>
            </div>
          </dl>
        </aside>
      </div>
    </main>
  );
}

function PhotoSection({
  job,
  phase,
  heading,
  hint,
  empty,
  addLabel,
  dropHere,
  attachments,
  canRemove,
  disabled,
  onRemove,
}: {
  job: MaintenanceJob;
  phase: MaintenancePhase;
  heading: string;
  hint: string;
  empty: string;
  addLabel: string;
  dropHere: string;
  attachments: MaintenanceAttachment[];
  canRemove: boolean;
  disabled: boolean;
  onRemove: (attachmentId: string) => void;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-col">
          <h2 className="text-lg font-semibold text-foreground">
            {heading} <span className="text-sm text-muted">({attachments.length})</span>
          </h2>
          <span className="text-xs text-muted">{hint}</span>
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="shrink-0 rounded border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-surface-hover"
        >
          {open ? t.common.close : addLabel}
        </button>
      </div>

      {open && (
        <AttachmentUploader
          uploadUrl={`/api/maintenance/${job.id}/attachments?phase=${phase}`}
          dropHere={dropHere}
          hint={t.maintenance.form.dropHint}
          onUploaded={() => router.refresh()}
        />
      )}

      {attachments.length > 0 ? (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
          {attachments.map((attachment) => {
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
                      alt={attachment.file_name ?? t.maintenance.detail.fileFallback}
                      className="aspect-square w-full object-cover"
                    />
                  ) : (
                    <span className="flex aspect-square w-full flex-col items-center justify-center gap-1 p-2 text-center text-xs text-muted">
                      <span aria-hidden>📄</span>
                      <span className="line-clamp-2 break-all">
                        {attachment.file_name ?? t.maintenance.detail.fileFallback}
                      </span>
                    </span>
                  )}
                </a>
                {canRemove && (
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => onRemove(attachment.id)}
                    aria-label={t.common.remove}
                    className="absolute right-1 top-1 rounded-full bg-black/60 px-1.5 text-xs text-white hover:bg-danger disabled:opacity-60 md:hidden md:group-hover:block"
                  >
                    &times;
                  </button>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="rounded border border-dashed border-border px-4 py-5 text-center text-sm text-muted">
          {empty}
        </p>
      )}
    </section>
  );
}
