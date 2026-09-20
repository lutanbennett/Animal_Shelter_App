"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { createProcedure } from "./actions";
import {
  AttachmentUploader,
  type UploadedAttachment,
} from "@/components/AttachmentUploader";
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
  const [state, formAction, pending] = useActionState(createProcedure, undefined);
  const { t, locale } = useI18n();

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
            {t.procedures.savedHeading(
              state.typeName,
              residentDisplayName,
              formatDate(state.date, locale),
            )}
          </p>
          <p className="text-xs text-muted">{t.procedures.attachHint}</p>
        </div>

        <AttachmentUploader
          uploadUrl={`/api/procedures/${state.procedureId}/attachments`}
          dropHere={t.procedures.uploader.dropHere}
          hint={t.procedures.uploader.hint}
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
            href={`/residents/${residentId}/procedures`}
            className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
          >
            {t.procedures.done}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-6">
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

      {state?.error && <p className="text-sm text-danger">{state.error}</p>}

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
