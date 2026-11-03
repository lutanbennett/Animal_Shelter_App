"use client";

import { useI18n } from "@/lib/i18n/I18nProvider";
import type { DoctorNamesByClinic } from "@/lib/clinics/doctors";

/**
 * The optional Doctor field on the booking and edit forms: free text, with
 * the names already recorded against the chosen clinic offered as a datalist
 * so a name is typed once and picked after that. The list follows the clinic
 * select, so the form passes the currently selected clinic id.
 *
 * `canAddDoctor` is `clinics.doctors`, the activity the database asks (doctors_insert_perm, 0182) when a typed
 * name is new: the booking trigger adds the doctor as the caller. Without it the field is a chooser of the
 * clinic's existing doctors and offers no free text; it defaults to false so a caller that forgets offers nothing.
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
  canAddDoctor = false,
  defaultClinicId,
  className,
}: {
  clinicId: string;
  namesByClinic: DoctorNamesByClinic;
  lockedName?: string | null;
  defaultValue?: string;
  canAddDoctor?: boolean;
  /** The clinic `defaultValue` was recorded at. Once the clinic is moved, that name is not carried unless the new clinic lists it. */
  defaultClinicId?: string;
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

  if (!canAddDoctor) {
    // A visit already carrying a name that is not on the list keeps it as a choice, so editing does not drop it.
    // Moving the visit to another clinic re-resolves the name there, and an unlisted one would be added as the caller.
    const keepsOwn = defaultValue && !names.includes(defaultValue) && (defaultClinicId === undefined || defaultClinicId === clinicId);
    const options = keepsOwn ? [defaultValue, ...names] : names;
    return (
      <div className="flex flex-col gap-1">
        <label htmlFor="doctorName" className="text-sm font-medium text-muted">
          {t.vetVisits.doctorName}
        </label>
        <select key={clinicId} id="doctorName" name="doctorName" defaultValue={options.includes(defaultValue ?? "") ? defaultValue : ""} className={className}>
          <option value="">{t.vetVisits.doctorNone}</option>
          {options.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
        <p className="text-xs text-muted">{t.vetVisits.doctorChooseHint}</p>
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
