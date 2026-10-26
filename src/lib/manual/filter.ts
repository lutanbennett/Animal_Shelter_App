/**
 * Whether something tagged with `roles` is for `role`. No tag means everyone, so an untagged note is never filtered
 * out; no role (null) sees everything. Used by the release notes, which are still tagged by role key (a record of what
 * was said at the time); the manual no longer is, see for-topic.ts.
 */
export function isForRole(roles: readonly string[] | undefined, role: string | null): boolean {
  return !role || !roles || roles.includes(role);
}

/**
 * Whether something tagged with `tags` is for a login that holds `roleKeys`. It is when it is untagged, when a tag names
 * a role the login holds, or when none of the login's roles is one the tags can speak to (`vocabulary`: the role keys the
 * tags were ever written in). A shelter may name its roles anything, so a role the tags never heard of is shown the note
 * rather than having it narrowed away: the fallback is to widen, never to read the role as some other one.
 */
export function isForAnyRole(tags: readonly string[] | undefined, roleKeys: readonly string[], vocabulary: readonly string[]): boolean {
  if (!tags || roleKeys.length === 0) return true;
  if (roleKeys.some((k) => tags.includes(k))) return true;
  return !roleKeys.some((k) => vocabulary.includes(k));
}
