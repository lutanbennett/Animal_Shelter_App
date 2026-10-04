/**
 * Which relation a session reads the address book through (0126, backlog
 * DB-5). It is asked of the role's contacts scope (`perms.scopes.contacts`,
 * seeded by 0132), not of the role's name: `full` reads the `contacts`
 * table, `name_type` (a vet) reads `vet_contacts` (id, name, type) and
 * `name_phone` (a volunteer) `volunteer_contacts` (id, name, phone). The
 * base-table read policies for those two are gone, so a query that names
 * `contacts` returns nothing for them. An unknown scope reads the narrowest
 * view, never the table.
 *
 * Use it for the embeds that only want a name (`carer:${relation}(name)`):
 * PostgREST follows the foreign key through the view. A page that needs more
 * than a name for a vet or volunteer has the wrong idea of what they may see.
 */
export type ContactRelation = "contacts" | "vet_contacts" | "volunteer_contacts";

export function contactRelation(scope: string | null | undefined): ContactRelation {
  if (scope === "full") return "contacts";
  if (scope === "name_phone") return "volunteer_contacts";
  return "vet_contacts";
}

/**
 * The columns of a contact embed that a name is read from. The archive
 * state is staff's to see (archived_at is not in either narrow view).
 */
export function contactNameEmbed(scope: string | null | undefined, withArchive = false): string {
  const relation = contactRelation(scope);
  return relation === "contacts" && withArchive
    ? "contacts(name, archived_at, archive_reason)"
    : `${relation}(name)`;
}
