"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { runWriteAction, type ActionResult, type WriteMessages } from "@/lib/action-result";
import { writeRequestIdFrom } from "@/lib/write-requests";
import { normaliseName } from "@/lib/auth/user-name";
import { DEFAULT_SIGNED_IN_PATH } from "@/lib/auth/next-path";
import {
  MIN_PASSWORD_LENGTH,
  MUST_CHANGE_PASSWORD,
  mustChangePassword,
  requiresCurrentPassword,
} from "@/lib/auth/password-change";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";

// PI FAILOVER (D), 2026-11-01: both writes go through runWriteAction()
// (docs/decisions/2026-11-01-write-paths-tail-b.md, section on GoTrue). They write to GoTrue, not the app
// database, but the person is SIGNED IN, so claim_write_request() can run as them: the claim guards the body
// running once, and a replay returns the first answer instead of a false "same password" for a change that
// happened. Neither result carries a secret, so storing it is safe.
export type ChangePasswordState = ActionResult | undefined;

/** The words runWriteAction() needs. */
const write = (t: Dictionary): WriteMessages => ({
  somethingWentWrong: t.common.somethingWentWrong,
  saveUnknown: t.common.saveUnknown,
  reloadToSave: t.common.reloadToSave,
});

/**
 * The signed-in user sets their own password. Two callers: the forced
 * change after a temporary password (the proxy sends them here and
 * nowhere else), and anyone changing theirs by choice. The must-change
 * flag lives in app_metadata, which only the service role can write, so
 * clearing it goes through the admin client — after the password has
 * actually been replaced, never before.
 *
 * A change by choice must also prove the current password, checked here
 * and not in the form: auth.updateUser() does not ask for it, so anyone
 * who can post to this action would otherwise skip a browser-side check.
 * Whether it is owed is read from the session (requiresCurrentPassword),
 * never from the form. After a change every other session is signed out.
 */
export async function changeOwnPassword(
  _state: ChangePasswordState,
  formData: FormData,
): Promise<ActionResult> {
  const { t } = await getT();
  const e = t.account.password.errors;

  const password = formData.get("password");
  const confirm = formData.get("confirm");
  if (typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH) {
    return { ok: false, error: e.tooShort(MIN_PASSWORD_LENGTH) };
  }
  if (password !== confirm) return { ok: false, error: e.mismatch };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // The redirect is taken AFTER the wrapper returns: it rethrows one and would leave the claim open.
  const outcome = await runWriteAction<{ redirectTo?: string }>(
    "account.changeOwnPassword",
    write(t),
    { id: writeRequestIdFrom(formData), action: "account.changeOwnPassword", db: supabase },
    async () => {
      if (requiresCurrentPassword(user, (await supabase.auth.getSession()).data.session?.access_token)) {
        const current = formData.get("current");
        if (typeof current !== "string" || current === "") return { ok: false, error: e.currentRequired };
        // Fail closed: no email on the account, or a check that cannot run,
        // refuses the change rather than skipping the proof.
        if (!user.email) return { ok: false, error: e.cannotVerify };
        // A throwaway client, so the check neither touches this session's
        // cookies nor leaves a second session behind.
        const verifier = createSupabaseClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          { auth: { autoRefreshToken: false, persistSession: false } },
        );
        const { error: signInError } = await verifier.auth.signInWithPassword({
          email: user.email,
          password: current,
        });
        if (signInError) {
          if (signInError.status === 400 || /invalid login credentials/i.test(signInError.message)) {
            return { ok: false, error: e.currentWrong };
          }
          return { ok: false, error: e.cannotVerify };
        }
        // Local scope: the default is global, which would end every session this
        // person has — including the one making this request.
        await verifier.auth.signOut({ scope: "local" });
      }

      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        // Supabase refuses the same password again; say so in our words.
        if (/different from the old password/i.test(error.message)) return { ok: false, error: e.samePassword };
        return { ok: false, error: error.message };
      }

      if (mustChangePassword(user)) {
        const admin = createAdminClient();
        const { error: flagError } = await admin.auth.admin.updateUserById(user.id, {
          app_metadata: { ...user.app_metadata, [MUST_CHANGE_PASSWORD]: false },
        });
        if (flagError) return { ok: false, error: flagError.message };
      }

      // Someone changes their password because they fear another device has
      // the account; Supabase leaves those sessions alive unless told not to.
      const { error: othersError } = await supabase.auth.signOut({ scope: "others" });
      if (othersError) return { ok: false, error: e.othersNotSignedOut };

      // Forced change and recovery both go on into the app; a change by choice
      // stays on the page with a confirmation.
      return formData.get("continue") === "1" ? { ok: true, redirectTo: DEFAULT_SIGNED_IN_PATH } : { ok: true };
    },
  );
  if (outcome.ok && outcome.redirectTo) redirect(outcome.redirectTo);
  return outcome;
}

export type ChangeNameState = ActionResult | undefined;

/**
 * The signed-in person sets their own name (or clears it, and the email
 * shows instead). Their own user_metadata, which they may write through
 * their own session, so no service role is needed. updateUser merges the
 * data it is given into user_metadata and a null removes the key, so
 * clearing sends null for both keys (Google's `name` would otherwise show
 * straight back).
 */
export async function changeOwnName(
  _state: ChangeNameState,
  formData: FormData,
): Promise<ActionResult> {
  const { t } = await getT();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return runWriteAction("account.changeOwnName", write(t), { id: writeRequestIdFrom(formData), action: "account.changeOwnName", db: supabase }, async () => {
    const name = normaliseName(formData.get("name"));
    const { error } = await supabase.auth.updateUser({ data: { full_name: name, name } });
    if (error) {
      console.error("[account.changeOwnName]", error);
      return { ok: false, error: t.account.name.failed };
    }
    // The header is in the root layout of every signed-in page.
    revalidatePath("/", "layout");
    return { ok: true };
  });
}
