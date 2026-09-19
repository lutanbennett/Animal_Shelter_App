"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { createBloodTest } from "./actions";
import {
  BloodTestAttachmentUploader,
  type UploadedAttachment,
} from "@/components/BloodTestAttachmentUploader";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { formatDate } from "@/lib/format";

export type VetAppointmentOption = {
  id: string;
  appointment_date: string;
  reason: string | null;
};

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function BloodTestForm({
  residentId,
  residentDisplayName,
  vetAppointments,
  preselectedVetAppointmentId,
}: {
  residentId: string;
  residentDisplayName: string;
  vetAppointments: VetAppointmentOption[];
  preselectedVetAppointmentId: string | null;
}) {
  const [state, formAction, pending] = useActionState(createBloodTest, undefined);
  const { t, locale } = useI18n();
  const [dateTouched, setDateTouched] = useState(false);
  const [date, setDate] = useState(() => {
    if (preselectedVetAppointmentId) {
      const match = vetAppointments.find((a) => a.id === preselectedVetAppointmentId);
      if (match) return match.appointment_date.slice(0, 10);
    }
    return todayIsoDate();
  });
  const [attachments, setAttachments] = useState<UploadedAttachment[]>([]);

  function handleVetAppointmentChange(id: string) {
    if (dateTouched || !id) return;
    const match = vetAppointments.find((a) => a.id === id);
    if (match) setDate(match.appointment_date.slice(0, 10));
  }

  if (state && "success" in state) {
    return (
      <div className="flex max-w-2xl flex-col gap-6">
        <div className="flex flex-col gap-1 rounded-lg border border-success/40 bg-success/10 p-4">
          <p className="text-sm font-medium text-success">
            {t.bloodTests.savedHeading(residentDisplayName, formatDate(state.date, locale))}
          </p>
          <p className="text-xs text-muted">{t.bloodTests.attachHint}</p>
        </div>

        <BloodTestAttachmentUploader
          bloodTestId={state.bloodTestId}
          onUploaded={(attachment) =>
            setAttachments((prev) => [...prev, attachment])
          }
        />

        {attachments.length > 0 && (
          <ul className="flex flex-col gap-1 text-sm text-foreground">
            {attachments.map((a) => (
              <li key={a.attachmentId} className="truncate">
                {a.fileName}
              </li>
            ))}
          </ul>
        )}

        <div>
          <Link
            href={`/residents/${residentId}/blood-tests`}
            className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
          >
            {t.bloodTests.done}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-6">
      <input type="hidden" name="residentId" value={residentId} />

      <p className="text-sm text-muted">{t.bloodTests.forResident(residentDisplayName)}</p>

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
            className="rounded border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40"
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
            className="rounded border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40"
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
          className="rounded border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40"
        />
        <p className="text-xs text-muted">{t.bloodTests.resultsHint}</p>
      </div>

      {state?.error && <p className="text-sm text-danger">{state.error}</p>}

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
