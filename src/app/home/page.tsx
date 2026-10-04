import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { refuseFor } from "@/lib/auth/require-role";
import { safeNextPath, VET_HOME_PATH } from "@/lib/auth/next-path";
import { loadPermissions } from "@/lib/permissions/load";
import { deviceFrom } from "@/lib/home/device";
import { listHomeRoles } from "@/lib/home/roles";
import { homeTilesFor } from "@/lib/home/tiles";
import { getT } from "@/lib/i18n/get-t";
import { HomeTiles } from "@/components/HomeTiles";

/**
 * /home — where a sign-in lands (§8). It decides, then either redirects or draws:
 *
 *  - Admin: one login, the home follows the device. A phone goes to the Management home, anything
 *    larger to Settings (src/lib/home/device.ts). The switch on both opens the others.
 *  - A role with a configured landing page (`roles.home_path`): there.
 *  - A role whose clinical scope is its own clinic (the vet): its appointments, as before. The
 *    test is the scope, not the role's name.
 *  - Everyone else: their own home, one tile per page they may open (src/lib/home/tiles.ts).
 *
 * The device is asked afresh at every landing; nothing is stored.
 */
export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const perms = await loadPermissions();
  if (!perms?.role.opensApp) refuseFor(perms);

  if (perms.isAdmin) {
    const h = await headers();
    const device = deviceFrom(h.get("user-agent"), h.get("sec-ch-ua-mobile"));
    if (device === "desk") redirect("/admin");
    const roles = await listHomeRoles(supabase);
    const management = roles.find((r) => r.key === "management") ?? roles[0];
    redirect(management ? `/home/${management.key}` : "/admin");
  }

  const configured = safeNextPath(perms.role.homePath);
  if (configured && configured !== "/home") redirect(configured);
  if (perms.scopes.clinical === "own_clinic") redirect(VET_HOME_PATH);

  const { t } = await getT();
  const tiles = homeTilesFor(perms, t);

  return (
    <main className="flex min-w-0 flex-1 flex-col gap-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{t.appHome.pageTitle}</h1>
        <p className="text-sm text-muted">{t.appHome.subtitle}</p>
      </div>
      {tiles.length > 0 ? (
        <HomeTiles tiles={tiles} />
      ) : (
        <section className="rounded-lg border border-border bg-surface p-4">
          <h2 className="font-semibold text-foreground">{t.appHome.emptyTitle}</h2>
          <p className="text-sm text-muted">{t.appHome.empty}</p>
        </section>
      )}
    </main>
  );
}
