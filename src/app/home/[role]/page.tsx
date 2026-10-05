import { notFound, redirect } from "next/navigation";
import { refuseFor } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { loadPermissions } from "@/lib/permissions/load";
import { listHomeRoles, loadRolePermissions } from "@/lib/home/roles";
import { homeTilesFor } from "@/lib/home/tiles";
import { getT } from "@/lib/i18n/get-t";
import { HomeTiles } from "@/components/HomeTiles";
import { HomeSwitch } from "@/components/HomeSwitch";
import Link from "next/link";

/**
 * /home/<role> — another role's home screen, as that role sees it. Admin only (§8): it is how the
 * Director sees what the 2IC sees when the 2IC rings to say something is wrong, and how her phone
 * gets the Management home.
 *
 * The refusal is here, on the server, for everyone who is not Admin, including a role asking for
 * its own key (their home is /home). Hiding the switch is only courtesy. The role's cells are read
 * with Admin's own session, which RLS lets read them and nobody else (0132).
 *
 * The tiles are the role's, but they open the real pages as the person looking, who is Admin: this
 * shows the screen, it does not become the role.
 */
export default async function RoleHomePage(props: PageProps<"/home/[role]">) {
  const { role: roleKey } = await props.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const mine = await loadPermissions();
  if (!mine?.isAdmin) refuseFor(mine);
  if (roleKey === "admin") redirect("/admin");

  const [roles, perms, { t, locale }] = await Promise.all([
    listHomeRoles(supabase),
    loadRolePermissions(supabase, roleKey),
    getT(),
  ]);
  // A role that does not exist, is archived, or does not open the app has no home to show.
  const listed = roles.find((r) => r.key === roleKey);
  if (!perms || !listed) notFound();

  const name = (locale === "th" && listed.nameTh) || listed.name;
  const tiles = homeTilesFor(perms, t);

  return (
    <main className="flex min-w-0 flex-1 flex-col gap-6 p-4 sm:p-6">
      <HomeSwitch roles={roles} current={roleKey} />
      <div>
        <h1 className="text-2xl font-semibold text-foreground [overflow-wrap:anywhere]">{name}</h1>
        <p className="text-sm text-muted">{t.appHome.viewing(name)}</p>
        {/* The Director's first-draft review (docs/decisions/2026-10-05-director-draft-roles.md): English only, goes when the draft is signed. */}
        <Link href={`/admin/role-draft#${roleKey}`} className="inline-flex min-h-11 items-center text-sm font-medium text-primary underline">
          What this role can and cannot do, in words
        </Link>
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
