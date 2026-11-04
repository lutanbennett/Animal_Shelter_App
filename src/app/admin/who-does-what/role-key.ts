/**
 * The handle a new role gets from its English name (docs/decisions/2026-11-04-create-role-from-app.md). roles.key must
 * match ^[a-z][a-z0-9_]*$, so lower-case letters and digits, anything else becomes one underscore, and a name that does not
 * start with a letter gets "role_" in front. Empty when the name has no letter or digit at all (a Thai-only name): the form
 * then asks for an English one. Shared by the form (which shows the key before the commit) and the action (which uses it).
 */
export function roleKeyFromName(name: string): string {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 40).replace(/_+$/, "");
  if (!base) return "";
  return /^[a-z]/.test(base) ? base : `role_${base}`;
}

/** Keys the database reserves for the two fixed roles; a custom role cannot take them. */
export const RESERVED_ROLE_KEYS = ["admin", "public_viewer"];
