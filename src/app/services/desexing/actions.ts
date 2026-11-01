"use server";

// NOT WRAPPED, DELIBERATELY (docs/decisions/2026-11-01-write-paths-tail-b.md, section 4). A visitor writes as anon, and
// claim_write_request() needs auth.uid() and is revoked from anon. The row cannot carry the request id as its own id
// either: anon's insert grant omits `id` (0233). A replay would add a second row and take a second place against the
// drive's capacity. The fix is a migration (grant insert (id) to anon, then treat a primary-key conflict as done), which
// this stream was told not to add. Until it lands, /services/desexing must not go on WRAPPED_WRITE_PATHS.

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { databaseFailure, runAction, type ActionRefusal, type ActionResult } from "@/lib/action-result";
import { getT } from "@/lib/i18n/get-t";
import { hiddenPagesOf, isPageHidden } from "@/lib/public-pages";
import { loadSiteContent } from "@/lib/site/content";
import { checkSignup, signupRefusalKey, type SignupFields } from "@/lib/desexing/form";

const refuse = (error: string): ActionRefusal => ({ ok: false, error });

/**
 * The public sign-up (0233). Written as the anon role on purpose, never as
 * whoever's session the request carries: a signed-in staff member trying the
 * form gets exactly what a visitor gets, including the database's limits
 * (open, species, capacity, three per phone or email, 60 an hour). The insert
 * asks for nothing back, because anon has no SELECT on sign-ups and the page
 * must never echo a person's details. Not revalidating: the page is read live.
 */
export async function signUpForDrive(fields: SignupFields): Promise<ActionResult> {
  const { t } = await getT();
  return runAction("desexing.signup", t.common.somethingWentWrong, async () => {
    const checked = checkSignup(fields);
    if (!checked.ok) return refuse(t.desexing.errors[checked.problem]);

    const anon = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );
    // While Desexing drives is hidden (the page, or its Services section) the page shows Not found;
    // the form's action is reachable on its own, so it refuses too. A failed read is not "shown".
    const site = await loadSiteContent(anon);
    if (!site) return refuse(t.common.somethingWentWrong("desexing.signup"));
    if (isPageHidden("desexing", hiddenPagesOf(site.hidden_public_pages))) return refuse(t.desexing.errors.pageHidden);

    const { error } = await anon.from("desexing_drive_signups").insert(checked.signup);
    if (error) {
      const key = signupRefusalKey(error.message);
      if (key) return refuse(t.desexing.errors[key]);
      return databaseFailure("desexing.signup", error, t.common);
    }
    return { ok: true };
  });
}
