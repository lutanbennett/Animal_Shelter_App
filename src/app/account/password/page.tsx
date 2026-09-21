import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { MIN_PASSWORD_LENGTH, mustChangePassword } from "@/lib/auth/password-change";
import { ChangePasswordForm } from "./ChangePasswordForm";

/**
 * Set your own password. Reached by choice from the navigation, or by
 * force: an account still on its temporary password is sent here by the
 * request proxy after an email/password sign-in and can't go anywhere
 * else until it's done — or from a recovery link (?reset=1), after the
 * callback has turned it into a session. The heading says which.
 */
export default async function ChangePasswordPage(props: PageProps<"/account/password">) {
  const searchParams = await props.searchParams;
  const fromReset = searchParams.reset === "1";
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
          {forced ? p.forcedTitle : fromReset ? p.resetTitle : p.title}
        </h1>
        <p className="text-sm text-muted">
          {forced ? p.forcedSubtitle : fromReset ? p.resetSubtitle : p.subtitle}
        </p>
        <p className="mt-1 text-xs text-muted">{user.email}</p>
      </div>
      <ChangePasswordForm minLength={MIN_PASSWORD_LENGTH} continueAfter={forced || fromReset} />
    </main>
  );
}
