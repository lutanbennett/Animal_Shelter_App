"use client";

import { useActionState } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { contactTypeLabel } from "@/lib/i18n/enum-labels";
import { CARER_CONTACT_TYPE, CONTACT_TYPES } from "@/lib/contacts/contacts";
import { createContact } from "./actions";

const inputClass =
  "rounded border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40";

export function CreateContactForm() {
  const [state, formAction, pending] = useActionState(createContact, undefined);
  const { t } = useI18n();
  const f = t.management.contacts.createForm;

  return (
    <form
      action={formAction}
      className="flex flex-wrap items-end gap-3 rounded border border-border bg-surface p-4"
    >
      <div className="flex flex-col gap-1">
        <label htmlFor="name" className="text-sm font-medium text-muted">
          {f.name}
        </label>
        <input
          id="name"
          name="name"
          required
          placeholder={f.namePlaceholder}
          className={`${inputClass} w-48`}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="type" className="text-sm font-medium text-muted">
          {f.type}
        </label>
        <select
          id="type"
          name="type"
          required
          defaultValue={CARER_CONTACT_TYPE}
          className={`${inputClass} w-36`}
        >
          {CONTACT_TYPES.map((type) => (
            <option key={type} value={type}>
              {contactTypeLabel(t, type)}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="phone" className="text-sm font-medium text-muted">
          {f.phone}
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          placeholder={f.phonePlaceholder}
          className={`${inputClass} w-40`}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm font-medium text-muted">
          {f.email}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          placeholder={f.emailPlaceholder}
          className={`${inputClass} w-52`}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="lineId" className="text-sm font-medium text-muted">
          {f.lineId}
        </label>
        <input
          id="lineId"
          name="lineId"
          placeholder={f.lineIdPlaceholder}
          className={`${inputClass} w-36`}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="messengerId" className="text-sm font-medium text-muted">
          {f.messenger}
        </label>
        <input
          id="messengerId"
          name="messengerId"
          placeholder={f.messengerPlaceholder}
          className={`${inputClass} w-40`}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="whatsapp" className="text-sm font-medium text-muted">
          {f.whatsapp}
        </label>
        <input
          id="whatsapp"
          name="whatsapp"
          type="tel"
          placeholder={f.whatsappPlaceholder}
          className={`${inputClass} w-44`}
        />
        <span className="text-xs text-muted">{f.whatsappHint}</span>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="address" className="text-sm font-medium text-muted">
          {f.address}
        </label>
        <input
          id="address"
          name="address"
          placeholder={f.addressPlaceholder}
          className={`${inputClass} w-72`}
        />
        <span className="text-xs text-muted">{f.addressHint}</span>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="notes" className="text-sm font-medium text-muted">
          {f.notes}
        </label>
        <input
          id="notes"
          name="notes"
          placeholder={f.notesPlaceholder}
          className={`${inputClass} w-72`}
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
      >
        {pending ? t.common.creating : f.addButton}
      </button>
      {state && "error" in state && (
        <p className="w-full text-sm text-danger">{state.error}</p>
      )}
      {state && "success" in state && (
        <p className="w-full text-sm text-success">{state.success}</p>
      )}
    </form>
  );
}
