"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createProcedure } from "./actions";
import {
  FileDropZone,
  PendingFileList,
  UploadProgressPanel,
  useDeferredUploads,
  type PendingFile,
} from "@/components/DeferredUploads";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { formatDate } from "@/lib/format";

export type ProcedureTypeOption = { id: string; name: string };
export type VetAppointmentOption = {
  id: string;
  appointment_date: string;
  reason: string | null;
};

const inputClass =
  "rounded border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40";

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * One form for the procedure's details and its files. X-rays and scans
 * are picked here and uploaded on Save (useDeferredUploads), after which
 * the page goes to the Procedures tab; files that arrive later are
 * attached from the tab's row instead.
 */
export function ProcedureForm({
  residentId,
  residentDisplayName,
  procedureTypes,
  vetAppointments,
  preselectedVetAppointmentId,
}: {
  residentId: string;
  residentDisplayName: string;
  procedureTypes: ProcedureTypeOption[];
  vetAppointments: VetAppointmentOption[];
  preselectedVetAppointmentId: string | null;
}) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<{
    procedureId: string;
    typeName: string;
    date: string;
  } | null>(null);

  // The type switches between "pick one" and "add a new one" the way the
  // prescription form's medication field does; whichever input is mounted
  // is what gets submitted.
  const [isAddingType, setIsAddingType] = useState(procedureTypes.length === 0);

  // Linking a vet visit defaults the date to the visit's date until the
  // user has typed a date themselves — same behaviour as weight and blood
  // tests.
  const [dateTouched, setDateTouched] = useState(false);
  const [date, setDate] = useState(() => {
    if (preselectedVetAppointmentId) {
      const match = vetAppointments.find((a) => a.id === preselectedVetAppointmentId);
      if (match) return match.appointment_date.slice(0, 10);
    }
    return todayIsoDate();
  });
  const uploads = useDeferredUploads();
  const tabHref = `/residents/${residentId}/procedures`;

  function handleVetAppointmentChange(id: string) {
    if (dateTouched || !id) return;
    const match = vetAppointments.find((a) => a.id === id);
    if (match) setDate(match.appointment_date.slice(0, 10));
  }

  async function uploadPending(procedureId: string, items?: PendingFile[]) {
    const { failed } = await uploads.upload(
      `/api/procedures/${procedureId}/attachments`,
      items,
    );
    if (!failed) router.push(tabHref);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setError(null);
    startTransition(async () => {
      const result = await createProcedure(undefined, formData);
      if (!result || "error" in result) {
        setError(result?.error ?? t.procedures.errors.saveFailed);
        return;
      }
      setSaved({
        procedureId: result.procedureId,
        typeName: result.typeName,
        date: result.date,
      });
      if (uploads.queued.length === 0) {
        router.push(tabHref);
        return;
      }
      await uploadPending(result.procedureId);
    });
  }

  if (saved && uploads.files.length > 0) {
    return (
      <UploadProgressPanel
        saved={t.procedures.savedHeading(
          saved.typeName,
          residentDisplayName,
          formatDate(saved.date, locale),
        )}
        uploads={uploads}
        onRetry={(item) => void uploadPending(saved.procedureId, [item])}
        continueHref={tabHref}
        continueLabel={t.procedures.done}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-2xl flex-col gap-6">
      <input type="hidden" name="residentId" value={residentId} />

      <p className="text-sm text-muted">{t.procedures.forResident(residentDisplayName)}</p>

      <div className="flex flex-col gap-1">
        <label htmlFor="procedureTypeId" className="text-sm font-medium text-muted">
          {t.procedures.type} <span className="text-danger">*</span>
        </label>
        {isAddingType ? (
          <div className="flex gap-2">
            <input
              id="newProcedureTypeName"
              name="newProcedureTypeName"
              required
              autoFocus={procedureTypes.length > 0}
              placeholder={t.procedures.newTypePlaceholder}
              className={`${inputClass} flex-1`}
            />
            {procedureTypes.length > 0 && (
              <button
                type="button"
                onClick={() => setIsAddingType(false)}
                title={t.procedures.chooseExistingType}
                className="rounded border border-border px-3 text-sm text-muted hover:bg-surface-hover"
              >
                ×
              </button>
            )}
          </div>
        ) : (
          <select
            id="procedureTypeId"
            name="procedureTypeId"
            required
            defaultValue=""
            autoFocus
            onChange={(e) => {
              if (e.target.value === "__new__") setIsAddingType(true);
            }}
            className={inputClass}
          >
            <option value="" disabled>
              {t.procedures.selectType}
            </option>
            {procedureTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
            <option value="__new__">{t.procedures.addNewType}</option>
          </select>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label htmlFor="date" className="text-sm font-medium text-muted">
            {t.procedures.date}
          </label>
          <input
            id="date"
            name="date"
            type="date"
            required
            value={date}
            max={todayIsoDate()}
            onChange={(e) => {
              setDateTouched(true);
              setDate(e.target.value);
            }}
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="vetAppointmentId" className="text-sm font-medium text-muted">
            {t.procedures.linkedVisit}
          </label>
          <select
            id="vetAppointmentId"
            name="vetAppointmentId"
            defaultValue={preselectedVetAppointmentId ?? ""}
            onChange={(e) => handleVetAppointmentChange(e.target.value)}
            className={inputClass}
          >
            <option value="">{t.procedures.noLinkedVisit}</option>
            {vetAppointments.map((a) => (
              <option key={a.id} value={a.id}>
                {formatDate(a.appointment_date, locale)}
                {a.reason ? ` — ${a.reason}` : ""}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted">{t.procedures.linkedVisitHint}</p>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="notes" className="text-sm font-medium text-muted">
          {t.procedures.notes}
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={4}
          placeholder={t.procedures.notesPlaceholder}
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-muted">{t.procedures.files}</span>
        <p className="text-xs text-muted">{t.procedures.attachHint}</p>
        <FileDropZone
          label={t.procedures.uploader.dropHere}
          hint={t.procedures.uploader.hint}
          onFiles={uploads.addFiles}
        />
        <PendingFileList files={uploads.files} onRemove={uploads.removeFile} onRetry={null} />
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div>
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
        >
          {pending ? t.procedures.saving : t.procedures.saveButton}
        </button>
      </div>
    </form>
  );
}
