import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { MIN_PASSWORD_LENGTH, mustChangePassword } from "@/lib/auth/password-change";
import { ChangePasswordForm } from "./ChangePasswordForm";

/**
 * Set your own password. Reached by choice from the navigation, or by
 * force: an account still on its temporary password is sent here by the
 * request proxy after an email/password sign-in and can't go anywhere
 * else until it's done — the heading says which.
 */
export default async function ChangePasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { t } = await getT();
  const p = t.account.password;
  const forced = mustChangePassword(user);

  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          {forced ? p.forcedTitle : p.title}
        </h1>
        <p className="text-sm text-muted">{forced ? p.forcedSubtitle : p.subtitle}</p>
        <p className="mt-1 text-xs text-muted">{user.email}</p>
      </div>
      <ChangePasswordForm minLength={MIN_PASSWORD_LENGTH} />
    </main>
  );
}
