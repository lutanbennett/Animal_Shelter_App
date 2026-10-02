/**
 * Which relation a session reads the address book through (0126, backlog
 * DB-5). Staff and above read the `contacts` table; a vet reads
 * `vet_contacts` (id, name, type) and a volunteer `volunteer_contacts`
 * (id, name, phone) — the base-table read policies for those two roles are
 * gone, so a query that names `contacts` returns nothing for them.
 *
 * Use it for the embeds that only want a name (`carer:${relation}(name)`):
 * PostgREST follows the foreign key through the view. A page that needs more
 * than a name for a vet or volunteer has the wrong idea of what they may see.
 */
export type ContactRelation = "contacts" | "vet_contacts" | "volunteer_contacts";

export function contactRelation(role: string | null | undefined): ContactRelation {
  if (role === "vet") return "vet_contacts";
  if (role === "volunteer") return "volunteer_contacts";
  return "contacts";
}

/**
 * The columns of a contact embed that a name is read from. The archive
 * state is staff's to see (archived_at is not in either narrow view).
 */
export function contactNameEmbed(role: string | null | undefined, withArchive = false): string {
  const relation = contactRelation(role);
  return relation === "contacts" && withArchive
    ? "contacts(name, archived_at, archive_reason)"
    : `${relation}(name)`;
}
