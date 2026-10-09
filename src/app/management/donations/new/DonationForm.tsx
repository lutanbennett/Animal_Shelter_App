"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { ResidentPicker, type ResidentOption } from "@/components/ResidentPicker";
import { formatBaht } from "@/lib/format";
import {
  DONATION_DESIGNATIONS,
  DONATION_METHODS,
  MAX_DONATION_LINES,
  parseBaht,
  type DonationFields,
} from "@/lib/donations/donations";
import { RECEIPT_COUNTRIES } from "@/lib/donations/issuer";
import { recordDonation } from "../actions";

export type DonorContact = { id: string; name: string; email: string | null; phone: string | null; line_id: string | null };

const inputClass =
  "w-full rounded border border-border bg-background px-3 py-2 text-base text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40 sm:text-sm";
const labelClass = "text-sm font-medium text-muted";

/**
 * The donation form. One column on a phone. Description lines are added and
 * removed in place; an in-kind gift hides the amounts, because its lines
 * describe goods rather than price them (checkDonation refuses a mix).
 */
export function DonationForm({ contacts, residents, today }: { contacts: DonorContact[]; residents: ResidentOption[]; today: string }) {
  const { t, locale } = useI18n();
  const f = t.donations.form;
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<DonationFields>({
    receivedOn: today,
    donorName: "",
    contactId: "",
    donorEmail: "",
    donorPhone: "",
    donorLine: "",
    method: "bank_transfer",
    designation: "general",
    designationResidentId: "",
    designationNote: "",
    note: "",
    country: "TH",
    lines: [{ description: "", amount: "" }],
  });

  const set = <K extends keyof DonationFields>(key: K, value: DonationFields[K]) => setFields((p) => ({ ...p, [key]: value }));
  const setLine = (i: number, key: "description" | "amount", value: string) =>
    setFields((p) => ({ ...p, lines: p.lines.map((l, j) => (j === i ? { ...l, [key]: value } : l)) }));

  const inKind = fields.method === "in_kind";
  const total = fields.lines.reduce((s, l) => s + Math.round((parseBaht(l.amount) ?? 0) * 100), 0) / 100;

  function pickContact(id: string) {
    const c = contacts.find((x) => x.id === id);
    setFields((p) => ({
      ...p,
      contactId: id,
      donorName: c ? c.name : p.donorName,
      donorEmail: c?.email ?? (c ? "" : p.donorEmail),
      donorPhone: c?.phone ?? (c ? "" : p.donorPhone),
      donorLine: c?.line_id ?? (c ? "" : p.donorLine),
    }));
  }

  function save() {
    setError(null);
    const sent = inKind ? { ...fields, lines: fields.lines.map((l) => ({ ...l, amount: "" })) } : fields;
    startTransition(async () => {
      const result = await recordDonation(sent);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      const notice = result.savedToDrive ? "issued" : "notOnDrive";
      router.push(`/management/donations/${result.donationId}?receipt=${result.receiptId}&notice=${notice}`);
    });
  }

  return (
    <form
      className="flex max-w-2xl flex-col gap-6"
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <fieldset className="flex flex-col gap-3 rounded border border-border bg-surface p-4">
        <legend className="px-1 text-base font-semibold text-foreground">{f.donor}</legend>
        {contacts.length > 0 && (
          <div className="flex flex-col gap-1">
            <label htmlFor="dn-contact" className={labelClass}>{f.contact}</label>
            <select id="dn-contact" value={fields.contactId} onChange={(e) => pickContact(e.target.value)} className={inputClass}>
              <option value="">{f.contactNone}</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <span className="text-xs text-muted">{f.contactHint}</span>
          </div>
        )}
        <div className="flex flex-col gap-1">
          <label htmlFor="dn-name" className={labelClass}>{f.donorName}</label>
          <input id="dn-name" required value={fields.donorName} onChange={(e) => set("donorName", e.target.value)} className={inputClass} lang="und" />
          <span className="text-xs text-muted">{f.donorNameHint}</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="flex flex-col gap-1">
            <label htmlFor="dn-email" className={labelClass}>{f.email}</label>
            <input id="dn-email" type="email" inputMode="email" value={fields.donorEmail} onChange={(e) => set("donorEmail", e.target.value)} className={inputClass} />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="dn-phone" className={labelClass}>{f.phone}</label>
            <input id="dn-phone" type="tel" value={fields.donorPhone} onChange={(e) => set("donorPhone", e.target.value)} className={inputClass} />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="dn-line" className={labelClass}>{f.line}</label>
            <input id="dn-line" value={fields.donorLine} onChange={(e) => set("donorLine", e.target.value)} className={inputClass} />
          </div>
        </div>
        <span className="text-xs text-muted">{f.reachHint}</span>
      </fieldset>

      <fieldset className="flex flex-col gap-3 rounded border border-border bg-surface p-4">
        <legend className="px-1 text-base font-semibold text-foreground">{f.gift}</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label htmlFor="dn-date" className={labelClass}>{f.receivedOn}</label>
            <input id="dn-date" type="date" required max={today} value={fields.receivedOn} onChange={(e) => set("receivedOn", e.target.value)} className={inputClass} />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="dn-method" className={labelClass}>{f.method}</label>
            <select id="dn-method" value={fields.method} onChange={(e) => set("method", e.target.value as DonationFields["method"])} className={inputClass}>
              {DONATION_METHODS.map((m) => (
                <option key={m} value={m}>{t.donations.methods[m]}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="dn-designation" className={labelClass}>{f.designation}</label>
          <select id="dn-designation" value={fields.designation} onChange={(e) => set("designation", e.target.value as DonationFields["designation"])} className={inputClass}>
            {DONATION_DESIGNATIONS.map((x) => (
              <option key={x} value={x}>{t.donations.designations[x]}</option>
            ))}
          </select>
        </div>
        {fields.designation === "resident" && (
          <div className="flex flex-col gap-1">
            <span className={labelClass}>{f.resident}</span>
            <ResidentPicker
              single
              residents={residents}
              selectedIds={fields.designationResidentId ? [fields.designationResidentId] : []}
              onChange={(ids) => set("designationResidentId", ids[0] ?? "")}
              triggerLabel={f.residentPick}
            />
          </div>
        )}
        {(fields.designation === "project" || fields.designation === "appeal") && (
          <div className="flex flex-col gap-1">
            <label htmlFor="dn-designation-note" className={labelClass}>{f.designationNote}</label>
            <input id="dn-designation-note" value={fields.designationNote} onChange={(e) => set("designationNote", e.target.value)} className={inputClass} />
          </div>
        )}
      </fieldset>

      <fieldset className="flex flex-col gap-3 rounded border border-border bg-surface p-4">
        <legend className="px-1 text-base font-semibold text-foreground">{f.lines}</legend>
        <span className="text-xs text-muted">{inKind ? f.linesHintInKind : f.linesHint}</span>
        {fields.lines.map((line, i) => (
          <div key={i} className="flex flex-col gap-2 border-b border-border pb-3 last:border-b-0 sm:flex-row sm:items-end">
            <div className="flex flex-1 flex-col gap-1">
              <label htmlFor={`dn-desc-${i}`} className={labelClass}>{`${f.description} ${i + 1}`}</label>
              <textarea id={`dn-desc-${i}`} rows={2} value={line.description} onChange={(e) => setLine(i, "description", e.target.value)} className={inputClass} lang="und" />
            </div>
            {!inKind && (
              <div className="flex flex-col gap-1 sm:w-36">
                <label htmlFor={`dn-amount-${i}`} className={labelClass}>{f.amount}</label>
                <input id={`dn-amount-${i}`} inputMode="decimal" value={line.amount} onChange={(e) => setLine(i, "amount", e.target.value)} className={`${inputClass} text-right`} />
              </div>
            )}
            {fields.lines.length > 1 && (
              <button
                type="button"
                onClick={() => setFields((p) => ({ ...p, lines: p.lines.filter((_, j) => j !== i) }))}
                className="min-h-11 self-start rounded border border-border px-3 text-sm text-danger hover:bg-surface-hover sm:self-end"
              >
                {f.removeLine}
              </button>
            )}
          </div>
        ))}
        {fields.lines.length < MAX_DONATION_LINES && (
          <button
            type="button"
            onClick={() => setFields((p) => ({ ...p, lines: [...p.lines, { description: "", amount: "" }] }))}
            className="min-h-11 self-start rounded border border-border px-4 text-sm text-foreground hover:bg-surface-hover"
          >
            {f.addLine}
          </button>
        )}
        {!inKind && (
          <p className="text-right text-base font-semibold text-foreground">
            {f.total}: {formatBaht(total, locale)}
          </p>
        )}
      </fieldset>

      <fieldset className="flex flex-col gap-3 rounded border border-border bg-surface p-4">
        <legend className="px-1 text-base font-semibold text-foreground">{f.country}</legend>
        <div className="flex flex-wrap gap-4">
          {RECEIPT_COUNTRIES.map((c) => (
            <label key={c} className="flex min-h-11 items-center gap-2 text-sm text-foreground">
              <input type="radio" name="dn-country" value={c} checked={fields.country === c} onChange={() => set("country", c)} />
              {t.donations.countries[c]}
            </label>
          ))}
        </div>
        <span className="text-xs text-muted">{f.countryHint}</span>
        <div className="flex flex-col gap-1">
          <label htmlFor="dn-note" className={labelClass}>{f.note}</label>
          <textarea id="dn-note" rows={2} value={fields.note} onChange={(e) => set("note", e.target.value)} className={inputClass} />
        </div>
      </fieldset>

      {error && (
        <p role="alert" className="rounded border border-danger bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="min-h-11 self-start rounded bg-primary px-5 text-base font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-60"
      >
        {pending ? f.saving : f.save}
      </button>
    </form>
  );
}
