import Link from "next/link";
import { requireManagementUser } from "@/lib/auth/require-management";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { CONTACT_COLUMNS, type Contact } from "@/lib/contacts/contacts";
import { CreateContactForm } from "./CreateContactForm";
import { ContactsTable, type ContactRow } from "./ContactsTable";

export default async function ContactsAdminPage() {
  await requireManagementUser();
  const { t } = await getT();

  const supabase = await createClient();
  const [contactsResult, placementsResult] = await Promise.all([
    supabase
      .from("contacts")
      .select(CONTACT_COLUMNS)
      .order("name")
      .returns<Contact[]>(),
    // One row per carer placement (ever) is small at shelter scale; the
    // counts gate the delete button and the type select, and the open
    // ones are the "in care" figure.
    supabase
      .from("placement_history")
      .select("carer_id, end_date")
      .not("carer_id", "is", null)
      .returns<{ carer_id: string; end_date: string | null }[]>(),
  ]);

  const placements = new Map<string, { total: number; active: number }>();
  for (const row of placementsResult.data ?? []) {
    const entry = placements.get(row.carer_id) ?? { total: 0, active: 0 };
    entry.total += 1;
    if (!row.end_date) entry.active += 1;
    placements.set(row.carer_id, entry);
  }
  const contacts: ContactRow[] = (contactsResult.data ?? []).map((contact) => ({
    ...contact,
    placement_count: placements.get(contact.id)?.total ?? 0,
    in_care_count: placements.get(contact.id)?.active ?? 0,
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
      <ContactsTable contacts={contacts} />
    </main>
  );
}
