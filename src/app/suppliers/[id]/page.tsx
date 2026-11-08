import Link from "next/link";
import { notFound } from "next/navigation";
import { ArchiveSupplierControl } from "@/components/ArchiveSupplierControl";
import { ArchivedBadge } from "@/components/ArchivedBadge";
import { ContactActions } from "@/components/ContactActions";
import { contactMapSource, isArchived } from "@/lib/contacts/contacts";
import { addressMap } from "@/lib/contacts/map-preview";
import { formatDate } from "@/lib/format";
import { getT } from "@/lib/i18n/get-t";
import { can } from "@/lib/permissions/can";
import { requirePermission } from "@/lib/permissions/require";
import { SHELTER_FRIEND_COLUMNS, type ShelterFriend } from "@/lib/shelter-friends/friends";
import { SUPPLIER_COLUMNS, type Supplier } from "@/lib/suppliers/suppliers";
import { loadTranslations, translationKey } from "@/lib/translations/queries";
import { ShelterFriendCard } from "@/app/contacts/[id]/ShelterFriendCard";

/**
 * A supplier's own page (0338): the link the translation queue and the Suppliers list use. Read opens it
 * (suppliers.directory at read). Archive and Restore are drawn only when the login holds suppliers.directory at edit, the
 * activity archiveSupplier and restoreSupplier ask; the Shelter Friend card's controls only with friends.manage, the one
 * its actions ask. Editing the details is on the list (Management → Suppliers), which asks edit.
 */
export default async function SupplierPage(props: PageProps<"/suppliers/[id]">) {
  const { id } = await props.params;
  const { supabase, perms } = await requirePermission("suppliers.directory", "read");
  const { t, locale } = await getT();
  const s = t.management.suppliers;
  const a = t.contacts.archive;

  const [supplierResult, friendResult] = await Promise.all([
    supabase.from("suppliers").select(SUPPLIER_COLUMNS).eq("id", id).limit(1).returns<Supplier[]>(),
    // Its Shelter Friend profile, if any (0336); friends.view or friends.manage reads it (0155).
    supabase.from("shelter_friends").select(SHELTER_FRIEND_COLUMNS).eq("supplier_id", id).limit(1).returns<ShelterFriend[]>(),
  ]);
  // A query error must not look like a missing supplier.
  if (supplierResult.error) throw new Error(supplierResult.error.message);
  const supplier = supplierResult.data?.[0];
  if (!supplier) notFound();
  if (friendResult.error) throw new Error(friendResult.error.message);
  const friend = friendResult.data?.[0] ?? null;

  const [map, translations] = await Promise.all([
    addressMap(contactMapSource(supplier)),
    loadTranslations(supabase, "shelter_friends", friend ? [friend.id] : []),
  ]);
  const friendTranslation = (column: string) => (friend ? translations.get(translationKey(friend.id, column)) : undefined);
  const archived = isArchived(supplier);
  const canEdit = can(perms, "suppliers.directory", "edit");

  return (
    <main className="flex min-w-0 flex-1 flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-col gap-1">
        {canEdit && (
          <Link href="/management/suppliers" className="text-sm text-primary hover:underline">
            {s.backToList}
          </Link>
        )}
        <h1 className="flex flex-wrap items-center gap-2 text-2xl font-semibold text-foreground">
          {supplier.name}
          {archived && <ArchivedBadge label={a.badge} />}
        </h1>
        <p className="text-sm text-muted">{s.pageIntro}</p>
        {archived && (
          <p className="text-sm text-muted">
            {a.archivedOn(formatDate(supplier.archived_at, locale))}
            {supplier.archive_reason ? ` · ${a.reason(supplier.archive_reason)}` : ""}
          </p>
        )}
      </div>

      <ContactActions contact={supplier} size="lg" mapLink={map?.href ?? null} />

      {supplier.notes && (
        <div className="flex flex-col gap-1 text-sm">
          <span className="text-xs text-muted">{t.management.contacts.createForm.notes}</span>
          <p className="whitespace-pre-line text-foreground">{supplier.notes}</p>
        </div>
      )}

      {canEdit && (
        <div>
          <ArchiveSupplierControl supplier={supplier} />
        </div>
      )}

      <ShelterFriendCard
        contact={supplier}
        kind="supplier"
        friend={friend}
        canManage={can(perms, "friends.manage")}
        map={map}
        translations={{
          blurb: friendTranslation("blurb"),
          help_kind: friendTranslation("help_kind"),
          discount_note: friendTranslation("discount_note"),
        }}
      />
    </main>
  );
}
