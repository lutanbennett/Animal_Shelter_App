"use client";

import { useI18n } from "@/lib/i18n/I18nProvider";
import type { DoctorNamesByClinic } from "@/lib/clinics/doctors";

/**
 * The optional Doctor field on the booking and edit forms: free text, with
 * the names already recorded against the chosen clinic offered as a datalist
 * so a name is typed once and picked after that. The list follows the clinic
 * select, so the form passes the currently selected clinic id.
 *
 * `lockedName` is a doctor login's own doctor entry (Lutan, 2026-10-01):
 * when a doctor records a visit the Doctor is themselves, shown but not editable,
 * and sent as a hidden field. The action sets it again server-side.
 */
export function DoctorNameField({
  clinicId,
  namesByClinic,
  lockedName,
  defaultValue,
  className,
}: {
  clinicId: string;
  namesByClinic: DoctorNamesByClinic;
  lockedName?: string | null;
  defaultValue?: string;
  className: string;
}) {
  const { t } = useI18n();
  const names = namesByClinic[clinicId] ?? [];

  if (lockedName) {
    return (
      <div className="flex flex-col gap-1">
        <label htmlFor="doctorName" className="text-sm font-medium text-muted">
          {t.vetVisits.doctorName}
        </label>
        <input type="hidden" name="doctorName" value={lockedName} />
        <p id="doctorName" className="py-2 text-sm text-foreground">
          {lockedName}
        </p>
        <p className="text-xs text-muted">{t.vetVisits.doctorLockedHint}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor="doctorName" className="text-sm font-medium text-muted">
        {t.vetVisits.doctorName}
      </label>
      <input
        id="doctorName"
        name="doctorName"
        type="text"
        autoComplete="off"
        list={names.length > 0 ? "doctorNameOptions" : undefined}
        defaultValue={defaultValue}
        placeholder={t.vetVisits.doctorNamePlaceholder}
        className={className}
      />
      {names.length > 0 && (
        <datalist id="doctorNameOptions">
          {names.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>
      )}
      <p className="text-xs text-muted">{t.vetVisits.doctorNameHint}</p>
    </div>
  );
}
