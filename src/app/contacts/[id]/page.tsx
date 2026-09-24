import { notFound } from "next/navigation";
import { canManage } from "@/lib/auth/require-management";
import { createClient } from "@/lib/supabase/server";
import { CONTACT_COLUMNS, type Contact } from "@/lib/contacts/contacts";
import { addressMapEmbedSrc } from "@/lib/contacts/map-preview";
import { SHELTER_FRIEND_COLUMNS, type ShelterFriend } from "@/lib/shelter-friends/friends";
import { loadTranslations, translationKey } from "@/lib/translations/queries";
import { ContactHub, type CarerPlacement } from "./ContactHub";

export default async function ContactPage(props: PageProps<"/contacts/[id]">) {
  const { id } = await props.params;
  const supabase = await createClient();

  // Every placement that named this contact as carer, newest first. The
  // open ones (end_date null) are the residents living with them now; the
  // rest is their history. One query covers both.
  const [contactResult, placementsResult, roleResult, friendResult] = await Promise.all([
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
    // Its Shelter Friend profile, if any (0076) — every signed-in role reads it.
    supabase
      .from("shelter_friends")
      .select(SHELTER_FRIEND_COLUMNS)
      .eq("contact_id", id)
      .limit(1)
      .returns<ShelterFriend[]>(),
  ]);

  // A query error must not look like a missing contact — surface it, not a 404.
  if (contactResult.error) throw new Error(contactResult.error.message);
  const contact = contactResult.data?.[0];
  if (!contact) notFound();
  if (placementsResult.error) throw new Error(placementsResult.error.message);

  // The map preview may need a network round trip (a shared short link is
  // followed to what it points at), so it waits until the contact is known.
  if (friendResult.error) throw new Error(friendResult.error.message);
  const friend = friendResult.data?.[0] ?? null;
  const [mapSrc, translations] = await Promise.all([
    addressMapEmbedSrc(contact.address),
    loadTranslations(supabase, "shelter_friends", friend ? [friend.id] : []),
  ]);
  const friendTranslation = (column: string) =>
    friend ? translations.get(translationKey(friend.id, column)) : undefined;

  return (
    <ContactHub
      contact={contact}
      placements={placementsResult.data ?? []}
      canManage={canManage(roleResult.data)}
      mapSrc={mapSrc}
      friend={friend}
      friendTranslations={{
        blurb: friendTranslation("blurb"),
        help_kind: friendTranslation("help_kind"),
        discount_note: friendTranslation("discount_note"),
      }}
    />
  );
}
