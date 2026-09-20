import Link from "next/link";
import { requireAdminUser } from "@/lib/auth/require-admin";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { CONTACT_COLUMNS, type Contact } from "@/lib/contacts/contacts";
import { CreateContactForm } from "./CreateContactForm";
import { ContactsTable, type ContactRow } from "./ContactsTable";

export default async function ContactsAdminPage() {
  await requireAdminUser();
  const { t } = await getT();

  const supabase = await createClient();
  const [contactsResult, placementsResult, jobsResult] = await Promise.all([
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
    supabase
      .from("maintenance")
      .select("assigned_to")
      .not("assigned_to", "is", null)
      .returns<{ assigned_to: string }[]>(),
  ]);

  const placements = new Map<string, { total: number; active: number }>();
  for (const row of placementsResult.data ?? []) {
    const entry = placements.get(row.carer_id) ?? { total: 0, active: 0 };
    entry.total += 1;
    if (!row.end_date) entry.active += 1;
    placements.set(row.carer_id, entry);
  }
  const jobs = new Map<string, number>();
  for (const row of jobsResult.data ?? []) {
    jobs.set(row.assigned_to, (jobs.get(row.assigned_to) ?? 0) + 1);
  }
  const contacts: ContactRow[] = (contactsResult.data ?? []).map((contact) => ({
    ...contact,
    placement_count: placements.get(contact.id)?.total ?? 0,
    in_care_count: placements.get(contact.id)?.active ?? 0,
    maintenance_count: jobs.get(contact.id) ?? 0,
  }));

  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          {t.admin.contacts.title}
        </h1>
        <p className="text-sm text-muted">
          {t.admin.contacts.subtitle}{" "}
          <Link href="/contacts" className="text-primary hover:underline">
            {t.admin.contacts.viewList}
          </Link>
        </p>
      </div>

      {contactsResult.error && (
        <p className="text-sm text-danger">
          {t.admin.contacts.couldntLoad}: {contactsResult.error.message}
        </p>
      )}
      {(placementsResult.error || jobsResult.error) && (
        <p className="text-sm text-danger">
          {t.admin.contacts.couldntLoadUsage}:{" "}
          {placementsResult.error?.message ?? jobsResult.error?.message}
        </p>
      )}

      <CreateContactForm />
      <ContactsTable contacts={contacts} />
    </main>
  );
}
