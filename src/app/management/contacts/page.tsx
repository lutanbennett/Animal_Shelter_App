import Link from "next/link";
import { requireManagementUser } from "@/lib/auth/require-management";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { CONTACT_COLUMNS, type Contact } from "@/lib/contacts/contacts";
import { CreateContactForm } from "./CreateContactForm";
import { ContactsTable, type ContactRow } from "./ContactsTable";
import { LargerScreenNotice } from "@/components/LargerScreenNotice";

export default async function ContactsAdminPage(
  props: PageProps<"/management/contacts">,
) {
  await requireManagementUser();
  const { t } = await getT();
  const a = t.contacts.archive;
  // Archived contacts are hidden unless ?archived=1 — the same link toggle
  // the residents list uses for the deceased.
  const searchParams = await props.searchParams;
  const showArchived = searchParams.archived === "1";
  // ?friends=1 narrows the table to Shelter Friends (0076), like the chip on /contacts.
  const onlyFriends = searchParams.friends === "1";
  const hrefWith = (archived: boolean, friends: boolean) => {
    const params = new URLSearchParams();
    if (archived) params.set("archived", "1");
    if (friends) params.set("friends", "1");
    const query = params.toString();
    return query ? `/management/contacts?${query}` : "/management/contacts";
  };

  const supabase = await createClient();
  let contactsQuery = supabase.from("contacts").select(CONTACT_COLUMNS).order("name");
  if (!showArchived) contactsQuery = contactsQuery.is("archived_at", null);

  const [contactsResult, placementsResult, archivedResult, friendsResult] = await Promise.all([
    contactsQuery.returns<Contact[]>(),
    // One row per carer placement (ever) is small at shelter scale; the
    // counts gate the delete button and the type select, and the open
    // ones are the "in care" figure.
    supabase
      .from("placement_history")
      .select("carer_id, end_date, residents(id, name)")
      .not("carer_id", "is", null)
      .returns<
        {
          carer_id: string;
          end_date: string | null;
          residents: { id: string; name: string } | null;
        }[]
      >(),
    // Counted in both modes: hidden, it is what the toggle would reveal.
    supabase
      .from("contacts")
      .select("id", { count: "exact", head: true })
      .not("archived_at", "is", null),
    supabase
      .from("shelter_friends")
      .select("contact_id, published")
      .returns<{ contact_id: string; published: boolean }[]>(),
  ]);
  const archivedCount = archivedResult.count ?? 0;
  const friends = new Map(
    (friendsResult.data ?? []).map((row) => [row.contact_id, row.published]),
  );

  const placements = new Map<
    string,
    { total: number; active: number; inCare: { id: string; name: string }[] }
  >();
  for (const row of placementsResult.data ?? []) {
    const entry = placements.get(row.carer_id) ?? { total: 0, active: 0, inCare: [] };
    entry.total += 1;
    if (!row.end_date) {
      entry.active += 1;
      // Who is with them now: the Archive button links each one's return form.
      if (row.residents) entry.inCare.push(row.residents);
    }
    placements.set(row.carer_id, entry);
  }
  const allContacts: ContactRow[] = (contactsResult.data ?? []).map((contact) => ({
    ...contact,
    placement_count: placements.get(contact.id)?.total ?? 0,
    in_care_count: placements.get(contact.id)?.active ?? 0,
    residents_in_care: placements.get(contact.id)?.inCare ?? [],
    friend_published: friends.get(contact.id) ?? null,
  }));
  const friendCount = allContacts.filter((c) => c.friend_published !== null).length;
  const contacts = onlyFriends
    ? allContacts.filter((c) => c.friend_published !== null)
    : allContacts;
  const chipClass = (active: boolean) =>
    `rounded-full border px-3 py-1 text-xs font-medium ${
      active
        ? "border-primary bg-primary/10 text-primary"
        : "border-border bg-surface text-muted hover:text-foreground"
    }`;

  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          {t.management.contacts.title}
        </h1>
        <p className="text-sm text-muted">
          {t.management.contacts.subtitle}{" "}
          <Link href="/contacts" className="text-primary hover:underline">
            {t.management.contacts.viewList}
          </Link>
        </p>
      </div>

      <LargerScreenNotice>
        {contactsResult.error && (
          <p className="text-sm text-danger">
            {t.management.contacts.couldntLoad}: {contactsResult.error.message}
          </p>
        )}
        {placementsResult.error && (
          <p className="text-sm text-danger">
            {t.management.contacts.couldntLoadUsage}: {placementsResult.error.message}
          </p>
        )}

        <CreateContactForm />
        <div className="flex flex-col gap-2">
          {(archivedCount > 0 || friendCount > 0 || onlyFriends) && (
            <p className="flex flex-wrap items-center gap-2 text-sm text-muted">
              {archivedCount > 0 && (
                <>
                  {showArchived
                    ? a.archivedIncluded(archivedCount)
                    : a.archivedHidden(archivedCount)}
                  {/* A link, not a checkbox: flipping it changes the list straight away. */}
                  <Link
                    href={hrefWith(!showArchived, onlyFriends)}
                    className={chipClass(showArchived)}
                  >
                    {showArchived ? a.hideArchived : a.showArchived}
                  </Link>
                </>
              )}
              {(friendCount > 0 || onlyFriends) && (
                <Link
                  href={hrefWith(showArchived, !onlyFriends)}
                  aria-current={onlyFriends ? "true" : undefined}
                  className={chipClass(onlyFriends)}
                >
                  {t.shelterFriends.filterChip} {friendCount}
                </Link>
              )}
              {friendCount > 0 && (
                <Link
                  href="/management/shelter-friends"
                  className="text-xs font-medium text-primary hover:underline"
                >
                  {t.shelterFriends.manage.title} &rarr;
                </Link>
              )}
            </p>
          )}
          <ContactsTable contacts={contacts} />
        </div>
      </LargerScreenNotice>
    </main>
  );
}
