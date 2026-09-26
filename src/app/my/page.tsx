import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { todayIso } from "@/lib/format";
import { canManage } from "@/lib/auth/require-management";
import { canReadMaintenance } from "@/lib/maintenance/queries";
import { canReadRecurringJobs } from "@/lib/recurring-jobs/access";
import { loadMyMaintenanceTasks } from "@/lib/my-tasks/maintenance";
import { loadMyRecurringTasks } from "@/lib/my-tasks/recurring";
import type { MyTaskSection } from "@/lib/my-tasks/types";
import { MyTaskList } from "./MyTaskList";

/**
 * /my — "what I need to do today": the work assigned to the signed-in
 * person, one section per source, each grouped overdue / today / later /
 * no date. Recurring jobs (0095) come first — they are the day's routine —
 * then maintenance. The others (vet trips, medication rounds, stock orders)
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

  const [{ data: role }, { data: auth }] = await Promise.all([
    supabase.rpc("current_user_role"),
    supabase.auth.getUser(),
  ]);
  const userId = auth.user?.id;

  const sections: MyTaskSection[] = userId
    ? await Promise.all([
        ...(canReadRecurringJobs(role) ? [loadMyRecurringTasks(supabase, userId, t, today)] : []),
        ...(canReadMaintenance(role) ? [loadMyMaintenanceTasks(supabase, userId, role, t, locale)] : []),
      ])
    : [];

  return (
    <main className="flex min-w-0 flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{t.my.pageTitle}</h1>
        <p className="text-sm text-muted">{t.my.pageSubtitle}</p>
      </div>

      <MyTaskList sections={sections} today={today} canManage={canManage(role)} />
    </main>
  );
}
