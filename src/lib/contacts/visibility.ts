import { can, type Permissions } from "@/lib/permissions/can";

/**
 * Which relation a session reads the address book through (0126, 0170). It is
 * asked of the role's contacts scope (`perms.scopes.contacts`, seeded by 0132)
 * and of the contacts.browse cell, not of the role's name:
 *
 * - `full` with contacts.browse (Management, Admin) reads the `contacts` table;
 * - `full` without it (staff) reads `picker_contacts` (id, name, type,
 *   archived_at): staff name and pick contacts but never read their phone,
 *   email or address (0170, findings C9 and C10);
 * - `name_type` (a doctor) reads `doctor_contacts` (id, name, type);
 * - `name_phone` (a volunteer, the 2IC) reads `volunteer_contacts` (id, name, phone).
 *
 * The base-table read policy answers only contacts.browse, so a query that
 * names `contacts` returns nothing for anyone else. An unknown scope reads the
 * narrowest view, never the table.
 *
 * Use it for the embeds that only want a name (`carer:${relation}(name)`):
 * PostgREST follows the foreign key through the view. A page that needs more
 * than a name for anyone but Management has the wrong idea of what they may see.
 */
export type ContactRelation = "contacts" | "picker_contacts" | "doctor_contacts" | "volunteer_contacts";

export function contactRelation(perms: Permissions | null | undefined): ContactRelation {
  const scope = perms?.scopes.contacts;
  if (scope === "full") return can(perms, "contacts.browse") ? "contacts" : "picker_contacts";
  if (scope === "name_phone") return "volunteer_contacts";
  return "doctor_contacts";
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
