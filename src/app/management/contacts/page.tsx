import Link from "next/link";
import { requireManagementUser } from "@/lib/auth/require-management";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { CONTACT_COLUMNS, type Contact } from "@/lib/contacts/contacts";
import { CreateContactForm } from "./CreateContactForm";
import { ContactsTable, type ContactRow } from "./ContactsTable";

export default async function ContactsAdminPage(
  props: PageProps<"/management/contacts">,
) {
  await requireManagementUser();
  const { t } = await getT();
  const a = t.contacts.archive;
  // Archived contacts are hidden unless ?archived=1 — the same link toggle
  // the residents list uses for the deceased.
  const showArchived = (await props.searchParams).archived === "1";

  const supabase = await createClient();
  let contactsQuery = supabase.from("contacts").select(CONTACT_COLUMNS).order("name");
  if (!showArchived) contactsQuery = contactsQuery.is("archived_at", null);

  const [contactsResult, placementsResult, archivedResult] = await Promise.all([
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
  ]);
  const archivedCount = archivedResult.count ?? 0;

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
  const contacts: ContactRow[] = (contactsResult.data ?? []).map((contact) => ({
    ...contact,
    placement_count: placements.get(contact.id)?.total ?? 0,
    in_care_count: placements.get(contact.id)?.active ?? 0,
    residents_in_care: placements.get(contact.id)?.inCare ?? [],
  }));

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
        {archivedCount > 0 && (
          <p className="flex flex-wrap items-center gap-2 text-sm text-muted">
            {showArchived
              ? a.archivedIncluded(archivedCount)
              : a.archivedHidden(archivedCount)}
            {/* A link, not a checkbox: flipping it changes the list straight away. */}
            <Link
              href={showArchived ? "/management/contacts" : "/management/contacts?archived=1"}
              className={`rounded-full border px-3 py-1 text-xs font-medium ${
                showArchived
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-surface text-muted hover:text-foreground"
              }`}
            >
              {showArchived ? a.hideArchived : a.showArchived}
            </Link>
          </p>
        )}
        <ContactsTable contacts={contacts} />
      </div>
    </main>
  );
}
