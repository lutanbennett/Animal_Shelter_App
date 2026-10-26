import { isCardKey } from "@/lib/permissions/cards";
import type { Permissions } from "@/lib/permissions/can";
import { holdsCard } from "@/lib/manual/for-topic";
import { noteCards, noteRoles, type ReleaseNote } from "@/lib/releases";
import { isForAnyRole } from "@/lib/manual/filter";

/**
 * The role keys the older notes were ever tagged in (releases.ts's ReleaseRole, and "staff" from before 0173). A reader
 * holding none of them has a role those tags cannot speak to, so they are shown every role-tagged note.
 */
const TAGGED_ROLES = ["admin", "management", "second_in_command", "head_of_maintenance", "head_of_medical", "doctor", "volunteer", "staff"];

/**
 * Whether a release note is for this reader. Three shapes, and every one of them widens rather than narrows:
 *  - untagged: everyone's;
 *  - `cards`: whoever holds one of the cards; Admin sees every one (outside the card system, answered before any card is read);
 *    a tag with no card the code still knows (renamed, removed, empty) is shown to everyone;
 *  - `roles` (history): the reader's role keys against the tag, as before.
 * No permissions at all (not an app user) sees everything. The role path is untouched, Admin included: that history renders
 * exactly as it did.
 */
export function isNoteForReader(note: ReleaseNote, perms: Permissions | null | undefined): boolean {
  if (!perms) return true;
  const cards = noteCards(note);
  if (cards) {
    if (perms.isAdmin) return true;
    const known = cards.filter(isCardKey);
    return known.length === 0 || known.some((k) => holdsCard(perms, k));
  }
  return isForAnyRole(noteRoles(note), perms.roles, TAGGED_ROLES);
}
