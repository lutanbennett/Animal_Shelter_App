import { can, type Permissions } from "@/lib/permissions/can";

/**
 * Which relation a session reads the address book through (0126, 0170), asked of the contacts.browse cell and nothing
 * else: a holder reads the `contacts` table; everyone else reads `picker_contacts` (id, name, type, archived_at). The
 * database still narrows some roles below that by a role column (volunteer_contacts, doctor_contacts, sees_all_contacts());
 * where it does, the read comes back empty or refused and that is a row in docs/card-access-faults.md, not a case handled
 * here. Name_phone and name_type scopes no longer pick a view.
 *
 * Use it for the embeds that only want a name (`carer:${relation}(name)`):
 * PostgREST follows the foreign key through the view. A page that needs more
 * than a name for anyone but Management has the wrong idea of what they may see.
 */
export type ContactRelation = "contacts" | "picker_contacts" | "doctor_contacts" | "volunteer_contacts";

export function contactRelation(perms: Permissions | null | undefined): ContactRelation {
  return can(perms, "contacts.browse") ? "contacts" : "picker_contacts";
}

/**
 * The columns of a contact embed that a name is read from. The archive state
 * is staff's to see (archived_at is in `picker_contacts`, not in the doctor's or
 * volunteer's view); the archive reason is free text about a person, so only
 * the table carries it.
 */
export function contactNameEmbed(perms: Permissions | null | undefined, withArchive = false): string {
  const relation = contactRelation(perms);
  if (!withArchive) return `${relation}(name)`;
  if (relation === "contacts") return "contacts(name, archived_at, archive_reason)";
  if (relation === "picker_contacts") return "picker_contacts(name, archived_at)";
  return `${relation}(name)`;
}
