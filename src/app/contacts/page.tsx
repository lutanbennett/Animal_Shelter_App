import Link from "next/link";
import { canManage } from "@/lib/auth/require-management";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { CONTACT_COLUMNS, type Contact } from "@/lib/contacts/contacts";
import { ContactList, type ContactSummary } from "./ContactList";

export default async function ContactsPage(props: PageProps<"/contacts">) {
  const { t } = await getT();
  // Archived contacts are loaded either way — a search still finds them —
  // and ContactList hides them unless this is set.
  const showArchived = (await props.searchParams).archived === "1";
  const supabase = await createClient();

  // Every signed-in role can read contacts and placement_history (0001),
  // so the list is open to all — a volunteer doing a foster pick-up needs
  // the carer's number as much as staff do. Open placements give each
  // carer their "N in care" badge.
  const [contactsResult, placementsResult, roleResult] = await Promise.all([
    supabase
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
  ]);

  const inCare = new Map<string, number>();
  for (const row of placementsResult.data ?? []) {
    inCare.set(row.carer_id, (inCare.get(row.carer_id) ?? 0) + 1);
  }
  const contacts: ContactSummary[] = (contactsResult.data ?? []).map((contact) => ({
    ...contact,
    inCareCount: inCare.get(contact.id) ?? 0,
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
