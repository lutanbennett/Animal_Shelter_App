"use client";

import { useActionState, useMemo, useState } from "react";
import { ResidentPicker } from "@/components/ResidentPicker";
import { formatDate } from "@/lib/format";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { placeName } from "@/lib/enclosures/names";
import { recordImmunizations } from "./actions";

export type ResidentOption = {
  id: string;
  name: string;
  thai_name: string | null;
  current_status: string | null;
  zone_id: string | null;
  enclosure_id: string | null;
};

export type ImmunizationTypeOption = {
  id: string;
  name: string;
  is_mandatory: boolean;
  interval_months: number | null;
};

export type ZoneOption = { id: string; name: string; name_th: string | null };
export type EnclosureOption = { id: string; name: string; name_th: string | null; zone_id: string };

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

export function ImmunizationForm({
  residents,
  immunizationTypes,
  zones,
  enclosures,
  preselectedResidentIds,
}: {
  residents: ResidentOption[];
  immunizationTypes: ImmunizationTypeOption[];
  zones: ZoneOption[];
  enclosures: EnclosureOption[];
  preselectedResidentIds: string[];
}) {
  const [state, formAction, pending] = useActionState(
    recordImmunizations,
    undefined,
  );
  const { t, locale } = useI18n();
  const [selectedResidentIds, setSelectedResidentIds] = useState<string[]>(
    preselectedResidentIds,
  );
  const [selectedTypeIds, setSelectedTypeIds] = useState<string[]>([]);
  const [zoneFilter, setZoneFilter] = useState("");
  const [enclosureFilter, setEnclosureFilter] = useState("");

  const selectedTypes = useMemo(
    () =>
      immunizationTypes.filter((type) => selectedTypeIds.includes(type.id)),
    [immunizationTypes, selectedTypeIds],
  );

  function addByZone() {
    if (!zoneFilter) return;
    const ids = residents
      .filter((r) => r.zone_id === zoneFilter)
      .map((r) => r.id);
    setSelectedResidentIds((prev) => Array.from(new Set([...prev, ...ids])));
  }

  function addByEnclosure() {
    if (!enclosureFilter) return;
    const ids = residents
      .filter((r) => r.enclosure_id === enclosureFilter)
      .map((r) => r.id);
    setSelectedResidentIds((prev) => Array.from(new Set([...prev, ...ids])));
  }

  function toggleType(id: string) {
    setSelectedTypeIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    );
  }

  const recordCount = selectedResidentIds.length * selectedTypeIds.length;

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      {state && "success" in state && (
        <div className="flex flex-col gap-3 rounded-lg border border-success/40 bg-success/10 p-4">
          <p className="text-sm font-medium text-success">
            {t.immunizations.resultHeading(state.records.length)}
          </p>
          <div className="overflow-x-auto rounded border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface text-muted">
                <tr>
                  <th className="px-3 py-2 font-medium">
                    {t.immunizations.resultTable.resident}
                  </th>
                  <th className="px-3 py-2 font-medium">
                    {t.immunizations.resultTable.immunization}
                  </th>
                  <th className="px-3 py-2 font-medium">
                    {t.immunizations.resultTable.administered}
                  </th>
                  <th className="px-3 py-2 font-medium">
                    {t.immunizations.resultTable.nextDue}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-background">
                {state.records.map((r) => (
                  <tr key={r.id}>
                    <td className="px-3 py-2 text-foreground">
                      {r.residentName}
                    </td>
                    <td className="px-3 py-2 text-foreground">
                      {r.immunizationTypeName}
                    </td>
                    <td className="px-3 py-2 text-muted">
                      {formatDate(r.dateAdministered, locale)}
                    </td>
                    <td className="px-3 py-2 text-muted">
                      {r.nextDueDate
                        ? formatDate(r.nextDueDate, locale)
                        : t.immunizations.resultTable.noRecurringDose}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <form action={formAction} className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-muted">
            {t.immunizations.residentsLabel}
          </label>

          <div className="flex flex-wrap items-end gap-2 rounded border border-border bg-surface p-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted">
                {t.immunizations.addAllInZone}
              </label>
              <select
                value={zoneFilter}
                onChange={(e) => setZoneFilter(e.target.value)}
                className="w-40 rounded border border-border bg-background px-2 py-1.5 text-sm text-foreground outline-none focus:border-primary"
              >
                <option value="">{t.immunizations.selectZone}</option>
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {placeName(locale, z.name, z.name_th)}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={addByZone}
              disabled={!zoneFilter}
              className="rounded border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-surface-hover disabled:opacity-50"
            >
              {t.immunizations.addZone}
            </button>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted">
                {t.immunizations.addAllInEnclosure}
              </label>
              <select
                value={enclosureFilter}
                onChange={(e) => setEnclosureFilter(e.target.value)}
                className="w-40 rounded border border-border bg-background px-2 py-1.5 text-sm text-foreground outline-none focus:border-primary"
              >
                <option value="">{t.immunizations.selectEnclosure}</option>
                {enclosures.map((e) => (
                  <option key={e.id} value={e.id}>
                    {placeName(locale, e.name, e.name_th)}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={addByEnclosure}
              disabled={!enclosureFilter}
              className="rounded border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-surface-hover disabled:opacity-50"
            >
              {t.immunizations.addEnclosure}
            </button>
          </div>

          <ResidentPicker
            residents={residents}
            selectedIds={selectedResidentIds}
            onChange={setSelectedResidentIds}
            triggerLabel={t.immunizations.selectResidents}
          />
          {selectedResidentIds.map((id) => (
            <input key={id} type="hidden" name="residentIds" value={id} />
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-muted">
            {t.immunizations.typesLabel}
          </label>
          <div className="flex flex-col divide-y divide-border rounded border border-border bg-surface">
            {immunizationTypes.map((type) => (
              <label
                key={type.id}
                className="flex cursor-pointer items-center gap-3 px-3 py-2 text-sm hover:bg-surface-hover"
              >
                <input
                  type="checkbox"
                  checked={selectedTypeIds.includes(type.id)}
                  onChange={() => toggleType(type.id)}
                  className="h-4 w-4 accent-primary"
                />
                <span className="flex-1 text-foreground">{type.name}</span>
                {type.is_mandatory && (
                  <span className="text-xs text-muted">
                    {t.immunizations.mandatory}
                  </span>
                )}
                <span className="text-xs text-muted">
                  {type.interval_months
                    ? t.immunizations.everyMonths(type.interval_months)
                    : t.immunizations.oneOff}
                </span>
              </label>
            ))}
            {immunizationTypes.length === 0 && (
              <p className="px-3 py-4 text-center text-sm text-muted">
                {t.immunizations.noTypesConfigured}
              </p>
            )}
          </div>
          {selectedTypeIds.map((id) => (
            <input
              key={id}
              type="hidden"
              name="immunizationTypeIds"
              value={id}
            />
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label
              htmlFor="dateAdministered"
              className="text-sm font-medium text-muted"
            >
              {t.immunizations.dateAdministered}
            </label>
            <input
              id="dateAdministered"
              name="dateAdministered"
              type="date"
              required
              defaultValue={todayIsoDate()}
              max={todayIsoDate()}
              className="rounded border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor="administeredBy"
              className="text-sm font-medium text-muted"
            >
              {t.immunizations.administeredBy}
            </label>
            <input
              id="administeredBy"
              name="administeredBy"
              type="text"
              placeholder={t.immunizations.administeredByPlaceholder}
              className="rounded border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="notes" className="text-sm font-medium text-muted">
            {t.immunizations.notes}
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            placeholder={t.immunizations.notesPlaceholder}
            className="rounded border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40"
          />
        </div>

        {selectedTypes.length > 0 && selectedResidentIds.length > 0 && (
          <p className="text-xs text-muted">
            {t.immunizations.willCreateRecords(
              selectedResidentIds.length,
              selectedTypes.length,
              recordCount,
            )}
          </p>
        )}

        {state && "error" in state && (
          <p className="text-sm text-danger">{state.error}</p>
        )}

        <div>
          <button
            type="submit"
            disabled={
              pending ||
              selectedResidentIds.length === 0 ||
              selectedTypeIds.length === 0
            }
            className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
          >
            {pending
              ? t.immunizations.recording
              : t.immunizations.recordButton(recordCount)}
          </button>
        </div>
      </form>
    </div>
  );
}
