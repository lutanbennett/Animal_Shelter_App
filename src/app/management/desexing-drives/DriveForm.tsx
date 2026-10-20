"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { DateInput } from "@/components/DateInput";
import { DRIVE_SPECIES, DRIVE_STATUSES, type DriveFields } from "@/lib/desexing/form";
import { createDrive, deleteDrive, saveDrive } from "./actions";

const inputClass =
  "min-h-11 w-full rounded border border-border bg-background px-3 py-2 text-base text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40 sm:text-sm";
const labelClass = "text-sm font-medium text-muted";
const hintClass = "text-xs text-muted";

/** Create or edit a drive. Every date, price and rule is typed here by the shelter; the form starts blank. */
export function DriveForm({ mode, driveId, initial }: { mode: "new" | "edit"; driveId?: string; initial: DriveFields }) {
  const { t } = useI18n();
  const f = t.desexingAdmin.form;
  const router = useRouter();
  const [fields, setFields] = useState<DriveFields>(initial);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const set = <K extends keyof DriveFields>(key: K, value: DriveFields[K]) => {
    setSaved(false);
    setFields((p) => ({ ...p, [key]: value }));
  };
  const toggleSpecies = (s: string) =>
    set("species", fields.species.includes(s) ? fields.species.filter((x) => x !== s) : [...fields.species, s]);

  function submit() {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      if (mode === "new") {
        const result = await createDrive(fields);
        if (!result.ok) return setError(result.error);
        router.push(`/management/desexing-drives/${result.id}`);
        return;
      }
      const result = await saveDrive(driveId!, fields);
      if (!result.ok) return setError(result.error);
      setSaved(true);
      router.refresh();
    });
  }

  function remove() {
    setError(null);
    startTransition(async () => {
      const result = await deleteDrive(driveId!);
      if (!result.ok) return setError(result.error);
      router.push("/management/desexing-drives");
    });
  }

  return (
    <form
      className="flex max-w-3xl flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <fieldset className="flex flex-col gap-3 rounded border border-border bg-surface p-4">
        <legend className="px-1 text-base font-semibold text-foreground">{f.heading}</legend>
        <div className="flex flex-col gap-1">
          <label htmlFor="dd-title" className={labelClass}>{f.title}</label>
          <input id="dd-title" required value={fields.title} onChange={(e) => set("title", e.target.value)} className={inputClass} lang="und" />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="flex flex-col gap-1">
            <label htmlFor="dd-date" className={labelClass}>{f.date}</label>
            <DateInput id="dd-date" required value={fields.driveDate} onChange={(e) => set("driveDate", e.target.value)} className={inputClass} />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="dd-start" className={labelClass}>{f.startsAt}</label>
            <input id="dd-start" type="time" value={fields.startsAt} onChange={(e) => set("startsAt", e.target.value)} className={inputClass} />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="dd-end" className={labelClass}>{f.endsAt}</label>
            <input id="dd-end" type="time" value={fields.endsAt} onChange={(e) => set("endsAt", e.target.value)} className={inputClass} />
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="dd-venue" className={labelClass}>{f.venue}</label>
          <input id="dd-venue" required value={fields.venue} onChange={(e) => set("venue", e.target.value)} className={inputClass} lang="und" />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="dd-address" className={labelClass}>{f.venueAddress}</label>
          <textarea id="dd-address" rows={2} value={fields.venueAddress} onChange={(e) => set("venueAddress", e.target.value)} className={inputClass} lang="und" />
        </div>
        <fieldset className="flex flex-col gap-1">
          <legend className={labelClass}>{f.species}</legend>
          <div className="flex flex-wrap gap-4">
            {DRIVE_SPECIES.map((s) => (
              <label key={s} className="flex min-h-11 items-center gap-2 text-sm text-foreground">
                <input type="checkbox" checked={fields.species.includes(s)} onChange={() => toggleSpecies(s)} />
                {t.desexing.species[s]}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label htmlFor="dd-cap" className={labelClass}>{f.capacity}</label>
            <input id="dd-cap" inputMode="numeric" value={fields.capacity} onChange={(e) => set("capacity", e.target.value)} className={`${inputClass} text-right`} />
            <span className={hintClass}>{f.capacityHint}</span>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="dd-close" className={labelClass}>{f.signupsCloseOn}</label>
            <DateInput id="dd-close" value={fields.signupsCloseOn} onChange={(e) => set("signupsCloseOn", e.target.value)} className={inputClass} />
            <span className={hintClass}>{f.signupsCloseHint}</span>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="dd-price" className={labelClass}>{f.priceNote}</label>
          <textarea id="dd-price" rows={2} value={fields.priceNote} onChange={(e) => set("priceNote", e.target.value)} className={inputClass} lang="und" />
          <span className={hintClass}>{f.priceHint}</span>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="dd-elig" className={labelClass}>{f.eligibilityNote}</label>
          <textarea id="dd-elig" rows={3} value={fields.eligibilityNote} onChange={(e) => set("eligibilityNote", e.target.value)} className={inputClass} lang="und" />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="dd-desc" className={labelClass}>{f.description}</label>
          <textarea id="dd-desc" rows={3} value={fields.description} onChange={(e) => set("description", e.target.value)} className={inputClass} lang="und" />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="dd-status" className={labelClass}>{f.status}</label>
          <select id="dd-status" value={fields.status} onChange={(e) => set("status", e.target.value)} className={inputClass}>
            {DRIVE_STATUSES.map((s) => (
              <option key={s} value={s}>{t.desexingAdmin.driveStatus[s]}</option>
            ))}
          </select>
          <span className={hintClass}>{f.statusHint}</span>
        </div>
      </fieldset>

      {error && <p role="alert" className="rounded border border-danger/40 bg-danger/10 p-3 text-sm text-danger">{error}</p>}
      {saved && <p role="status" className="text-sm text-muted">{f.saved}</p>}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="min-h-11 rounded bg-primary px-5 text-base font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-60"
        >
          {mode === "new" ? f.create : t.common.saveChanges}
        </button>
        {mode === "edit" &&
          (confirmDelete ? (
            <span className="flex items-center gap-2 text-sm text-foreground">
              {f.deleteConfirm}
              <button type="button" onClick={remove} disabled={pending} className="min-h-11 rounded border border-danger px-4 text-danger">
                {t.common.confirm}
              </button>
              <button type="button" onClick={() => setConfirmDelete(false)} className="min-h-11 px-3 text-muted underline">
                {t.common.cancel}
              </button>
            </span>
          ) : (
            <button type="button" onClick={() => setConfirmDelete(true)} className="min-h-11 px-3 text-sm text-danger underline">
              {f.delete}
            </button>
          ))}
      </div>
    </form>
  );
}
