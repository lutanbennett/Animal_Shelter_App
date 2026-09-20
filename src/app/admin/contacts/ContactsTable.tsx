"use client";

import { Fragment, useState, useTransition } from "react";
import Link from "next/link";
import { deleteContact, updateContact } from "./actions";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { contactTypeLabel } from "@/lib/i18n/enum-labels";
import {
  CARER_CONTACT_TYPE,
  CONTACT_TYPES,
  type Contact,
  type ContactType,
} from "@/lib/contacts/contacts";

export type ContactRow = Contact & {
  /** placement_history rows as carer, any status — locks type and delete. */
  placement_count: number;
  /** Of those, still open: residents living with this carer now. */
  in_care_count: number;
  /** Maintenance jobs assigned to them — blocks delete. */
  maintenance_count: number;
};

const inputClass =
  "w-full rounded border border-border bg-background px-2 py-1 text-sm text-foreground outline-none focus:border-primary";

function ContactRowItem({ contact }: { contact: ContactRow }) {
  const { t } = useI18n();
  const c = t.admin.contacts;
  const [name, setName] = useState(contact.name);
  const [type, setType] = useState<ContactType>(contact.type);
  const [phone, setPhone] = useState(contact.phone ?? "");
  const [email, setEmail] = useState(contact.email ?? "");
  const [lineId, setLineId] = useState(contact.line_id ?? "");
  const [messengerId, setMessengerId] = useState(contact.messenger_id ?? "");
  const [whatsapp, setWhatsapp] = useState(contact.whatsapp ?? "");
  const [address, setAddress] = useState(contact.address ?? "");
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState<
    { type: "error" | "success"; text: string } | null
  >(null);
  const [isPending, startTransition] = useTransition();

  // Mirrors the server-side rules so the controls explain themselves
  // instead of failing on save.
  const typeLocked = contact.placement_count > 0;
  const deleteBlocker =
    contact.placement_count > 0
      ? c.errors.hasPlacements(contact.placement_count)
      : contact.maintenance_count > 0
        ? c.errors.hasMaintenance(contact.maintenance_count)
        : null;

  const messaging = [
    { label: c.createForm.lineId, value: contact.line_id },
    { label: c.createForm.messenger, value: contact.messenger_id },
    { label: c.createForm.whatsapp, value: contact.whatsapp },
  ].filter((m) => m.value);

  function reset() {
    setName(contact.name);
    setType(contact.type);
    setPhone(contact.phone ?? "");
    setEmail(contact.email ?? "");
    setLineId(contact.line_id ?? "");
    setMessengerId(contact.messenger_id ?? "");
    setWhatsapp(contact.whatsapp ?? "");
    setAddress(contact.address ?? "");
  }

  function handleSave() {
    setMessage(null);
    startTransition(async () => {
      try {
        await updateContact(contact.id, {
          name,
          type,
          phone,
          email,
          lineId,
          messengerId,
          whatsapp,
          address,
        });
        setEditing(false);
        setMessage({ type: "success", text: t.common.saved });
      } catch (err) {
        setMessage({
          type: "error",
          text: err instanceof Error ? err.message : t.common.failedToSave,
        });
      }
    });
  }

  function handleDelete() {
    if (!window.confirm(c.deleteConfirm(contact.name))) return;
    setMessage(null);
    startTransition(async () => {
      try {
        await deleteContact(contact.id);
      } catch (err) {
        setMessage({
          type: "error",
          text: err instanceof Error ? err.message : t.common.failedToDelete,
        });
      }
    });
  }

  return (
    <Fragment>
      <tr className="align-top hover:bg-surface-hover">
        <td className="px-4 py-2">
          {editing ? (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`${inputClass} min-w-36`}
            />
          ) : (
            <Link
              href={`/contacts/${contact.id}`}
              className="font-medium text-foreground hover:underline"
            >
              {contact.name}
            </Link>
          )}
        </td>
        <td className="px-4 py-2">
          {editing ? (
            <select
              value={type}
              disabled={typeLocked}
              title={
                typeLocked
                  ? c.errors.typeLockedByPlacements(contact.placement_count)
                  : undefined
              }
              onChange={(e) => setType(e.target.value as ContactType)}
              className={`${inputClass} min-w-28 disabled:cursor-not-allowed disabled:opacity-60`}
            >
              {CONTACT_TYPES.map((option) => (
                <option key={option} value={option}>
                  {contactTypeLabel(t, option)}
                </option>
              ))}
            </select>
          ) : (
            <span
              className={`inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${
                contact.type === CARER_CONTACT_TYPE
                  ? "bg-success/15 text-success"
                  : "bg-surface-hover text-muted"
              }`}
            >
              {contactTypeLabel(t, contact.type)}
            </span>
          )}
        </td>
        <td className="px-4 py-2">
          {editing ? (
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={c.createForm.phonePlaceholder}
              className={`${inputClass} min-w-32`}
            />
          ) : (
            <span className="whitespace-nowrap text-muted">
              {contact.phone ?? t.common.dash}
            </span>
          )}
        </td>
        <td className="px-4 py-2">
          {editing ? (
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={c.createForm.emailPlaceholder}
              className={`${inputClass} min-w-40`}
            />
          ) : (
            <span className="break-all text-muted">{contact.email ?? t.common.dash}</span>
          )}
        </td>
        <td className="px-4 py-2">
          {editing ? (
            <div className="flex min-w-40 flex-col gap-1">
              <input
                value={lineId}
                onChange={(e) => setLineId(e.target.value)}
                placeholder={c.createForm.lineId}
                aria-label={c.createForm.lineId}
                className={inputClass}
              />
              <input
                value={messengerId}
                onChange={(e) => setMessengerId(e.target.value)}
                placeholder={c.createForm.messenger}
                aria-label={c.createForm.messenger}
                className={inputClass}
              />
              <input
                type="tel"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder={c.createForm.whatsapp}
                aria-label={c.createForm.whatsapp}
                className={inputClass}
              />
            </div>
          ) : (
            <dl className="flex flex-col gap-0.5 text-xs text-muted">
              {messaging.length > 0
                ? messaging.map((m) => (
                    <div key={m.label} className="flex gap-1 whitespace-nowrap">
                      <dt>{m.label}:</dt>
                      <dd className="text-foreground">{m.value}</dd>
                    </div>
                  ))
                : t.common.dash}
            </dl>
          )}
        </td>
        <td className="px-4 py-2">
          {editing ? (
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder={c.createForm.addressPlaceholder}
              rows={2}
              className={`${inputClass} min-w-48`}
            />
          ) : (
            <span className="line-clamp-2 max-w-xs whitespace-pre-line text-muted">
              {contact.address ?? t.common.dash}
            </span>
          )}
        </td>
        <td className="px-4 py-2 text-muted">
          {contact.type === CARER_CONTACT_TYPE || contact.placement_count > 0 ? (
            <Link
              href={`/contacts/${contact.id}`}
              className="flex flex-col whitespace-nowrap hover:underline"
            >
              <span className={contact.in_care_count > 0 ? "text-success" : undefined}>
                {c.table.inCare(contact.in_care_count)}
              </span>
              <span className="text-xs">
                {c.table.placementCount(contact.placement_count)}
              </span>
            </Link>
          ) : (
            t.common.dash
          )}
        </td>
        <td className="px-4 py-2">
          <div className="flex items-center gap-2">
            {editing ? (
              <>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={handleSave}
                  className="rounded bg-primary px-2 py-1 text-xs font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
                >
                  {t.common.save}
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => {
                    setEditing(false);
                    reset();
                  }}
                  className="rounded border border-border px-2 py-1 text-xs font-medium text-muted hover:bg-surface-hover"
                >
                  {t.common.cancel}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="rounded border border-border px-2 py-1 text-xs font-medium text-muted hover:bg-surface-hover hover:text-foreground"
              >
                {t.common.edit}
              </button>
            )}
            <button
              type="button"
              disabled={isPending || deleteBlocker !== null}
              title={deleteBlocker ?? undefined}
              onClick={handleDelete}
              className="rounded border border-danger/40 px-2 py-1 text-xs font-medium text-danger hover:bg-danger/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t.common.delete}
            </button>
          </div>
        </td>
      </tr>
      {message && (
        <tr>
          <td
            colSpan={8}
            className={`px-4 pb-2 text-xs ${
              message.type === "error" ? "text-danger" : "text-success"
            }`}
          >
            {message.text}
          </td>
        </tr>
      )}
    </Fragment>
  );
}

export function ContactsTable({ contacts }: { contacts: ContactRow[] }) {
  const { t } = useI18n();
  const h = t.admin.contacts.table;

  return (
    <div className="overflow-x-auto rounded border border-border">
      <table className="w-full text-left text-sm">
        <thead className="bg-surface text-muted">
          <tr>
            <th className="px-4 py-2 font-medium">{h.name}</th>
            <th className="px-4 py-2 font-medium">{h.type}</th>
            <th className="px-4 py-2 font-medium">{h.phone}</th>
            <th className="px-4 py-2 font-medium">{h.email}</th>
            <th className="px-4 py-2 font-medium">{h.messaging}</th>
            <th className="px-4 py-2 font-medium">{h.address}</th>
            <th className="px-4 py-2 font-medium">{h.residents}</th>
            <th className="px-4 py-2 font-medium" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {contacts.map((contact) => (
            <ContactRowItem key={contact.id} contact={contact} />
          ))}
          {contacts.length === 0 && (
            <tr>
              <td colSpan={8} className="px-4 py-6 text-center text-muted">
                {h.noContacts}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
