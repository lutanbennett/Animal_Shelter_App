"use client";

import { useState, useTransition, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createMaintenanceJob, updateMaintenanceJob } from "./actions";
import {
  FileDropZone,
  PendingFileList,
  UploadProgressPanel,
  useDeferredUploads,
  type PendingFile,
} from "@/components/DeferredUploads";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { placeName } from "@/lib/enclosures/names";
import type { EnclosureOption, ZoneOption } from "@/lib/enclosures/options";
import { appUserLabel, type AppUser } from "@/lib/auth/app-users";
import { roleLabel } from "@/lib/i18n/enum-labels";
import type { MaintenanceJob } from "@/lib/maintenance/queries";
import {
  MAINTENANCE_STATUSES,
  maintenanceStatusLabel,
} from "@/lib/maintenance/status";

const inputClass =
  "rounded border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40 disabled:opacity-50";

/**
 * One form for logging (or editing) a maintenance job. Photos are picked
 * here alongside the details and go up on Save (useDeferredUploads): the
 * action returns the new job's id, the queued files are posted to its
 * attachment route one at a time with progress, and the page moves on to
 * the job when they are all up. A failed file can be retried in place or
 * skipped — the job itself is already saved by then.
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
  assignees,
}: {
  mode: "create" | "edit";
  /** Logins that action jobs, for "Assigned to" (0055). */
  assignees: AppUser[];
  zones: ZoneOption[];
  enclosures: EnclosureOption[];
  initial?: MaintenanceJob | null;
  preselectedEnclosureId?: string | null;
  preselectedZoneId?: string | null;
  cancelHref: string;
}) {
  const { t, locale } = useI18n();
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
  const uploads = useDeferredUploads();

  async function uploadPending(jobId: string, items?: PendingFile[]) {
    const { failed } = await uploads.upload(
      `/api/maintenance/${jobId}/attachments?phase=before`,
      items,
    );
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
      if (uploads.queued.length === 0) {
        router.push(`/maintenance/${result.jobId}`);
        return;
      }
      await uploadPending(result.jobId);
    });
  }

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

  if (saved && uploads.files.length > 0) {
    // Details are in; photos are on their way (or some didn't make it).
    return (
      <UploadProgressPanel
        saved={fm.saved}
        uploads={uploads}
        onRetry={(item) => void uploadPending(saved.jobId, [item])}
        continueHref={`/maintenance/${saved.jobId}`}
        continueLabel={fm.continueToJob}
        labels={{ uploading: fm.uploading, uploadsFailed: fm.uploadsFailed }}
      />
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
                  {placeName(locale, zone.name, zone.name_th)}
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
                  {placeName(locale, enclosure.name, enclosure.name_th)}
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

      <div className="flex flex-col gap-1">
        <label htmlFor="assignedUserId" className="text-sm font-medium text-muted">
          {f.assignedTo}
        </label>
        <select
          id="assignedUserId"
          name="assignedUserId"
          defaultValue={initial?.assigned_user_id ?? ""}
          className={inputClass}
        >
          <option value="">{fm.unassigned}</option>
          {assignees.map((user) => (
            <option key={user.id} value={user.id}>
              {appUserLabel(user)} — {roleLabel(t, user.role)}
            </option>
          ))}
        </select>
        <p className="text-xs text-muted">{fm.assignedHint}</p>
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
          <FileDropZone label={fm.dropHere} hint={fm.dropHint} onFiles={uploads.addFiles} />
          <PendingFileList files={uploads.files} onRemove={uploads.removeFile} onRetry={null} />
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
