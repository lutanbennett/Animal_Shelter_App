/**
 * Updates from adopters (0097). Plain data, safe to import from client
 * components and from drive.ts.
 */

/**
 * How the news came in — the codes adoption_updates_channel allows. The
 * dictionaries label them (t.adoptionUpdates.channels); the database only
 * ever holds the code. Growing the list is one migration (a CHECK, not an
 * enum) plus a line in each dictionary.
 */
export const ADOPTION_UPDATE_CHANNELS = ["line", "facebook", "email", "visit"] as const;
export type AdoptionUpdateChannel = (typeof ADOPTION_UPDATE_CHANNELS)[number];

export function isAdoptionUpdateChannel(value: unknown): value is AdoptionUpdateChannel {
  return (ADOPTION_UPDATE_CHANNELS as readonly unknown[]).includes(value);
}

/**
 * Who may add, correct or delete an update: record_keepers_write_adoption_updates
 * (0097). Volunteers and vets read them, and may still add a photo to an
 * existing update through the ordinary photo route.
 */
export const ADOPTION_UPDATE_ROLES = new Set(["admin", "management", "staff"]);

/** Residents/<Name> (<ID>)/Adoption updates/<YYYYMMDD>/ in Drive. */
export const ADOPTION_UPDATES_FOLDER = "Adoption updates";

/**
 * Where an adopter's photo came from, read through
 * attachments.adoption_update_id in one embed wherever a resident photo is
 * listed (RESIDENT_PHOTO_SELECT). Null on a photo the shelter took.
 * `sender` is null when nobody was recorded, or for a role that cannot read
 * contacts (vets) — the photo still says it came from an adopter.
 */
export type PhotoProvenance = {
  id: string;
  received_on: string;
  channel: string;
  sender: { name: string } | null;
};

/**
 * The attachments columns every resident photo list reads, provenance
 * included, so a photo never loses where it came from on one page and
 * keeps it on another. The embed names the composite foreign key
 * (adoption_update_id, owner_id) → adoption_updates (id, resident_id).
 */
export const RESIDENT_PHOTO_SELECT =
  "id, drive_file_id, file_name, sub_folder, date_taken, adoption_update:adoption_updates!attachments_adoption_update_fk(id, received_on, channel, sender:contacts(name))";
