import type { SupabaseClient, User } from "@supabase/supabase-js";

/**
 * What an access request is, in one place: a login with no `user_roles`
 * row. Someone signs in with Google or is sent a link, lands with no role
 * and so can't get in, and waits for an admin to give them one. Archived
 * people (0063) keep their row, so they are never counted as waiting.
 *
 * Settings → Security lists them (behind 2-step verification) and
 * Settings → System status counts them (at a normal sign-in), and both go
 * through here so the card and the list can never disagree.
 */

/** Logins per request to GoTrue; listAllUsers() asks for as many pages as there are. */
export const LIST_USERS_PER_PAGE = 200;

/**
 * Every login, however many. listUsers() returns one page and says
 * nothing when there are more, so a single call silently drops the rest:
 * once junk sign-ups outnumbered a page, real logins fell off Security and
 * out of the access-request count with no sign anything was missing. A
 * short page is the last one.
 */
export async function listAllUsers(
  admin: SupabaseClient,
): Promise<{ users: User[]; error?: string }> {
  const users: User[] = [];
  for (let page = 1; ; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: LIST_USERS_PER_PAGE });
    if (error) return { users, error: error.message };
    users.push(...data.users);
    if (data.users.length < LIST_USERS_PER_PAGE) return { users };
  }
}

export function accessRequestsAmong<U extends Pick<User, "id">>(
  authUsers: U[],
  roleUserIds: { has(id: string): boolean },
): U[] {
  return authUsers.filter((u) => !roleUserIds.has(u.id));
}

/**
 * How many are waiting and since when — nothing that says who. This is
 * what System status shows at a normal sign-in, so the return type is the
 * guarantee: names and email addresses stay behind the step-up on
 * Settings → Security (src/lib/auth/two-step.ts, 0100).
 */
export type WaitingAccessRequests = {
  count: number;
  /** ISO time the longest-waiting login was created; null when none wait. */
  oldestSince: string | null;
  /** Whole days the oldest has waited, as of the count; 0 when none wait. */
  oldestDays: number;
};

/** Needs the service-role client: listing logins is an admin API call. */
export async function countWaitingAccessRequests(
  admin: SupabaseClient,
): Promise<{ data?: WaitingAccessRequests; error?: string }> {
  const [authUsersResult, rolesResult] = await Promise.all([
    listAllUsers(admin),
    admin.from("user_roles").select("user_id"),
  ]);
  if (authUsersResult.error) return { error: authUsersResult.error };
  if (rolesResult.error) return { error: rolesResult.error.message };

  const roleUserIds = new Set((rolesResult.data ?? []).map((r) => r.user_id as string));
  const waiting = accessRequestsAmong(authUsersResult.users, roleUserIds);
  const oldestSince = waiting.map((u) => u.created_at).sort()[0] ?? null;
  const oldestDays = oldestSince ? Math.floor((Date.now() - Date.parse(oldestSince)) / 86_400_000) : 0;
  return { data: { count: waiting.length, oldestSince, oldestDays } };
}
