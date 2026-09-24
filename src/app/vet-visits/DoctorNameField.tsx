"use client";

import { useI18n } from "@/lib/i18n/I18nProvider";
import type { DoctorNamesByVet } from "@/lib/vets/doctors";

/**
 * The optional Doctor field on the booking and edit forms: free text, with
 * the names already recorded against the chosen vet offered as a datalist
 * so a name is typed once and picked after that. The list follows the vet
 * select, so the form passes the currently selected vet id.
 */
export function DoctorNameField({
  vetId,
  namesByVet,
  defaultValue,
  className,
}: {
  vetId: string;
  namesByVet: DoctorNamesByVet;
  defaultValue?: string;
  className: string;
}) {
  const { t } = useI18n();
  const names = namesByVet[vetId] ?? [];

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
