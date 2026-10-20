import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { refuseFor } from "@/lib/auth/require-role";
import { loadPermissions } from "@/lib/permissions/load";
import { deviceFrom } from "@/lib/home/device";
import { listHomeRoles, loadCardsByRole, loadHomeTilesByRole } from "@/lib/home/roles";
import { homeGroupsForRoles } from "@/lib/home/tiles";
import { loadUrgentCounts } from "@/lib/my-tasks/urgent";
import { countBillsWaiting } from "@/lib/bills/waiting";
import { countPhotosWaiting } from "@/lib/photos/approval";
import { getT } from "@/lib/i18n/get-t";
import { HomeTiles } from "@/components/HomeTiles";
import { HomeGroups } from "@/components/HomeGroups";
import { loadHeldRoles } from "@/lib/auth/held-roles";
import { formatDate, todayIso } from "@/lib/format";

/**
 * /home — where a sign-in lands (§8). It decides, then either redirects or draws:
 *
 *  - Admin: one login, the home follows the device. A phone goes to the Management home, anything
 *    larger to Settings (src/lib/home/device.ts). The switch on both opens the others.
 *  - Every other role: its own home, its who-does-what tiles (src/lib/home/tiles.ts). Nothing
 *    redirects away from it any more: not `roles.home_path` (a landing page nothing sets, left
 *    unread) and not the clinic scope (the doctor's old hard-coded Appointments, which its own cells
 *    refused). Lutan, 2026-10-18: "the Home Screen should be their tiles as defined by the who does
 *    what feature" (docs/decisions/2026-10-18-role-home-is-tiles.md). A role whose cards draw
 *    nothing sees the empty state below, which is a finding about its cards, not a page to redirect.
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

  const { t, locale } = await getT();
  const urgent = await loadUrgentCounts(supabase, perms, user.id);
  const groups = homeGroupsForRoles(perms, t, await countBillsWaiting(supabase, perms), await loadCardsByRole(perms.roles), {
    my: urgent.total,
    maintenance: urgent.maintenance,
    photosWaiting: await countPhotosWaiting(supabase, perms),
  }, await loadHomeTilesByRole(perms.roles));

  const tiles = groups.flatMap((g) => g.tiles);
  const held = groups.length > 1 ? await loadHeldRoles(user.id) : [];
  const views = groups.map((g) => {
    const r = held.find((h) => h.key === g.roleKey);
    const name = (locale === "th" && r?.nameTh) || r?.name || g.roleKey;
    return {
      key: g.roleKey,
      heading: name,
      sub: r && !r.isMain && r.endsOn ? t.appHome.coveringUntil(formatDate(r.endsOn, locale)) : undefined,
      tabLabel: r?.isMain ? t.appHome.myJob : name,
      tiles: g.tiles,
    };
  });

  return (
    <main className="flex min-w-0 flex-1 flex-col gap-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{t.appHome.pageTitle}</h1>
        <p className="text-sm text-muted">{t.appHome.subtitle}</p>
      </div>
      {tiles.length > 0 ? (
        views.length > 1 ? <HomeGroups groups={views} today={todayIso()} label={t.appHome.groupsLabel} /> : <HomeTiles tiles={tiles} />
      ) : (
        <section className="rounded-lg border border-border bg-surface p-4">
          <h2 className="font-semibold text-foreground">{t.appHome.emptyTitle}</h2>
          <p className="text-sm text-muted">{t.appHome.empty}</p>
        </section>
      )}
    </main>
  );
}
