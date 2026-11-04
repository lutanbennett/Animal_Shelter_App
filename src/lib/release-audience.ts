import { isCardKey } from "@/lib/permissions/cards";
import type { Permissions } from "@/lib/permissions/can";
import { holdsCard } from "@/lib/manual/for-topic";
import { noteAdmin, noteCards, type ReleaseNote } from "@/lib/releases";

/**
 * Whether a note may be listed to this reader at all, under any view. Only an `admin: true` note can be refused: it is for
 * Admin and nobody else, a non-app reader included, and is answered by the same `perms.isAdmin` short-circuit can() uses.
 */
export function isNoteListed(note: ReleaseNote, perms: Permissions | null | undefined): boolean {
  return !noteAdmin(note) || perms?.isAdmin === true;
}

/**
 * Whether a release note is for this reader. Three shapes, and every one of them widens rather than narrows:
 *  - untagged: everyone's;
 *  - `cards`: whoever holds one of the cards; Admin sees every one (outside the card system, answered before any card is read);
 *    a tag with no card the code still knows (renamed, removed, empty) is shown to everyone;
 *  - `admin: true`: Admin only.
 * No permissions at all (not an app user) sees everything that may be listed to them. No role is named here: a shelter may
 * call its roles anything.
 */
export function isNoteForReader(note: ReleaseNote, perms: Permissions | null | undefined): boolean {
  if (noteAdmin(note)) return perms?.isAdmin === true;
  if (!perms) return true;
  const cards = noteCards(note);
  if (!cards || perms.isAdmin) return true;
  const known = cards.filter(isCardKey);
  return known.length === 0 || known.some((k) => holdsCard(perms, k));
}
