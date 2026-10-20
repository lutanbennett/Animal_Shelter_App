"use client";

import { useState, useTransition } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { DRIVE_SPECIES, PET_SEXES, type SignupFields } from "@/lib/desexing/form";
import { signUpForDrive } from "./actions";

const inputClass =
  "min-h-11 w-full rounded-lg border border-site-line bg-white px-3 py-2 text-base text-site-ink outline-none focus:border-site-action focus:ring-2 focus:ring-site-action/40";
const labelClass = "flex flex-col gap-1 text-[15px] font-semibold text-site-ink";

/**
 * The sign-up for one drive. Opens under the drive's card. A success shows
 * only a thank-you: nothing the person typed is shown back, and nothing the
 * database holds is read (anon cannot read a sign-up).
 */
export function SignupForm({ driveId, species }: { driveId: string; species: string[] }) {
  const { t } = useI18n();
  const f = t.desexing.form;
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [fields, setFields] = useState<SignupFields>({
    driveId,
    ownerName: "",
    ownerPhone: "",
    ownerEmail: "",
    petName: "",
    petSpecies: species.length === 1 ? species[0] : "",
    petSex: "unknown",
    petAgeNote: "",
    notes: "",
  });
  const set = <K extends keyof SignupFields>(key: K, value: SignupFields[K]) =>
    setFields((p) => ({ ...p, [key]: value }));

  if (done) {
    return (
      <p role="status" className="rounded-xl border border-site-line bg-site-sand p-4 text-[17px] text-site-ink">
        {f.thanks}
      </p>
    );
  }
  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex min-h-12 items-center self-start rounded-full bg-site-action px-6 text-[17px] font-bold text-site-on-action hover:bg-site-action-hover"
      >
        {f.open}
      </button>
    );
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await signUpForDrive(fields);
      if (!result.ok) return setError(result.error);
      setDone(true);
    });
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4 rounded-xl border border-site-line bg-site-paper p-4 sm:p-5">
      <p className="text-[15px] text-site-ink-soft">{f.privacy}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className={labelClass}>
          {f.ownerName}
          <input className={inputClass} value={fields.ownerName} maxLength={120} autoComplete="name" required
            onChange={(e) => set("ownerName", e.target.value)} />
        </label>
        <label className={labelClass}>
          {f.ownerPhone}
          <input className={inputClass} value={fields.ownerPhone} maxLength={40} type="tel" autoComplete="tel"
            onChange={(e) => set("ownerPhone", e.target.value)} />
        </label>
        <label className={labelClass}>
          {f.ownerEmail}
          <input className={inputClass} value={fields.ownerEmail} maxLength={200} type="email" autoComplete="email"
            onChange={(e) => set("ownerEmail", e.target.value)} />
        </label>
        <p className="self-end pb-2 text-sm text-site-ink-soft">{f.contactHint}</p>
        <label className={labelClass}>
          {f.petName}
          <input className={inputClass} value={fields.petName} maxLength={80} required
            onChange={(e) => set("petName", e.target.value)} />
        </label>
        <label className={labelClass}>
          {f.petSpecies}
          <select className={inputClass} value={fields.petSpecies} required
            onChange={(e) => set("petSpecies", e.target.value)}>
            <option value="" disabled>{f.choose}</option>
            {DRIVE_SPECIES.filter((s) => species.includes(s)).map((s) => (
              <option key={s} value={s}>{t.desexing.species[s]}</option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          {f.petSex}
          <select className={inputClass} value={fields.petSex} onChange={(e) => set("petSex", e.target.value)}>
            {PET_SEXES.map((s) => (
              <option key={s} value={s}>{f.sex[s]}</option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          {f.petAge}
          <input className={inputClass} value={fields.petAgeNote} maxLength={80}
            onChange={(e) => set("petAgeNote", e.target.value)} />
        </label>
      </div>
      <label className={labelClass}>
        {f.notes}
        <textarea className={`${inputClass} min-h-24`} value={fields.notes} maxLength={1000}
          onChange={(e) => set("notes", e.target.value)} />
      </label>
      {error && (
        <p role="alert" className="rounded-lg border border-site-line bg-site-sand p-3 text-[15px] font-semibold text-site-ink">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={pending}
          className="flex min-h-12 items-center rounded-full bg-site-action px-6 text-[17px] font-bold text-site-on-action hover:bg-site-action-hover disabled:opacity-60"
        >
          {pending ? f.sending : f.submit}
        </button>
        <button type="button" onClick={() => setOpen(false)} disabled={pending}
          className="flex min-h-12 items-center px-4 text-[17px] font-semibold text-site-ink-muted underline underline-offset-4">
          {t.common.cancel}
        </button>
      </div>
    </form>
  );
}
