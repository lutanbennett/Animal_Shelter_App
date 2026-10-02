import Link from "next/link";
import { canManage } from "@/lib/auth/require-management";
import { isShelterRole } from "@/lib/auth/app-access";
import { requireRole } from "@/lib/auth/require-role";
import { getT } from "@/lib/i18n/get-t";
import {
  CONTACT_COLUMNS,
  toVolunteerContact,
  type Contact,
  type VolunteerContact,
} from "@/lib/contacts/contacts";
import { ContactList, type ContactSummary } from "./ContactList";

export default async function ContactsPage(props: PageProps<"/contacts">) {
  const { t } = await getT();
  // Archived contacts are loaded either way — a search still finds them —
  // and ContactList hides them unless this is set.
  const showArchived = (await props.searchParams).archived === "1";
  const { supabase, role } = await requireRole(isShelterRole);

  // The list is open to every shelter role, but a volunteer reads only name
  // and phone (0126, volunteer_contacts) — a volunteer doing a foster pick-up
  // needs the carer's number, not their address or notes. Open placements
  // give each carer their "N in care" badge.
  const [contactsResult, placementsResult, roleResult, friendsResult] = await Promise.all([
    role === "volunteer"
      ? supabase
          .from("volunteer_contacts")
          .select("id, name, phone")
          .order("name")
          .returns<{ id: string; name: string; phone: string | null }[]>()
          .then((r) => ({
            ...r,
            data: r.data?.map(toVolunteerContact) as VolunteerContact[] | null,
          }))
      : supabase
          .from("contacts")
          .select(CONTACT_COLUMNS)
          .order("name")
          .returns<Contact[]>(),
    supabase
      .from("placement_history")
      .select("carer_id")
      .not("carer_id", "is", null)
      .is("end_date", null)
      .returns<{ carer_id: string }[]>(),
    supabase.rpc("current_user_role"),
    // Which contacts are Shelter Friends (0076), for the badge and the chip.
    // A failed query just means no badges, not a broken list.
    supabase
      .from("shelter_friends")
      .select("contact_id, published")
      .returns<{ contact_id: string; published: boolean }[]>(),
  ]);

  const inCare = new Map<string, number>();
  for (const row of placementsResult.data ?? []) {
    inCare.set(row.carer_id, (inCare.get(row.carer_id) ?? 0) + 1);
  }
  const friends = new Map(
    (friendsResult.data ?? []).map((row) => [row.contact_id, row.published]),
  );
  const contacts: ContactSummary[] = (contactsResult.data ?? []).map((contact) => ({
    ...contact,
    inCareCount: inCare.get(contact.id) ?? 0,
    friendPublished: friends.get(contact.id) ?? null,
  }));

  return (
    // min-w-0: the type-chip strip scrolls sideways on a phone, and without
    // it that strip's natural width would push this flex item wider than
    // the viewport instead of scrolling inside it.
    <main className="flex min-w-0 flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            {t.contacts.pageTitle}
          </h1>
          <p className="text-sm text-muted">{t.contacts.pageSubtitle}</p>
        </div>
        {canManage(roleResult.data) && (
          <Link
            href="/management/contacts"
            className="shrink-0 text-sm font-medium text-primary hover:underline"
          >
            {t.contacts.manageInAdmin}
          </Link>
        )}
      </div>

      {contactsResult.error && (
        <p className="text-sm text-danger">
          {t.contacts.couldntLoadContacts}: {contactsResult.error.message}
        </p>
      )}
      {placementsResult.error && (
        <p className="text-sm text-danger">
          {t.contacts.couldntLoadPlacements}: {placementsResult.error.message}
        </p>
      )}

      <ContactList contacts={contacts} initialShowArchived={showArchived} />
    </main>
  );
}
