"use client";

import { useRef, useState, useTransition, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Camera, X } from "lucide-react";
import { createMaintenanceJob, updateMaintenanceJob } from "./actions";
import { uploadAttachmentFile } from "@/components/AttachmentUploader";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { EnclosureOption, ZoneOption } from "@/lib/enclosures/options";
import type { MaintenanceJob } from "@/lib/maintenance/queries";
import {
  MAINTENANCE_STATUSES,
  maintenanceStatusLabel,
} from "@/lib/maintenance/status";

const inputClass =
  "rounded border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40 disabled:opacity-50";

type PendingFile = {
  key: string;
  file: File;
  /** Object URL for an image thumbnail; null for PDFs. */
  previewUrl: string | null;
  progress: number;
  status: "queued" | "uploading" | "done" | "error";
  error?: string;
};

/**
 * One form for logging (or editing) a maintenance job. Unlike the medical
 * forms, which save first and only then offer an uploader, photos are
 * picked here alongside the details and go up on Save: the action returns
 * the new job's id, the queued files are posted to its attachment route
 * one at a time with progress, and the page moves on to the job when they
 * are all up. A failed file can be retried in place or skipped — the job
 * itself is already saved by then.
 *
 * Edit mode reuses the fields without the photo picker; before/after
 * photos on an existing job are managed from the job page.
 */
export function MaintenanceForm({
  mode,
  zones,
  enclosures,
  initial = null,
  preselectedEnclosureId = null,
  preselectedZoneId = null,
  cancelHref,
}: {
  mode: "create" | "edit";
  zones: ZoneOption[];
  enclosures: EnclosureOption[];
  initial?: MaintenanceJob | null;
  preselectedEnclosureId?: string | null;
  preselectedZoneId?: string | null;
  cancelHref: string;
}) {
  const { t } = useI18n();
  const f = t.maintenance.fields;
  const fm = t.maintenance.form;
  const router = useRouter();

  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<{ jobId: string; driveWarning: string | null } | null>(
    null,
  );

  // Location: an enclosure (which implies its zone) or, for a zone-wide
  // job, a zone alone. The dependent dropdowns mirror EnclosurePicker
  // without its occupancy readout, which doesn't matter here.
  const initialEnclosureId = initial?.enclosure_id ?? preselectedEnclosureId ?? "";
  const [zoneWide, setZoneWide] = useState(
    mode === "edit" ? !initial?.enclosure_id : !!preselectedZoneId && !preselectedEnclosureId,
  );
  const [zoneId, setZoneId] = useState(
    () =>
      enclosures.find((e) => e.id === initialEnclosureId)?.zoneId ??
      initial?.zone_id ??
      preselectedZoneId ??
      "",
  );
  const [enclosureId, setEnclosureId] = useState(initialEnclosureId);
  const enclosuresInZone = enclosures.filter((e) => e.zoneId === zoneId);

  // Photos picked before the job exists (create mode only).
  const [files, setFiles] = useState<PendingFile[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  function addFiles(list: FileList | null) {
    if (!list) return;
    const accepted = Array.from(list).filter(
      (file) => file.type.startsWith("image/") || file.type === "application/pdf",
    );
    setFiles((prev) => [
      ...prev,
      ...accepted.map((file) => ({
        key: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
        file,
        previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
        progress: 0,
        status: "queued" as const,
      })),
    ]);
  }

  function removeFile(key: string) {
    setFiles((prev) => {
      const target = prev.find((item) => item.key === key);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((item) => item.key !== key);
    });
  }

  function patchFile(key: string, patch: Partial<PendingFile>) {
    setFiles((prev) =>
      prev.map((item) => (item.key === key ? { ...item, ...patch } : item)),
    );
  }

  async function uploadPending(jobId: string, items: PendingFile[]) {
    let failed = false;
    for (const item of items) {
      patchFile(item.key, { status: "uploading", progress: 0, error: undefined });
      const result = await uploadAttachmentFile(
        t,
        `/api/maintenance/${jobId}/attachments?phase=before`,
        item.file,
        (progress) => patchFile(item.key, { progress }),
      );
      if (result.error) {
        failed = true;
        patchFile(item.key, { status: "error", error: result.error });
      } else {
        patchFile(item.key, { status: "done", progress: 100 });
      }
    }
    if (!failed) router.push(`/maintenance/${jobId}`);
  }

  // Save the details, then push the queued files up, then move on. Driven
  // from the submit handler rather than a form action so the upload round
  // follows the save in one place (the photos need JavaScript anyway).
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setError(null);
    startTransition(async () => {
      const result =
        mode === "create"
          ? await createMaintenanceJob(undefined, formData)
          : await updateMaintenanceJob(undefined, formData);
      if (!result || "error" in result) {
        setError(result?.error ?? t.maintenance.errors.saveFailed);
        return;
      }
      setSaved({ jobId: result.jobId, driveWarning: result.driveWarning });
      if (mode === "edit" && result.driveWarning) return; // shown below, with a link on
      const queued = files.filter((item) => item.status === "queued");
      if (queued.length === 0) {
        router.push(`/maintenance/${result.jobId}`);
        return;
      }
      await uploadPending(result.jobId, queued);
    });
  }
  const uploading = files.some((item) => item.status === "uploading");
  const failures = files.filter((item) => item.status === "error");
  const uploadedCount = files.filter((item) => item.status === "done").length;

  if (saved && mode === "edit" && saved.driveWarning) {
    return (
      <div className="flex max-w-2xl flex-col gap-4">
        <p className="rounded-lg border border-primary/40 bg-primary/10 p-4 text-sm text-foreground">
          {t.maintenance.detail.driveWarning(saved.driveWarning)}
        </p>
        <div>
          <Link
            href={`/maintenance/${saved.jobId}`}
            className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
          >
            {t.maintenance.backToJob}
          </Link>
        </div>
      </div>
    );
  }

  if (saved && files.length > 0) {
    // Details are in; photos are on their way (or some didn't make it).
    return (
      <div className="flex max-w-2xl flex-col gap-4">
        <p className="rounded-lg border border-success/40 bg-success/10 p-4 text-sm font-medium text-success">
          {fm.saved}{" "}
          {uploading || failures.length === 0
            ? fm.uploading(uploadedCount, files.length)
            : null}
        </p>
        {!uploading && failures.length > 0 && (
          <p className="text-sm text-danger">{fm.uploadsFailed}</p>
        )}
        <PendingFileList
          files={files}
          onRemove={null}
          onRetry={
            !uploading
              ? (item) => void uploadPending(saved.jobId, [item])
              : null
          }
        />
        {!uploading && failures.length > 0 && (
          <div>
            <Link
              href={`/maintenance/${saved.jobId}`}
              className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
            >
              {fm.continueToJob}
            </Link>
          </div>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-2xl flex-col gap-6">
      {mode === "edit" && initial && (
        <input type="hidden" name="jobId" value={initial.id} />
      )}

      <div className="flex flex-col gap-1">
        <label htmlFor="title" className="text-sm font-medium text-muted">
          {f.title} <span className="text-danger">*</span>
        </label>
        <input
          id="title"
          name="title"
          required
          autoFocus={mode === "create"}
          defaultValue={initial?.title ?? ""}
          placeholder={fm.titlePlaceholder}
          className={inputClass}
        />
      </div>

      <fieldset className="flex flex-col gap-3">
        <legend className="text-sm font-medium text-muted">
          {f.location} <span className="text-danger">*</span>
        </legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label htmlFor="zoneId" className="text-xs text-muted">
              {t.common.zone}
            </label>
            <select
              id="zoneId"
              name="zoneId"
              required
              value={zoneId}
              onChange={(e) => {
                setZoneId(e.target.value);
                setEnclosureId("");
              }}
              className={inputClass}
            >
              <option value="">{fm.selectZone}</option>
              {zones.map((zone) => (
                <option key={zone.id} value={zone.id}>
                  {zone.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="enclosureId" className="text-xs text-muted">
              {t.common.enclosure}
            </label>
            <select
              id="enclosureId"
              name="enclosureId"
              required={!zoneWide}
              disabled={zoneWide || !zoneId}
              value={zoneWide ? "" : enclosureId}
              onChange={(e) => setEnclosureId(e.target.value)}
              className={inputClass}
            >
              <option value="">
                {zoneWide ? t.maintenance.zoneWide : zoneId ? fm.selectEnclosure : fm.selectZoneFirst}
              </option>
              {enclosuresInZone.map((enclosure) => (
                <option key={enclosure.id} value={enclosure.id}>
                  {enclosure.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <label className="flex items-start gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={zoneWide}
            onChange={(e) => {
              setZoneWide(e.target.checked);
              if (e.target.checked) setEnclosureId("");
            }}
            className="mt-1"
          />
          <span className="flex flex-col">
            <span>{fm.zoneWideToggle}</span>
            <span className="text-xs text-muted">{fm.zoneWideHint}</span>
          </span>
        </label>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label htmlFor="status" className="text-sm font-medium text-muted">
            {f.status}
          </label>
          <select
            id="status"
            name="status"
            defaultValue={initial?.status ?? "Not Started"}
            className={inputClass}
          >
            {MAINTENANCE_STATUSES.map((status) => (
              <option key={status} value={status}>
                {maintenanceStatusLabel(t, status)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="dueDate" className="text-sm font-medium text-muted">
            {f.dueDate}
          </label>
          <input
            id="dueDate"
            name="dueDate"
            type="date"
            defaultValue={initial?.due_date ?? ""}
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label htmlFor="estimatedCost" className="text-sm font-medium text-muted">
            {f.estimatedCost}
          </label>
          <input
            id="estimatedCost"
            name="estimatedCost"
            type="number"
            inputMode="decimal"
            min={0}
            step="1"
            defaultValue={initial?.estimated_cost ?? ""}
            placeholder="฿"
            className={inputClass}
          />
          <p className="text-xs text-muted">{fm.costHint}</p>
        </div>
        {mode === "edit" && (
          <div className="flex flex-col gap-1">
            <label htmlFor="actualCost" className="text-sm font-medium text-muted">
              {f.actualCost}
            </label>
            <input
              id="actualCost"
              name="actualCost"
              type="number"
              inputMode="decimal"
              min={0}
              step="1"
              defaultValue={initial?.actual_cost ?? ""}
              placeholder="฿"
              className={inputClass}
            />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="description" className="text-sm font-medium text-muted">
          {f.description}
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={initial?.description ?? ""}
          placeholder={fm.descriptionPlaceholder}
          className={inputClass}
        />
      </div>

      {mode === "create" && (
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-muted">{f.photos}</span>
          <p className="text-xs text-muted">{fm.photosHint}</p>
          <div
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragActive(false);
              addFiles(e.dataTransfer.files);
            }}
            className={`flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed p-6 text-center transition ${
              dragActive
                ? "border-primary bg-primary/10"
                : "border-border bg-surface hover:bg-surface-hover"
            }`}
          >
            <Camera aria-hidden="true" className="h-6 w-6 text-muted" />
            <span className="text-sm font-medium text-foreground">{fm.dropHere}</span>
            <span className="text-xs text-muted">{fm.dropHint}</span>
            <input
              ref={inputRef}
              type="file"
              accept="image/*,application/pdf"
              multiple
              hidden
              onChange={(e) => {
                addFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </div>
          <PendingFileList files={files} onRemove={removeFile} onRetry={null} />
        </div>
      )}

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
        >
          {pending ? fm.saving : mode === "create" ? fm.saveButton : t.common.saveChanges}
        </button>
        <Link href={cancelHref} className="text-sm text-muted hover:text-foreground">
          {t.common.cancel}
        </Link>
      </div>
    </form>
  );
}

function PendingFileList({
  files,
  onRemove,
  onRetry,
}: {
  files: PendingFile[];
  onRemove: ((key: string) => void) | null;
  onRetry: ((item: PendingFile) => void) | null;
}) {
  const { t } = useI18n();
  if (files.length === 0) return null;

  return (
    <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {files.map((item) => (
        <li
          key={item.key}
          className="relative flex flex-col overflow-hidden rounded border border-border bg-surface-hover"
        >
          {item.previewUrl ? (
            <img
              src={item.previewUrl}
              alt={item.file.name}
              className="aspect-square w-full object-cover"
            />
          ) : (
            <span className="flex aspect-square w-full flex-col items-center justify-center gap-1 p-2 text-center text-xs text-muted">
              <span aria-hidden>📄</span>
              <span className="line-clamp-2 break-all">{item.file.name}</span>
            </span>
          )}
          {item.status === "uploading" && (
            <div className="absolute inset-x-0 bottom-0 h-1.5 bg-black/40">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${item.progress}%` }}
              />
            </div>
          )}
          {item.status === "done" && (
            <span className="absolute bottom-1 left-1 rounded bg-success px-1.5 text-xs font-medium text-success-foreground">
              {t.photos.uploader.done}
            </span>
          )}
          {item.status === "error" && (
            <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1 bg-black/70 p-1.5">
              <span className="line-clamp-2 text-xs text-danger">{item.error}</span>
              {onRetry && (
                <button
                  type="button"
                  onClick={() => onRetry(item)}
                  className="rounded bg-surface px-2 py-1 text-xs font-medium text-foreground hover:bg-surface-hover"
                >
                  {t.common.retry}
                </button>
              )}
            </div>
          )}
          {onRemove && item.status === "queued" && (
            <button
              type="button"
              onClick={() => onRemove(item.key)}
              aria-label={t.maintenance.form.removeFile}
              className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white hover:bg-danger"
            >
              <X aria-hidden="true" className="h-3.5 w-3.5" />
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
