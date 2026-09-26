import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { todayIso } from "@/lib/format";
import { canReadMaintenance } from "@/lib/maintenance/queries";
import { loadMyMaintenanceTasks } from "@/lib/my-tasks/maintenance";
import type { MyTaskSection } from "@/lib/my-tasks/types";
import { MyTaskList } from "./MyTaskList";

/**
 * /my — "what I need to do today": the work assigned to the signed-in
 * person, one section per source, each grouped overdue / today / later /
 * no date. Maintenance is the only source so far; the others (vet trips,
 * medication rounds, stock orders) plug in as further loaders returning
 * the same MyTask shape (src/lib/my-tasks/types.ts).
 *
 * A source the reader's role can't read is skipped rather than loaded
 * empty — vets have no maintenance policy, so theirs is the empty state.
 */
export default async function MyPage() {
  const { t, locale } = await getT();
  const supabase = await createClient();

  const [{ data: role }, { data: auth }] = await Promise.all([
    supabase.rpc("current_user_role"),
    supabase.auth.getUser(),
  ]);
  const userId = auth.user?.id;

  const sections: MyTaskSection[] = [];
  if (userId && canReadMaintenance(role)) {
    sections.push(await loadMyMaintenanceTasks(supabase, userId, role, t, locale));
  }

  return (
    <main className="flex min-w-0 flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{t.my.pageTitle}</h1>
        <p className="text-sm text-muted">{t.my.pageSubtitle}</p>
      </div>

      <MyTaskList sections={sections} today={todayIso()} />
    </main>
  );
}
