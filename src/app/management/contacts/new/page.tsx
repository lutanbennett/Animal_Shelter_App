import { getT } from "@/lib/i18n/get-t";
import { requirePermission } from "@/lib/permissions/require";
import { CreateContactForm } from "../CreateContactForm";

/**
 * Management → Contacts → New contact: the form on its own page so the list
 * stays the first thing on /management/contacts (docs/decisions/2026-10-17-contacts-list-first-icons.md).
 * Same gate as the createContact action.
 */
export default async function NewContactPage() {
  await requirePermission("contacts.directory");
  const { t } = await getT();
  const c = t.management.contacts;
  return (
    <main className="flex min-w-0 flex-1 flex-col gap-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{c.newTitle}</h1>
        <p className="text-sm text-muted">{c.newSubtitle}</p>
      </div>
      <CreateContactForm listHref="/management/contacts" />
    </main>
  );
}
