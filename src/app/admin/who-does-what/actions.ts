"use server";

import { revalidatePath } from "next/cache";
import { databaseFailure, runAction, type ActionResult } from "@/lib/action-result";
import { hasAdminRole } from "@/lib/auth/require-admin";
import { hasTwoStep } from "@/lib/auth/two-step";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { ACTIVITIES, isActivityKey } from "@/lib/permissions/catalogue";
import { checkChange } from "@/lib/permissions/prerequisites";
import { fixedFor } from "@/lib/permissions/fixed-for-now";

/**
 * Settings → Who does what: change one box. Saved at once, as the admin's own session, so role_permissions'
 * own rules (0132: Admin, at aal2) are the enforcement and the change reaches audit_log, and so Recent
 * changes, through the table's trigger. The checks here answer in words first, and they are the fixed rules
 * of docs/roles-and-permissions.md §6 held on the server, so a hand-made call fares no better than the page:
 *   Admin's column and the public viewer are not cells (the role must be an editable, live one);
 *   Admin is the only editor, with the authenticator app (so there is always someone able to edit);
 *   a box cannot outrank its prerequisites (prerequisites.ts).
 * A doctor's clinic boxes are the clinic rule's, not cells the system obeys, so they are not editable either.
 */
export async function setCell(roleKey: string, activity: string, level: number): Promise<ActionResult> {
  const { t } = await getT();
  return runAction("whoDoesWhat.setCell", t.common.somethingWentWrong, async () => {
    const w = t.admin.whoDoesWhat.edit;
    if (!(await hasAdminRole())) return { ok: false, error: w.adminOnly };
    if (!(await hasTwoStep())) return { ok: false, error: w.twoStepRequired };
    if (!isActivityKey(activity)) return { ok: false, error: t.common.somethingWentWrong("activity") };
    const kind = ACTIVITIES.find((a) => a.key === activity)?.kind;
    // Yes/No boxes are 0 or 2, the rest 0, 1 or 2 (role_permissions_guard says the same).
    if (!(kind === "yesno" ? [0, 2] : [0, 1, 2]).includes(level)) return { ok: false, error: t.common.somethingWentWrong("level") };
    if (fixedFor(roleKey, activity).some((e) => e.id === "clinicRule")) return { ok: false, error: w.clinicRule };

    const supabase = await createClient();
    const { data: roles } = await supabase
      .from("roles")
      .select("id, kind, opens_app")
      .eq("key", roleKey)
      .is("archived_at", null)
      .limit(1)
      .returns<{ id: string; kind: string; opens_app: boolean }[]>();
    const role = roles?.[0];
    // Admin and the public viewer are kind 'fixed': a rule, not a column (§6 rules 1 and 4).
    if (!role || role.kind === "fixed" || !role.opens_app) return { ok: false, error: w.noSuchRole };

    const { data: cellRows, error: readError } = await supabase
      .from("role_permissions")
      .select("activity, level")
      .eq("role_id", role.id)
      .returns<{ activity: string; level: number }[]>();
    if (readError) return databaseFailure("whoDoesWhat.setCell", readError, t.common);
    const cells = new Map((cellRows ?? []).map((c) => [c.activity, Number(c.level)]));

    const refusal = checkChange((a) => cells.get(a) ?? 0, activity, level);
    if (!refusal.ok) {
      const rule = refusal.rule;
      return {
        ok: false,
        error: refusal.kind === "needs" ? w.needs[rule.id] : w.neededBy[rule.id],
      };
    }

    const { error } =
      level === 0
        ? await supabase.from("role_permissions").delete().eq("role_id", role.id).eq("activity", activity)
        : await supabase.from("role_permissions").upsert({ role_id: role.id, activity, level }, { onConflict: "role_id,activity" });
    if (error) return databaseFailure("whoDoesWhat.setCell", error, t.common);

    revalidatePath("/admin/who-does-what");
    revalidatePath("/outreach");
    return { ok: true };
  });
}
