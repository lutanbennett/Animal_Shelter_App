import { notFound } from "next/navigation";
import { can } from "@/lib/permissions/can";
import { requirePermission } from "@/lib/permissions/require";
import {
  CONTACT_COLUMNS,
  contactMapSource,
  toVolunteerContact,
  type Contact,
  type VolunteerContact,
} from "@/lib/contacts/contacts";
import { addressMap } from "@/lib/contacts/map-preview";
import { SHELTER_FRIEND_COLUMNS, type ShelterFriend } from "@/lib/shelter-friends/friends";
import { loadTranslations, translationKey } from "@/lib/translations/queries";
import { ContactHub, type CarerPlacement } from "./ContactHub";

export default async function ContactPage(props: PageProps<"/contacts/[id]">) {
  const { id } = await props.params;
  const { supabase, perms } = await requirePermission("contacts.browse");

  // Every placement that named this contact as carer, newest first. The
  // open ones (end_date null) are the residents living with them now; the
  // rest is their history. One query covers both.
  const [contactResult, placementsResult, friendResult] = await Promise.all([
    // The contacts scope says which view of the address book this role reads (0126).
    perms.scopes.contacts === "name_phone"
      ? supabase
          .from("volunteer_contacts")
          .select("id, name, phone")
          .eq("id", id)
          .limit(1)
          .returns<{ id: string; name: string; phone: string | null }[]>()
          .then((r) => ({
            ...r,
            data: r.data?.map(toVolunteerContact) as VolunteerContact[] | null,
          }))
      : supabase
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
    // Its Shelter Friend profile, if any (0076); friends.view or friends.manage reads it (0155), so the 2IC sees none.
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
  const [map, translations] = await Promise.all([
    addressMap(contactMapSource(contact)),
    loadTranslations(supabase, "shelter_friends", friend ? [friend.id] : []),
  ]);
  const friendTranslation = (column: string) =>
    friend ? translations.get(translationKey(friend.id, column)) : undefined;

  return (
    <ContactHub
      contact={contact}
      placements={placementsResult.data ?? []}
      canManage={can(perms, "contacts.directory")}
      canManageFriends={can(perms, "friends.manage")}
      map={map}
      friend={friend}
      friendTranslations={{
        blurb: friendTranslation("blurb"),
        help_kind: friendTranslation("help_kind"),
        discount_note: friendTranslation("discount_note"),
      }}
    />
  );
}
