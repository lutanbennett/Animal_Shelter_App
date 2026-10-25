import { can, type Permissions } from "@/lib/permissions/can";

/**
 * Which relation a session reads the address book through (0126, 0170), asked of the contacts.browse cell and nothing
 * else: a holder reads the `contacts` table; everyone else reads `picker_contacts` (id, name, type, archived_at).
 * Since 0259 the database narrows nobody below that: sees_all_contacts() reads no role column, and the two views that
 * existed only to serve a narrowed role column -- volunteer_contacts and doctor_contacts -- are dropped by that
 * migration. The card is the whole decision. Name_phone and name_type scopes no longer pick a view.
 *
 * Use it for the embeds that only want a name (`carer:${relation}(name)`):
 * PostgREST follows the foreign key through the view. A page that needs more
 * than a name for anyone but Management has the wrong idea of what they may see.
 */
export type ContactRelation = "contacts" | "picker_contacts";

export function contactRelation(perms: Permissions | null | undefined): ContactRelation {
  return can(perms, "contacts.browse") ? "contacts" : "picker_contacts";
}

/**
 * The columns of a contact embed that a name is read from. The archive state
 * is staff's to see (archived_at is in `picker_contacts`); the archive reason is
 * free text about a person, so only the table carries it.
 */
export function contactNameEmbed(perms: Permissions | null | undefined, withArchive = false): string {
  const relation = contactRelation(perms);
  if (!withArchive) return `${relation}(name)`;
  if (relation === "contacts") return "contacts(name, archived_at, archive_reason)";
  if (relation === "picker_contacts") return "picker_contacts(name, archived_at)";
  return `${relation}(name)`;
}
