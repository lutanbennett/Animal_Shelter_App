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
    // Status lives in the view, not on residents (0001). Residents who have died
    // stay in the list: a gift in memory of one is recordable, and the row shows
    // the status so nobody picks one by accident (Lutan, 2026-10-10).
    supabase
      .from("resident_list_view")
      .select("resident_id, name, thai_name, current_status")
      .order("name")
      .returns<(Omit<ResidentOption, "id"> & { resident_id: string })[]>(),
  ]);

  // A failed load must not look like "no residents match": that is what hid
  // this picker reading a column residents does not have.
  if (contacts.error) console.error("donation form: contact list failed", contacts.error);
  if (residents.error) console.error("donation form: resident list failed", residents.error);
  const residentOptions: ResidentOption[] = (residents.data ?? []).map(
    ({ resident_id, ...r }) => ({ id: resident_id, ...r }),
  );

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-col gap-1">
        <BackLink href="/management/donations">{d.backToList}</BackLink>
        <h1 className="text-2xl font-semibold text-foreground">{d.form.newTitle}</h1>
        <p className="text-sm text-muted">{d.form.newSubtitle}</p>
      </div>
      <DonationForm contacts={contacts.data ?? []} residents={residentOptions} residentsFailed={!!residents.error} today={todayIso()} />
    </main>
  );
}
