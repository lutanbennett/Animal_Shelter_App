import Link from "next/link";
import { redirect } from "next/navigation";
import { refuseFor } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { loadPermissions } from "@/lib/permissions/load";
import { WHO_DOES_WHAT_PATH } from "@/lib/permissions/who-does-what";
import { listHomeRoles } from "@/lib/home/roles";
import { getT } from "@/lib/i18n/get-t";
import { HomeSwitch } from "@/components/HomeSwitch";

/**
 * Settings → Who does what → Open a role's home: Admin's switch between home screens, moved here from the top of
 * Settings so a role's home is one tap from where its cards are set (docs/decisions/2026-11-12-admin-home-simulation-subpage.md).
 * It shows a role's home tiles as that role sees them; it does not sign in as the role. Admin only, and the refusal is
 * the same one /home/[role] asks. No card: Admin sits outside the card system, so nothing here is a card's to give.
 */
export default async function WhoDoesWhatSimulatePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const perms = await loadPermissions();
  if (!perms?.isAdmin) refuseFor(perms);

  const [{ t }, roles] = await Promise.all([getT(), listHomeRoles(supabase)]);

  return (
    <main className="flex min-w-0 flex-1 flex-col gap-6 p-4 sm:p-6">
      <div className="min-w-0">
        <Link href={WHO_DOES_WHAT_PATH} className="inline-flex min-h-11 items-center text-sm font-medium text-primary underline">
          {t.appHome.backToWhoDoesWhat}
        </Link>
        <h1 className="text-2xl font-semibold text-foreground">{t.appHome.simulateTitle}</h1>
        <p className="max-w-3xl text-sm text-muted [overflow-wrap:anywhere]">{t.appHome.simulateIntro}</p>
      </div>
      {/* No role is "current" here: nothing has been opened yet. */}
      <HomeSwitch roles={roles} current="" />
    </main>
  );
}
