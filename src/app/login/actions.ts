"use server";

import { redirect } from "next/navigation";
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

  redirect("/residents");
}

/**
 * Starts the Google OAuth flow via Supabase Auth (PKCE). The server client
 * writes the code-verifier cookie here; src/app/auth/callback/route.ts
 * exchanges the returned code for a session and checks the user has a
 * user_roles row before letting them in.
 */
export async function signInWithGoogle() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${await requestOrigin()}/auth/callback`,
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
