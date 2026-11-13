"use client";

import { useState, useTransition } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { REPORT_KINDS, REPORT_SPECIES, type ReportFields } from "@/lib/animal-reports/form";
import { useWriteCall } from "@/lib/use-write-form";
import { reportAnAnimal } from "./actions";

const inputClass =
  "min-h-11 w-full rounded-lg border border-site-line bg-white px-3 py-2 text-base text-site-ink outline-none focus:border-site-action focus:ring-2 focus:ring-site-action/40";
const labelClass = "flex flex-col gap-1 text-[15px] font-semibold text-site-ink";

/** The report form. A success shows only a thank-you: nothing typed is shown back, and nothing is read (anon cannot read a report). */
export function ReportForm() {
  const { t } = useI18n();
  const f = t.animalReport.form;
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const write = useWriteCall();
  const [fields, setFields] = useState<ReportFields>({
    kind: "",
    species: "unknown",
    description: "",
    location: "",
    reporterName: "",
    reporterPhone: "",
    reporterEmail: "",
  });
  const set = <K extends keyof ReportFields>(key: K, value: ReportFields[K]) => setFields((p) => ({ ...p, [key]: value }));

  if (done) {
    return (
      <p role="status" className="rounded-xl border border-site-line bg-site-sand p-4 text-[17px] text-site-ink">
        {f.thanks}
      </p>
    );
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await write((requestId) => reportAnAnimal(fields, requestId));
      if (!result.ok) return setError(result.error);
      setDone(true);
    });
  }

  return (
    <form onSubmit={submit} className="flex max-w-3xl flex-col gap-4 rounded-xl border border-site-line bg-site-paper p-4 sm:p-5">
      <p className="text-[15px] text-site-ink-soft">{f.privacy}</p>
      <label className={labelClass}>
        {f.kind}
        <select className={inputClass} value={fields.kind} required onChange={(e) => set("kind", e.target.value)}>
          <option value="" disabled>{f.choose}</option>
          {REPORT_KINDS.map((k) => (
            <option key={k} value={k}>{t.animalReport.kinds[k]}</option>
          ))}
        </select>
      </label>
      <label className={labelClass}>
        {f.species}
        <select className={inputClass} value={fields.species} onChange={(e) => set("species", e.target.value)}>
          {REPORT_SPECIES.map((s) => (
            <option key={s} value={s}>{t.animalReport.species[s]}</option>
          ))}
        </select>
      </label>
      <label className={labelClass}>
        {f.description}
        <textarea className={`${inputClass} min-h-28`} value={fields.description} maxLength={2000} required
          onChange={(e) => set("description", e.target.value)} />
      </label>
      <label className={labelClass}>
        {f.location}
        <textarea className={`${inputClass} min-h-20`} value={fields.location} maxLength={500} required
          onChange={(e) => set("location", e.target.value)} />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className={labelClass}>
          {f.name}
          <input className={inputClass} value={fields.reporterName} maxLength={120} autoComplete="name"
            onChange={(e) => set("reporterName", e.target.value)} />
        </label>
        <label className={labelClass}>
          {f.phone}
          <input className={inputClass} value={fields.reporterPhone} maxLength={40} type="tel" autoComplete="tel"
            onChange={(e) => set("reporterPhone", e.target.value)} />
        </label>
        <label className={labelClass}>
          {f.email}
          <input className={inputClass} value={fields.reporterEmail} maxLength={200} type="email" autoComplete="email"
            onChange={(e) => set("reporterEmail", e.target.value)} />
        </label>
        <p className="self-end pb-2 text-sm text-site-ink-soft">{f.contactHint}</p>
      </div>
      {error && (
        <p role="alert" className="rounded-lg border border-site-line bg-site-sand p-3 text-[15px] font-semibold text-site-ink">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="flex min-h-12 items-center self-start rounded-full bg-site-action px-6 text-[17px] font-bold text-site-on-action hover:bg-site-action-hover disabled:opacity-60"
      >
        {pending ? f.sending : f.submit}
      </button>
    </form>
  );
}
