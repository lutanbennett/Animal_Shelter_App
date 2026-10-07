import type { User } from "@supabase/supabase-js";

/**
 * The name a login can carry, kept in `user_metadata.full_name` — the very key
 * `private.app_users` reads for `display_name` (0126, 0146), so a name set
 * here shows in every picker and on Recent changes through appUserLabel()
 * with no schema change. Google fills the same key (and `name`) on sign-in.
 * docs/decisions/2026-10-07-header-name-role.md has why it is not a table.
 */
export const MAX_NAME_LENGTH = 60;

/** Trimmed, inner whitespace collapsed, cut to length; null when nothing is left. */
export function normaliseName(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const name = raw.replace(/\s+/g, " ").trim().slice(0, MAX_NAME_LENGTH).trim();
  return name || null;
}

/** The name on a login, read in the order the app_users view reads it; null when it has none. */
export function userNameOf(user: Pick<User, "user_metadata"> | null | undefined): string | null {
  const meta = user?.user_metadata;
  return normaliseName(meta?.full_name) ?? normaliseName(meta?.name);
}

/**
 * user_metadata after setting (or clearing) the name. The admin API replaces
 * user_metadata wholesale, so the other keys are carried over. Clearing drops
 * `name` as well, or Google's would show straight back.
 */
export function withName(
  metadata: Record<string, unknown> | undefined,
  name: string | null,
): Record<string, unknown> {
  const { full_name: _full, name: _name, ...rest } = metadata ?? {};
  void _full;
  void _name;
  return name ? { ...rest, full_name: name } : rest;
}
