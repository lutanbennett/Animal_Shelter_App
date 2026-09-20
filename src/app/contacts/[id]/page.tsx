import { notFound } from "next/navigation";
import { canManage } from "@/lib/auth/require-management";
import { createClient } from "@/lib/supabase/server";
import { CONTACT_COLUMNS, type Contact } from "@/lib/contacts/contacts";
import { ContactHub, type CarerPlacement } from "./ContactHub";

export default async function ContactPage(props: PageProps<"/contacts/[id]">) {
  const { id } = await props.params;
  const supabase = await createClient();

  // Every placement that named this contact as carer, newest first. The
  // open ones (end_date null) are the residents living with them now; the
  // rest is their history. One query covers both.
  const [contactResult, placementsResult, roleResult] = await Promise.all([
    supabase
      .from("contacts")
      .select(CONTACT_COLUMNS)
      .eq("id", id)
      .limit(1)
      .returns<Contact[]>(),
    supabase
      .from("placement_history")
      .select(
        "id, placement_type, start_date, end_date, residents(id, name, thai_name, resident_code, species, profile_photo_drive_file_id)",
      )
      .eq("carer_id", id)
      .order("start_date", { ascending: false })
      .returns<CarerPlacement[]>(),
    supabase.rpc("current_user_role"),
  ]);

  // A query error must not look like a missing contact — surface it, not a 404.
  if (contactResult.error) throw new Error(contactResult.error.message);
  const contact = contactResult.data?.[0];
  if (!contact) notFound();
  if (placementsResult.error) throw new Error(placementsResult.error.message);

  return (
    <ContactHub
      contact={contact}
      placements={placementsResult.data ?? []}
      canManage={canManage(roleResult.data)}
    />
  );
}
