import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { todayIso } from "@/lib/format";
import { VET_HOME_PATH } from "@/lib/auth/next-path";
import { TWO_STEP_PATH, getAssuranceLevel } from "@/lib/auth/two-step";
import { can } from "@/lib/permissions/can";
import { loadPermissions } from "@/lib/permissions/load";
import { loadMyAccessRequestTasks } from "@/lib/my-tasks/access-requests";
import { loadMyMaintenanceTasks } from "@/lib/my-tasks/maintenance";
import { loadMyRecurringTasks } from "@/lib/my-tasks/recurring";
import { loadMyDoneToday } from "@/lib/my-tasks/done-today";
import type { MyTaskSection } from "@/lib/my-tasks/types";
import { MyTaskList } from "./MyTaskList";

/**
 * /my — "what I need to do today": the work assigned to the signed-in
 * person, one section per source, each grouped overdue / today / later /
 * no date. Waiting access requests come first for admins — someone is
 * locked out until they are dealt with — then recurring jobs (0095), the
 * day's routine, then maintenance. The others (vet trips, medication rounds, stock orders)
 * plug in as further loaders returning the same MyTask shape
 * (src/lib/my-tasks/types.ts).
 *
 * A source the reader's role can't read is skipped rather than loaded
 * empty — vets have no maintenance policy, so theirs is the empty state.
 */
export default async function MyPage() {
  const { t, locale } = await getT();
  const supabase = await createClient();
  const today = todayIso();

  const [{ data: role }, { data: auth }, perms] = await Promise.all([
    supabase.rpc("current_user_role"),
    supabase.auth.getUser(),
    loadPermissions(),
  ]);
  // Tasks are shelter operations; a vet's home is their appointments. Which role lands where is
  // home-screens' (roles.home_path); until it is built a vet is still told by name.
  if (role === "vet") redirect(VET_HOME_PATH);
  const userId = auth.user?.id;

  const sections: MyTaskSection[] = userId
    ? await Promise.all([
        ...(perms?.isAdmin ? [loadMyAccessRequestTasks(t)] : []),
        ...(perms?.role.opensApp ? [loadMyRecurringTasks(supabase, userId, perms.role.key, t, today)] : []),
        ...(can(perms, "maintenance.jobs", "read")
          ? [loadMyMaintenanceTasks(supabase, userId, can(perms, "maintenance.jobs"), t, locale)]
          : []),
      ])
    : [];

  const done = userId
    ? await loadMyDoneToday(supabase, userId, today, locale)
    : { items: [], error: null };

  // An admin whose login has no authenticator app is prompted until it does.
  const needsTwoStep = !!perms?.isAdmin && !(await getAssuranceLevel()).enrolled;

  return (
    <main className="flex min-w-0 flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{t.my.pageTitle}</h1>
        <p className="text-sm text-muted">{t.my.pageSubtitle}</p>
      </div>

      {needsTwoStep && (
        <section className="flex flex-col gap-1 rounded-lg border border-warning/40 bg-warning/10 p-4">
          <h2 className="font-semibold text-foreground">{t.my.twoStepBanner.title}</h2>
          <p className="max-w-prose text-sm text-foreground">{t.my.twoStepBanner.about}</p>
          <Link href={TWO_STEP_PATH} className="w-fit text-sm font-medium text-primary underline">
            {t.my.twoStepBanner.open}
          </Link>
        </section>
      )}

      <MyTaskList
        sections={sections}
        doneToday={done.items}
        today={today}
        canManage={can(perms, "recurring.manage")}
        canEditMaintenance={can(perms, "maintenance.jobs")}
      />
    </main>
  );
}
