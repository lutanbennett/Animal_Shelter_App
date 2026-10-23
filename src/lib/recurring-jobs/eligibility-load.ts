import type { SupabaseClient } from "@supabase/supabase-js";
import { JOB_NEEDS, needKey, type Eligibility, type Need } from "./eligibility";

/** How many role_can() calls run at once: hundreds in one burst took 25 s and failed with "fetch failed" (2026-10-23). */
const CONCURRENCY = 12;

/**
 * The database's answer to "may this role do the page a job links to", for
 * `roles` and every cell the rules ask about: one role_can() call (0133) per
 * role and cell. Pass only the roles you need. The function refuses a caller
 * who neither may set up rotas (recurring.manage) nor is asking about their
 * own role, so the rota page and its actions ask about the whole team and
 * My tasks asks about the reader's own role alone; asking more from My tasks
 * would be refused, loudly, rather than answered.
 *
 * Fails closed: on an error, `eligibility` lacks every answer, so nobody can
 * do any page-bound job, and `error` says why for the caller to show.
 */
export async function loadEligibility(
  supabase: SupabaseClient,
  roles: readonly (string | null | undefined)[],
  needs: readonly Need[] = JOB_NEEDS,
): Promise<{ eligibility: Eligibility; error: string | null }> {
  // `roles` are role keys. A doctor is never assignable (canDoJob says no first), so it is not asked;
  // an unknown key is asked and answered "no" by role_can().
  const asked = [...new Set(roles)].filter((role): role is string => !!role && role !== "doctor" && role !== "public_viewer");
  const asks = needs.flatMap((need) => asked.map((role) => ({ need, role })));
  const answers: { need: Need; role: string; yes: boolean; error: string | null }[] = [];
  for (let i = 0; i < asks.length; i += CONCURRENCY) {
    answers.push(
      ...(await Promise.all(
        asks.slice(i, i + CONCURRENCY).map(async ({ need, role }) => {
          const { data, error } = await supabase.rpc("role_can", {
            p_role_key: role,
            p_activity: need.activity,
            p_level: need.level,
          });
          return { need, role, yes: data === true, error: error?.message ?? null };
        }),
      )),
    );
    if (answers.some((a) => a.error)) break;
  }
  const failed = answers.find((a) => a.error);
  if (failed) return { eligibility: {}, error: failed.error };
  const eligibility: Record<string, string[]> = {};
  for (const need of needs) {
    eligibility[needKey(need)] = answers.filter((a) => a.need === need && a.yes).map((a) => a.role);
  }
  return { eligibility, error: null };
}
