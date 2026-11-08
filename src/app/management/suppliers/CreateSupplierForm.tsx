"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useWriteForm } from "@/lib/use-write-form";
import { ACTION_ICONS } from "@/components/hub-icons";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { createSupplier } from "./actions";

const inputClass =
  "rounded border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40";

/**
 * Add a supplier. Rendered only on /management/suppliers/new, whose page asks suppliers.directory at edit; createSupplier asks
 * the same. A saved supplier returns to the list with "Added: <name>" shown.
 */
export function CreateSupplierForm({ listHref }: { listHref: string }) {
  const [state, onSubmit, pending] = useWriteForm(createSupplier, undefined);
  const { t } = useI18n();
  const router = useRouter();
  const f = t.management.contacts.createForm;
  const s = t.management.suppliers.createForm;

  useEffect(() => {
    if (state?.ok) router.push(`${listHref}?added=${encodeURIComponent(state.name ?? "")}`);
  }, [listHref, state, router]);

  const field = (id: string, label: string, width: string, extra: { type?: string; placeholder?: string; hint?: string; required?: boolean; inputMode?: "url" } = {}) => (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-muted">
        {label}
      </label>
      <input id={id} name={id} type={extra.type} inputMode={extra.inputMode} required={extra.required} placeholder={extra.placeholder} className={`${inputClass} ${width}`} />
      {extra.hint && <span className="text-xs text-muted">{extra.hint}</span>}
    </div>
  );

  return (
    <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-3 rounded border border-border bg-surface p-4">
      {field("name", f.name, "w-56", { required: true, placeholder: s.namePlaceholder })}
      {field("phone", f.phone, "w-40", { type: "tel", placeholder: f.phonePlaceholder })}
      {field("email", f.email, "w-52", { type: "email", placeholder: f.emailPlaceholder })}
      {field("lineId", f.lineId, "w-36", { placeholder: f.lineIdPlaceholder })}
      {field("messengerId", f.messenger, "w-40", { placeholder: f.messengerPlaceholder })}
      {field("whatsapp", f.whatsapp, "w-44", { type: "tel", placeholder: f.whatsappPlaceholder, hint: f.whatsappHint })}
      {field("address", f.address, "w-72", { placeholder: f.addressPlaceholder, hint: f.addressHint })}
      {field("mapUrl", f.mapUrl, "w-72", { inputMode: "url", placeholder: f.mapUrlPlaceholder, hint: f.mapUrlHint })}
      {field("notes", f.notes, "w-72", { placeholder: s.notesPlaceholder })}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-11 items-center gap-2 rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50 md:min-h-0"
      >
        <ACTION_ICONS.add aria-hidden="true" className="h-4 w-4" />
        {pending ? t.common.creating : s.addButton}
      </button>
      <Link
        href={listHref}
        className="inline-flex min-h-11 items-center rounded border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-hover md:min-h-0"
      >
        {t.common.cancel}
      </Link>
      {state && !state.ok && <p className="w-full text-sm text-danger">{state.error}</p>}
      {state?.ok && <p className="w-full text-sm text-success">{state.success}</p>}
    </form>
  );
}
