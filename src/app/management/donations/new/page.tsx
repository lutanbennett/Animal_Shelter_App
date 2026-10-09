import { BackLink } from "@/components/BackLink";
import type { ResidentOption } from "@/components/ResidentPicker";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { todayIso } from "@/lib/format";
import { requirePermission } from "@/lib/permissions/require";
import { DonationForm, type DonorContact } from "./DonationForm";

/**
 * Management → Donations → Record a donation. Saving records the gift, issues
 * its receipt with the next LCA number and files it on Drive, then opens the
 * donation's page to send it. Built for the Director's phone as well as her PC.
 */
export default async function NewDonationPage() {
  await requirePermission("donation.receipt");
  const { t } = await getT();
  const d = t.donations;

  const supabase = await createClient();
  const [contacts, residents] = await Promise.all([
    // Contacts this login cannot read come back empty, and the picker simply hides.
    supabase
      .from("contacts")
      .select("id, name, email, phone, line_id")
      .is("archived_at", null)
      .order("name")
      .returns<DonorContact[]>(),
    supabase
      .from("residents")
      .select("id, name, thai_name, current_status")
      .order("name")
      .returns<ResidentOption[]>(),
  ]);

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-col gap-1">
        <BackLink href="/management/donations">{d.backToList}</BackLink>
        <h1 className="text-2xl font-semibold text-foreground">{d.form.newTitle}</h1>
        <p className="text-sm text-muted">{d.form.newSubtitle}</p>
      </div>
      <DonationForm contacts={contacts.data ?? []} residents={residents.data ?? []} today={todayIso()} />
    </main>
  );
}
