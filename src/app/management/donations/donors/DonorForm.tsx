"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useWriteCall } from "@/lib/use-write-form";
import type { SupporterFields } from "@/lib/donations/supporters";
import { createSupporter, setSupporterArchived, updateSupporter } from "./actions";

const inputClass =
  "min-h-11 w-full rounded border border-border bg-background px-3 py-2 text-base text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40 sm:text-sm";
const labelClass = "text-sm font-medium text-muted";

/** Add (no id) or edit (id) a donor; an existing one can also be archived or brought back. */
export function DonorForm({ id, initial, archived = false }: { id?: string; initial: SupporterFields; archived?: boolean }) {
  const { t } = useI18n();
  const f = t.donations.donors.form;
  const router = useRouter();
  const [fields, setFields] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();
  // One per action: a request id kept from an unknown save must never reach another action.
  const updateCall = useWriteCall();
  const createCall = useWriteCall();
  const archiveCall = useWriteCall();
  const set = (k: keyof SupporterFields, v: string) => setFields((p) => ({ ...p, [k]: v }));

  function save() {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      if (id) {
        const r = await updateCall((requestId) => updateSupporter(id, fields, requestId));
        if (!r.ok) return setError(r.error);
        setSaved(true);
        router.refresh();
      } else {
        const r = await createCall((requestId) => createSupporter(fields, requestId));
        if (!r.ok) return setError(r.error);
        router.push(`/management/donations/donors/${r.supporter.id}`);
      }
    });
  }

  function archive() {
    if (!id) return;
    setError(null);
    startTransition(async () => {
      const r = await archiveCall((requestId) => setSupporterArchived(id, !archived, requestId));
      if (!r.ok) return setError(r.error);
      router.refresh();
    });
  }

  return (
    <form
      className="flex max-w-2xl flex-col gap-3 rounded border border-border bg-surface p-4"
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <div className="flex flex-col gap-1">
        <label htmlFor="dr-name" className={labelClass}>{f.name}</label>
        <input id="dr-name" required value={fields.name} onChange={(e) => set("name", e.target.value)} className={inputClass} lang="und" />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="dr-email" className={labelClass}>{f.email}</label>
          <input id="dr-email" type="email" inputMode="email" value={fields.email} onChange={(e) => set("email", e.target.value)} className={inputClass} />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="dr-phone" className={labelClass}>{f.phone}</label>
          <input id="dr-phone" type="tel" value={fields.phone} onChange={(e) => set("phone", e.target.value)} className={inputClass} />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="dr-line" className={labelClass}>{f.line}</label>
          <input id="dr-line" value={fields.line} onChange={(e) => set("line", e.target.value)} className={inputClass} />
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="dr-note" className={labelClass}>{f.note}</label>
        <textarea id="dr-note" rows={2} value={fields.note} onChange={(e) => set("note", e.target.value)} className={inputClass} />
      </div>
      {error && (
        <p role="alert" className="rounded border border-danger bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>
      )}
      {saved && <p role="status" className="text-sm text-success">{f.saved}</p>}
      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={pending} className="min-h-11 rounded bg-primary px-5 text-base font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-60">
          {id ? f.save : f.add}
        </button>
        {id && (
          <button type="button" disabled={pending} onClick={archive} className="min-h-11 rounded border border-border px-4 text-sm text-foreground hover:bg-surface-hover disabled:opacity-60">
            {archived ? f.restore : f.archive}
          </button>
        )}
      </div>
      {id && !archived && <span className="text-xs text-muted">{f.archiveHint}</span>}
    </form>
  );
}
