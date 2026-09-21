"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createBloodTest } from "./actions";
import {
  FileDropZone,
  PendingFileList,
  UploadProgressPanel,
  useDeferredUploads,
  type PendingFile,
} from "@/components/DeferredUploads";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { formatDate } from "@/lib/format";

export type BloodTestTypeOption = { id: string; name: string };
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
 * The routine panel, preselected so the common case is one tap. Matched by
 * name prefix so an admin renaming the seeded row (0050) to plain "CBC"
 * keeps the default; falls back to the first type if none matches.
 */
function defaultTypeId(types: BloodTestTypeOption[]): string {
  return (
    types.find((type) => /^CBC\b/i.test(type.name))?.id ??
    types[0]?.id ??
    ""
  );
}

/**
 * One form for the test's details and its files. The lab scan is picked
 * here and uploaded on Save (useDeferredUploads), after which the page
 * goes to the Blood Tests tab; a report that turns up later is attached
 * from the tab's row instead.
 */
export function BloodTestForm({
  residentId,
  residentDisplayName,
  bloodTestTypes,
  vetAppointments,
  preselectedVetAppointmentId,
}: {
  residentId: string;
  residentDisplayName: string;
  bloodTestTypes: BloodTestTypeOption[];
  vetAppointments: VetAppointmentOption[];
  preselectedVetAppointmentId: string | null;
}) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<{ bloodTestId: string; date: string } | null>(null);
  const [dateTouched, setDateTouched] = useState(false);
  const [date, setDate] = useState(() => {
    if (preselectedVetAppointmentId) {
      const match = vetAppointments.find((a) => a.id === preselectedVetAppointmentId);
      if (match) return match.appointment_date.slice(0, 10);
    }
    return todayIsoDate();
  });
  const uploads = useDeferredUploads();
  const tabHref = `/residents/${residentId}/blood-tests`;

  function handleVetAppointmentChange(id: string) {
    if (dateTouched || !id) return;
    const match = vetAppointments.find((a) => a.id === id);
    if (match) setDate(match.appointment_date.slice(0, 10));
  }

  async function uploadPending(bloodTestId: string, items?: PendingFile[]) {
    const { failed } = await uploads.upload(
      `/api/blood-tests/${bloodTestId}/attachments`,
      items,
    );
    if (!failed) router.push(tabHref);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setError(null);
    startTransition(async () => {
      const result = await createBloodTest(undefined, formData);
      if (!result || "error" in result) {
        setError(result?.error ?? t.bloodTests.errors.saveFailed);
        return;
      }
      setSaved({ bloodTestId: result.bloodTestId, date: result.date });
      if (uploads.queued.length === 0) {
        router.push(tabHref);
        return;
      }
      await uploadPending(result.bloodTestId);
    });
  }

  if (saved && uploads.files.length > 0) {
    return (
      <UploadProgressPanel
        saved={t.bloodTests.savedHeading(residentDisplayName, formatDate(saved.date, locale))}
        uploads={uploads}
        onRetry={(item) => void uploadPending(saved.bloodTestId, [item])}
        continueHref={tabHref}
        continueLabel={t.bloodTests.done}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-2xl flex-col gap-6">
      <input type="hidden" name="residentId" value={residentId} />

      <p className="text-sm text-muted">{t.bloodTests.forResident(residentDisplayName)}</p>

      <div className="flex flex-col gap-1">
        <label htmlFor="bloodTestTypeId" className="text-sm font-medium text-muted">
          {t.bloodTests.testType} <span className="text-danger">*</span>
        </label>
        <select
          id="bloodTestTypeId"
          name="bloodTestTypeId"
          required
          defaultValue={defaultTypeId(bloodTestTypes)}
          className={inputClass}
        >
          {bloodTestTypes.map((type) => (
            <option key={type.id} value={type.id}>
              {type.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label htmlFor="date" className="text-sm font-medium text-muted">
            {t.bloodTests.dateOfTest}
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
            {t.bloodTests.linkedVisit}
          </label>
          <select
            id="vetAppointmentId"
            name="vetAppointmentId"
            defaultValue={preselectedVetAppointmentId ?? ""}
            onChange={(e) => handleVetAppointmentChange(e.target.value)}
            className={inputClass}
          >
            <option value="">{t.bloodTests.noLinkedVisit}</option>
            {vetAppointments.map((a) => (
              <option key={a.id} value={a.id}>
                {formatDate(a.appointment_date, locale)}
                {a.reason ? ` — ${a.reason}` : ""}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="results" className="text-sm font-medium text-muted">
          {t.bloodTests.results}
        </label>
        <textarea
          id="results"
          name="results"
          rows={4}
          placeholder={t.bloodTests.resultsPlaceholder}
          className={inputClass}
        />
        <p className="text-xs text-muted">{t.bloodTests.resultsHint}</p>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-muted">{t.bloodTests.files}</span>
        <p className="text-xs text-muted">{t.bloodTests.attachHint}</p>
        <FileDropZone
          label={t.bloodTests.uploader.dropHere}
          hint={t.bloodTests.uploader.hint}
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
          {pending ? t.bloodTests.saving : t.bloodTests.saveButton}
        </button>
      </div>
    </form>
  );
}
