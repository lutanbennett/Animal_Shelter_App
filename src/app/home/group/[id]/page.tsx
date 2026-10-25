import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { refuseFor } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { entersApp } from "@/lib/permissions/can";
import { loadPermissions } from "@/lib/permissions/load";
import { loadGroup, loadRoleCards, loadRolePermissions } from "@/lib/home/roles";
import { cardTilesFor, groupHref, withCounts } from "@/lib/home/tiles";
import { loadUrgentCounts } from "@/lib/my-tasks/urgent";
import { countBillsWaiting } from "@/lib/bills/waiting";
import { countPhotosWaiting } from "@/lib/photos/approval";
import { getT } from "@/lib/i18n/get-t";
import { HomeTiles } from "@/components/HomeTiles";

/**
 * /home/group/<id> — a group's own page: the cards behind one doorway tile on a role's home (role_groups, 0241).
 * docs/decisions/2026-10-21-tile-groups-app.md
 *
 * A GROUP GRANTS NOTHING. The tiles here are drawn by the very function that draws the home (cardTilesFor), against the
 * reader's own permissions, so a card the reader could not open from the home is not here either, and each page a tile
 * opens still runs its own guard. Who may look: someone holding the group's role, or Admin (who sees it as that role
 * sees it, the way /home/<role> shows a home). Anyone else gets "not found", not the group's name.
 */
export default async function GroupPage(props: PageProps<"/home/group/[id]">) {
  const { id } = await props.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const mine = await loadPermissions();
  if (!mine || !entersApp(mine)) refuseFor(mine);

  const { t, locale } = await getT();
  const found = await loadGroup(id, locale);
  if (!found) notFound();
  const { roleKey } = found;

  const holds = mine.roles.length > 0 ? mine.roles.includes(roleKey) : mine.role.key === roleKey;
  if (!mine.isAdmin && !holds) notFound();
  // Admin previews the role's screen; everyone else is drawn with their own permissions, exactly as their home is.
  const perms = mine.isAdmin ? await loadRolePermissions(supabase, roleKey) : mine;
  if (!perms) notFound();

  const home = await loadRoleCards(roleKey, locale);
  const counts = mine.isAdmin
    ? { photosWaiting: await countPhotosWaiting(supabase, perms) }
    : { ...(await loadUrgentCounts(supabase, perms, user.id)), photosWaiting: await countPhotosWaiting(supabase, perms) };
  const drawn = withCounts(
    cardTilesFor(home.cards, perms, t, await countBillsWaiting(supabase, perms), home.groups),
    t,
    "total" in counts ? { my: counts.total, maintenance: counts.maintenance, photosWaiting: counts.photosWaiting } : counts,
  );
  const tiles = drawn.find((x) => x.href === groupHref(id))?.inside ?? [];
  const back = mine.isAdmin ? `/home/${roleKey}` : "/home";

  return (
    <main className="flex min-w-0 flex-1 flex-col gap-6 p-4 sm:p-6">
      <div>
        <Link href={back} className="inline-flex min-h-11 items-center text-sm font-medium text-primary underline">
          {t.appHome.group.back}
        </Link>
        <h1 className="text-2xl font-semibold text-foreground [overflow-wrap:anywhere]">{found.group.label}</h1>
        <p className="text-sm text-muted">{t.appHome.subtitle}</p>
      </div>
      {tiles.length > 0 ? (
        <HomeTiles tiles={tiles} />
      ) : (
        <section className="rounded-lg border border-border bg-surface p-4">
          <h2 className="font-semibold text-foreground">{t.appHome.group.emptyTitle}</h2>
          <p className="text-sm text-muted">{t.appHome.group.empty}</p>
        </section>
      )}
    </main>
  );
}
