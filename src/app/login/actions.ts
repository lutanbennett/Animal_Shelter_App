"use server";

import { redirect } from "next/navigation";
import { loadCurrentRole, signedInLandingPath } from "@/lib/auth/app-access";
import { safeNextPath } from "@/lib/auth/next-path";
import { getT } from "@/lib/i18n/get-t";
import { getSiteOrigin } from "@/lib/site-origin";
import { createClient } from "@/lib/supabase/server";

export type LoginState = { error: string } | undefined;

export async function login(
  _state: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  // An archived login, or one never given a role, is refused here as
  // Google sign-in refuses it (src/app/auth/callback/route.ts): the
  // password was right, but the session would open nothing — and on a
  // locked site it would still get past the lock.
  const role = await loadCurrentRole(supabase);
  if (!role) {
    await supabase.auth.signOut();
    const { t } = await getT();
    return { error: t.login.errors.noRole };
  }

  // Back to the page that sent them to sign in, if any (the form carries
  // /login?next=… as a hidden field); src/lib/auth/next-path.ts. A public
  // viewer lands on the home page instead (src/lib/auth/app-access.ts).
  redirect(signedInLandingPath(role, safeNextPath(formData.get("next") as string)));
}

/**
 * Starts the Google OAuth flow via Supabase Auth (PKCE). The server client
 * writes the code-verifier cookie here; src/app/auth/callback/route.ts
 * exchanges the returned code for a session and checks the user has a
 * user_roles row before letting them in. `next` (the page that sent them
 * to sign in) rides along on the callback URL, as the password-reset
 * link does.
 */
export async function signInWithGoogle(formData: FormData) {
  const next = safeNextPath(formData.get("next") as string);
  const callback = new URL(`${await requestOrigin()}/auth/callback`);
  if (next) callback.searchParams.set("next", next);

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: callback.toString(),
      queryParams: { prompt: "select_account" },
    },
  });

  if (error || !data.url) {
    redirect("/login?error=google");
  }

  redirect(data.url);
}

/**
 * Where Supabase sends the browser back to. The shared getSiteOrigin()
 * reads the real host (localhost, the laptop's LAN address from a phone,
 * or the Cloudflare domain) and only assumes https outside development —
 * a local copy here used to guess https for any non-localhost host, which
 * sent phones to https://192.168.x.x:3000/auth/callback, not on Supabase's
 * redirect allow-list, so they were bounced to the Site URL (localhost).
 */
async function requestOrigin() {
  return (await getSiteOrigin())?.origin ?? "http://localhost:3000";
}
