// How check-test-plan.mjs reads an `unreleased` note's audience tag out of src/lib/releases.ts.
// A note is plainly worded (everyone's), or tagged. There are THREE tag shapes, mirroring the
// ReleaseNote union in src/lib/releases.ts: `cards`, the older `roles`, and `admin: true`.
// Admin holds no card, so no card tag can say "Admin only"; `admin: true` is its own state
// and counts as addressed (docs/decisions/2026-11-04-release-check-false-positives.md).

const TEXT = String.raw`("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|` + "`(?:[^`\\\\]|\\\\.)*`)";

// Texts of the notes in `unreleasedBlock` that carry a tag, whatever its shape.
export function taggedNoteTexts(unreleasedBlock) {
  const re = new RegExp(String.raw`\{\s*text\s*:\s*` + TEXT + String.raw`\s*,\s*(?:roles|cards|admin\s*:\s*true)\b`, "g");
  return new Set([...unreleasedBlock.matchAll(re)].map((m) => m[1].slice(1, -1)));
}

// Texts tagged with the older `roles` tag, which is closed to new notes.
export function roleTaggedNoteTexts(unreleasedBlock) {
  const re = new RegExp(String.raw`\{\s*text\s*:\s*` + TEXT + String.raw`\s*,\s*roles\b`, "g");
  return new Set([...unreleasedBlock.matchAll(re)].map((m) => m[1].slice(1, -1)));
}

export const ADMIN_ONLY_NOTE = /Settings\s*(?:→|->)|\/admin\b|\bAdmin-only\b|\bonly (?:an )?admins?\b/i;

// Added notes that name an admin-only place but carry no tag of any shape.
export function untaggedAdminNotes(added, unreleasedBlock) {
  const tagged = taggedNoteTexts(unreleasedBlock);
  return added.filter((l) => !tagged.has(l) && ADMIN_ONLY_NOTE.test(l));
}
