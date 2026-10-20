"use server";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { databaseFailure, runAction, type ActionRefusal, type ActionResult } from "@/lib/action-result";
import { getT } from "@/lib/i18n/get-t";
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
    const { error } = await anon.from("desexing_drive_signups").insert(checked.signup);
    if (error) {
      const key = signupRefusalKey(error.message);
      if (key) return refuse(t.desexing.errors[key]);
      return databaseFailure("desexing.signup", error, t.common);
    }
    return { ok: true };
  });
}
