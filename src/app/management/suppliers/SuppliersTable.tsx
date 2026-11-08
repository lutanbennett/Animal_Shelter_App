"use client";

import { Fragment, useState, useTransition } from "react";
import Link from "next/link";
import { ContactActions } from "@/components/ContactActions";
import { ActionButton } from "@/components/ActionButton";
import { ArchiveSupplierControl } from "@/components/ArchiveSupplierControl";
import { ArchivedBadge } from "@/components/ArchivedBadge";
import { FriendBadge } from "@/components/FriendBadge";
import { ACTION_ICONS } from "@/components/hub-icons";
import { RowActionButton } from "@/components/RowAction";
import { formatDate } from "@/lib/format";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useWriteCall } from "@/lib/use-write-form";
import { addressText, contactAddressFields, isArchived } from "@/lib/contacts/contacts";
import { supplierHref, type Supplier } from "@/lib/suppliers/suppliers";
import { updateSupplier } from "./actions";

export type SupplierRow = Supplier & {
  /** Shelter Friend profile (0336): null when there is none, else whether it is published. */
  friend_published: boolean | null;
};

/** The two boxes as they open for editing (a link at the front of the address opens already split, as for contacts). */
function placeFields(supplier: Supplier) {
  const split = contactAddressFields(supplier.address, supplier.map_url);
  return split.ok
    ? { address: split.address ?? "", mapUrl: split.map_url ?? "" }
    : { address: supplier.address ?? "", mapUrl: supplier.map_url ?? "" };
}

const inputClass =
  "w-full rounded border border-border bg-background px-2 py-1 text-sm text-foreground outline-none focus:border-primary";

function SupplierRowItem({ supplier, canEdit }: { supplier: SupplierRow; canEdit: boolean }) {
  const { t, locale } = useI18n();
  const c = t.management.contacts;
  const a = t.contacts.archive;
  const archived = isArchived(supplier);
  const [name, setName] = useState(supplier.name);
  // One per action: a request id kept from an unknown save must never reach another action.
  const updateCall = useWriteCall();
  const [phone, setPhone] = useState(supplier.phone ?? "");
  const [email, setEmail] = useState(supplier.email ?? "");
  const [lineId, setLineId] = useState(supplier.line_id ?? "");
  const [messengerId, setMessengerId] = useState(supplier.messenger_id ?? "");
  const [whatsapp, setWhatsapp] = useState(supplier.whatsapp ?? "");
  const [address, setAddress] = useState(() => placeFields(supplier).address);
  const [mapUrl, setMapUrl] = useState(() => placeFields(supplier).mapUrl);
  const [notes, setNotes] = useState(supplier.notes ?? "");
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function reset() {
    setName(supplier.name);
    setPhone(supplier.phone ?? "");
    setEmail(supplier.email ?? "");
    setLineId(supplier.line_id ?? "");
    setMessengerId(supplier.messenger_id ?? "");
    setWhatsapp(supplier.whatsapp ?? "");
    const place = placeFields(supplier);
    setAddress(place.address);
    setMapUrl(place.mapUrl);
    setNotes(supplier.notes ?? "");
  }

  function handleSave() {
    setMessage(null);
    startTransition(async () => {
      const result = await updateCall((requestId) =>
        updateSupplier(supplier.id, { name, phone, email, lineId, messengerId, whatsapp, address, mapUrl, notes }, requestId),
      );
      if (!result.ok) {
        setMessage({ type: "error", text: result.error });
        return;
      }
      setEditing(false);
      setMessage({ type: "success", text: t.common.saved });
    });
  }

  return (
    <Fragment>
      <tr className={`align-top hover:bg-surface-hover ${archived && !editing ? "bg-surface/60" : ""}`}>
        <td className="px-4 py-2">
          {editing ? (
            <input value={name} onChange={(e) => setName(e.target.value)} className={`${inputClass} min-w-36`} />
          ) : (
            <div className="flex flex-col gap-1">
              <Link href={supplierHref(supplier.id)} className={`font-medium hover:underline ${archived ? "text-muted" : "text-foreground"}`}>
                {supplier.name}
              </Link>
              {supplier.friend_published !== null && (
                <FriendBadge
                  label={t.shelterFriends.badge}
                  published={supplier.friend_published && !archived}
                  title={
                    supplier.friend_published && !archived
                      ? t.shelterFriends.card.onWebsite
                      : archived
                        ? t.shelterFriends.card.notOnWebsite
                        : t.shelterFriends.card.draft
                  }
                />
              )}
              {archived && (
                <>
                  <ArchivedBadge label={a.badge} />
                  <span className="text-xs text-muted">{a.archivedOn(formatDate(supplier.archived_at, locale))}</span>
                  {supplier.archive_reason && (
                    <span className="max-w-48 whitespace-pre-line text-xs text-muted">{a.reason(supplier.archive_reason)}</span>
                  )}
                </>
              )}
            </div>
          )}
        </td>
        <td className="px-4 py-2">
          {editing ? (
            <div className="flex min-w-40 flex-col gap-1">
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={c.createForm.phonePlaceholder} aria-label={c.createForm.phone} className={inputClass} />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={c.createForm.emailPlaceholder} aria-label={c.createForm.email} className={inputClass} />
              <input value={lineId} onChange={(e) => setLineId(e.target.value)} placeholder={c.createForm.lineId} aria-label={c.createForm.lineId} className={inputClass} />
              <input value={messengerId} onChange={(e) => setMessengerId(e.target.value)} placeholder={c.createForm.messenger} aria-label={c.createForm.messenger} className={inputClass} />
              <input type="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder={c.createForm.whatsapp} aria-label={c.createForm.whatsapp} className={inputClass} />
            </div>
          ) : (
            <ContactActions contact={supplier} showMap={false} align="start" />
          )}
        </td>
        <td className="px-4 py-2">
          {editing ? (
            <div className="flex flex-col gap-1">
              <textarea value={address} onChange={(e) => setAddress(e.target.value)} aria-label={c.createForm.address} placeholder={c.createForm.addressPlaceholder} rows={2} className={`${inputClass} min-w-48`} />
              <span className="max-w-xs text-xs text-muted">{c.createForm.addressHint}</span>
              <label className="mt-1 text-xs font-medium text-muted" htmlFor={`map-url-${supplier.id}`}>
                {c.createForm.mapUrl}
              </label>
              <input id={`map-url-${supplier.id}`} inputMode="url" value={mapUrl} onChange={(e) => setMapUrl(e.target.value)} placeholder={c.createForm.mapUrlPlaceholder} className={`${inputClass} min-w-48`} />
              <span className="max-w-xs text-xs text-muted">{c.createForm.mapUrlHint}</span>
            </div>
          ) : (
            <div className="flex flex-col gap-0.5">
              <span className="line-clamp-2 max-w-xs whitespace-pre-line text-muted">{addressText(supplier.address) || t.common.dash}</span>
              {supplier.map_url && (
                <a href={supplier.map_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline-offset-2 hover:underline">
                  {c.createForm.mapUrl} ↗
                </a>
              )}
            </div>
          )}
        </td>
        <td className="px-4 py-2">
          {editing ? (
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t.management.suppliers.createForm.notesPlaceholder} rows={2} className={`${inputClass} min-w-48`} />
          ) : (
            <span className="line-clamp-2 max-w-xs whitespace-pre-line text-muted">{supplier.notes ?? t.common.dash}</span>
          )}
        </td>
        <td className="px-4 py-2">
          {/* Edit and Archive/Restore both ask suppliers.directory at edit (updateSupplier, archiveSupplier, restoreSupplier). */}
          {canEdit && (
            <div className="flex flex-wrap items-start gap-2">
              {editing ? (
                <>
                  <ActionButton icon={ACTION_ICONS.save} variant="primary" compact disabled={isPending} onClick={handleSave}>
                    {t.common.save}
                  </ActionButton>
                  <ActionButton
                    icon={ACTION_ICONS.clear}
                    compact
                    disabled={isPending}
                    onClick={() => {
                      setEditing(false);
                      reset();
                    }}
                  >
                    {t.common.cancel}
                  </ActionButton>
                </>
              ) : (
                <RowActionButton onClick={() => setEditing(true)} label={t.common.edit} subject={supplier.name} icon={ACTION_ICONS.edit} />
              )}
              {!editing && <ArchiveSupplierControl iconOnly supplier={supplier} />}
            </div>
          )}
        </td>
      </tr>
      {message && (
        <tr>
          <td colSpan={5} className={`px-4 pb-2 text-xs ${message.type === "error" ? "text-danger" : "text-success"}`}>
            {message.text}
          </td>
        </tr>
      )}
    </Fragment>
  );
}

export function SuppliersTable({ suppliers, canEdit = false }: { suppliers: SupplierRow[]; canEdit?: boolean }) {
  const { t } = useI18n();
  const h = t.management.suppliers.table;
  return (
    <div className="overflow-x-auto rounded border border-border">
      <table className="w-full text-left text-sm">
        <thead className="bg-surface text-muted">
          <tr>
            <th className="px-4 py-2 font-medium">{h.name}</th>
            <th className="px-4 py-2 font-medium">{h.contactDetails}</th>
            <th className="px-4 py-2 font-medium">{h.address}</th>
            <th className="px-4 py-2 font-medium">{h.notes}</th>
            <th className="px-4 py-2 font-medium" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {suppliers.map((supplier) => (
            <SupplierRowItem key={supplier.id} supplier={supplier} canEdit={canEdit} />
          ))}
          {suppliers.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-6 text-center text-muted">
                {h.noSuppliers}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
