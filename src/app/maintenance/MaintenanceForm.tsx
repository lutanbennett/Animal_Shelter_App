"use client";

import { useRef, useState, useTransition, type FormEvent, type KeyboardEvent } from "react";
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
import { OptionalDateInput } from "@/components/OptionalDateInput";
import {
  ReviewSummary,
  WizardNav,
  WizardProgress,
  type ReviewGroup,
} from "@/app/residents/new/WizardChrome";
import { formatBaht, formatDate } from "@/lib/format";

/** Steps of logging a job: what, where, who and when, then Review. */
const STEP_IDS = ["what", "where", "who", "review"] as const;
const REVIEW_STEP = STEP_IDS.length - 1;

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
  /** Logins that action jobs, for "Assigned to" (0055, a team since 0063). */
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

  // The team (0063). Someone on the job who has since been archived isn't
  // in the picker any more, but stays ticked here so they can be taken
  // off — otherwise the job would silently keep them.
  const initialTeam = initial?.assignees ?? [];
  const [teamIds, setTeamIds] = useState<Set<string>>(
    () => new Set(initialTeam.map((a) => a.user_id)),
  );
  const teamOptions = [
    ...assignees.map((user) => ({
      id: user.id,
      label: `${appUserLabel(user)} — ${roleLabel(t, user.role)}`,
      archived: false,
    })),
    ...initialTeam
      .filter((a) => !assignees.some((user) => user.id === a.user_id))
      .map((a) => ({ id: a.user_id, label: a.name, archived: true })),
  ];
  function toggleTeamMember(id: string, on: boolean) {
    setTeamIds((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  // Photos picked before the job exists (create mode only).
  const uploads = useDeferredUploads();

  async function uploadPending(jobId: string, items?: PendingFile[]) {
    const { failed } = await uploads.upload(
      `/api/maintenance/${jobId}/attachments?phase=before`,
      items,
    );
    if (!failed) router.push(`/maintenance/${jobId}`);
  }

  // Logging walks through steps (create mode); editing stays one form.
  // Every step stays mounted, only hidden, so Back loses nothing.
  const wizard = mode === "create";
  const w = t.maintenance.wizard;
  const formRef = useRef<HTMLFormElement>(null);
  const [step, setStep] = useState(0);
  const [maxVisited, setMaxVisited] = useState(0);
  const [stepError, setStepError] = useState<string | null>(null);
  const [review, setReview] = useState<ReviewGroup[]>([]);
  const stepTitles = STEP_IDS.map((id) => w.steps[id]);
  const hiddenUnlessStep = (i: number) => wizard && step !== i;

  function problemOn(from: number): string | null {
    const data = new FormData(formRef.current ?? undefined);
    if (from === 0 && !String(data.get("title") ?? "").trim()) return w.titleRequired;
    if (from === 1 && !(zoneWide ? zoneId : enclosureId)) return w.locationRequired;
    return null;
  }

  function buildReview(): ReviewGroup[] {
    const data = new FormData(formRef.current ?? undefined);
    const text = (key: string) => String(data.get(key) ?? "").trim() || null;
    const enclosure = enclosures.find((e) => e.id === enclosureId);
    const zone = zones.find((z) => z.id === zoneId);
    const place = zoneWide
      ? zone
        ? `${placeName(locale, zone.name, zone.name_th)} — ${t.maintenance.zoneWide}`
        : null
      : enclosure
        ? placeName(locale, enclosure.name, enclosure.name_th)
        : null;
    const team = teamOptions.filter((o) => teamIds.has(o.id)).map((o) => o.label);
    const cost = text("estimatedCost");
    const due = text("dueDate");
    return [
      {
        step: 0,
        title: stepTitles[0],
        entries: [
          { label: f.title, value: text("title") },
          { label: f.description, value: text("description") },
          { label: f.photos, value: w.photos(uploads.files.length) },
        ],
      },
      { step: 1, title: stepTitles[1], entries: [{ label: f.location, value: place }] },
      {
        step: 2,
        title: stepTitles[2],
        entries: [
          { label: f.status, value: maintenanceStatusLabel(t, text("status") ?? "Not Started") },
          { label: f.dueDate, value: due ? formatDate(due, locale) : null },
          { label: f.assignedTo, value: team.length > 0 ? team.join(", ") : null },
          { label: f.estimatedCost, value: cost ? formatBaht(Number(cost), locale) : null },
        ],
      },
    ];
  }

  function goTo(target: number) {
    if (target > step) {
      // Moving on checks only the steps being left; going back never does.
      for (let i = step; i < target; i += 1) {
        const problem = problemOn(i);
        if (problem) {
          setStepError(problem);
          setStep(i);
          return;
        }
      }
    }
    setStepError(null);
    if (target === REVIEW_STEP) setReview(buildReview());
    setStep(target);
    setMaxVisited((v) => Math.max(v, target));
    window.scrollTo({ top: 0 });
  }

  // Enter in a text box would otherwise save a half-filled job.
  function blockEnterSubmit(event: KeyboardEvent<HTMLFormElement>) {
    if (wizard && event.key === "Enter" && (event.target as HTMLElement).tagName === "INPUT") {
      event.preventDefault();
    }
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
          ? await createMaintenanceJob(formData)
          : await updateMaintenanceJob(formData);
      if (!result.ok) {
        setError(result.error);
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
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      onKeyDown={blockEnterSubmit}
      className="flex max-w-2xl flex-col gap-6"
    >
      {wizard && (
        <WizardProgress
          current={step}
          maxVisited={maxVisited}
          titles={stepTitles}
          pending={pending}
          onGo={goTo}
          labels={w}
        />
      )}
      {mode === "edit" && initial && (
        <input type="hidden" name="jobId" value={initial.id} />
      )}

      <div hidden={hiddenUnlessStep(0)} className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <label htmlFor="title" className="text-sm font-medium text-muted">
          {f.title} <span className="text-danger">*</span>
        </label>
        <input
          id="title"
          name="title"
          required={!wizard}
          autoFocus={mode === "create"}
          defaultValue={initial?.title ?? ""}
          placeholder={fm.titlePlaceholder}
          className={inputClass}
        />
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

      </div>

      <div hidden={hiddenUnlessStep(1)} className="flex flex-col gap-6">
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
              required={!wizard}
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
              required={!wizard && !zoneWide}
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

      </div>

      <div hidden={hiddenUnlessStep(2)} className="flex flex-col gap-6">
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
          <OptionalDateInput
            id="dueDate"
            name="dueDate"
            label={f.dueDate}
            defaultValue={initial?.due_date ?? ""}
            className={inputClass}
          />
        </div>
      </div>

      <fieldset className="flex flex-col gap-1">
        <legend className="text-sm font-medium text-muted">
          {f.assignedTo}
          <span className="ml-2 font-normal">
            {teamIds.size === 0 ? fm.unassigned : fm.teamCount(teamIds.size)}
          </span>
        </legend>
        {teamOptions.length === 0 ? (
          <p className="text-sm text-muted">{fm.noAssignees}</p>
        ) : (
          <ul className="grid max-h-56 gap-1 overflow-y-auto rounded border border-border bg-surface p-2 sm:grid-cols-2">
            {teamOptions.map((option) => (
              <li key={option.id}>
                <label className="flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 text-sm text-foreground hover:bg-surface-hover">
                  <input
                    type="checkbox"
                    name="assigneeIds"
                    value={option.id}
                    checked={teamIds.has(option.id)}
                    onChange={(e) => toggleTeamMember(option.id, e.target.checked)}
                    className="h-4 w-4 accent-primary"
                  />
                  <span className={option.archived ? "text-muted line-through" : ""}>
                    {option.label}
                  </span>
                  {option.archived && (
                    <span className="text-xs text-muted">{fm.archivedMember}</span>
                  )}
                </label>
              </li>
            ))}
          </ul>
        )}
        <p className="text-xs text-muted">{fm.assignedHint}</p>
      </fieldset>

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

      </div>

      {wizard && step === REVIEW_STEP && (
        <ReviewSummary groups={review} onEdit={goTo} labels={w} />
      )}

      {error && <p className="text-sm text-danger">{error}</p>}

      {wizard ? (
        <>
          {stepError && <p className="text-sm text-danger">{stepError}</p>}
          <WizardNav
            current={step}
            pending={pending}
            onBack={() => goTo(step - 1)}
            onNext={() => goTo(step + 1)}
            reviewStep={REVIEW_STEP}
            labels={w}
            finalActions={
              <button
                type="button"
                disabled={pending}
                onClick={() => formRef.current?.requestSubmit()}
                className="flex-1 rounded bg-primary px-4 py-3 text-base font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50 sm:flex-none sm:px-10"
              >
                {pending ? fm.saving : fm.saveButton}
              </button>
            }
          />
          <Link href={cancelHref} className="inline-flex min-h-11 items-center text-sm text-muted hover:text-foreground md:min-h-0">
            {t.common.cancel}
          </Link>
        </>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={pending}
            className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
          >
            {pending ? fm.saving : t.common.saveChanges}
          </button>
          <Link href={cancelHref} className="inline-flex min-h-11 items-center text-sm text-muted hover:text-foreground md:min-h-0">
            {t.common.cancel}
          </Link>
        </div>
      )}
    </form>
  );
}
