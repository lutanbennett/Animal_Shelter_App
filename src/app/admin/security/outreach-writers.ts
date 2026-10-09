"use server";

import { revalidatePath } from "next/cache";
import { databaseFailure, runAction, type ActionResult } from "@/lib/action-result";
import { hasAdminRole } from "@/lib/auth/require-admin";
import { hasTwoStep } from "@/lib/auth/two-step";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";

/**
 * Who may write outreach notes: one cell, community.outings, per role (0169).
 * The Director's answer was "Management for now — can this be an option to
 * change later in Settings", so this writes that cell and nothing else; no
 * policy or page names a role. It writes as the admin's own session, so
 * role_permissions' own rules (0132: Admin, at aal2) are the enforcement and
 * the change reaches audit_log through the table's trigger. The checks here
 * answer in words first.
 */
const ACTIVITY = "community.outings";

export async function setOutreachWriterLevel(roleKey: string, level: 0 | 1 | 2): Promise<ActionResult> {
  const { t } = await getT();
  return runAction("security.setOutreachWriterLevel", t.common.somethingWentWrong, async () => {
    const e = t.admin.security.errors;
    if (!(await hasAdminRole())) return { ok: false, error: e.adminAccessRequired };
    if (!(await hasTwoStep())) return { ok: false, error: e.twoStepRequired };
    if (![0, 1, 2].includes(level)) return { ok: false, error: t.common.somethingWentWrong("level") };
    // Admin's column is a rule, not data (§6): there is no cell to set.
    if (roleKey === "admin") return { ok: false, error: t.common.somethingWentWrong("admin") };

    const supabase = await createClient();
    const { data: roles } = await supabase
      .from("roles")
      .select("id")
      .eq("key", roleKey)
      .is("archived_at", null)
      .limit(1)
      .returns<{ id: string }[]>();
    const role = roles?.[0];
    if (!role) return { ok: false, error: t.outreach.writers.noRoles };

    const { error } =
      level === 0
        ? await supabase.from("role_permissions").delete().eq("role_id", role.id).eq("activity", ACTIVITY)
        : await supabase
            .from("role_permissions")
            .upsert({ role_id: role.id, activity: ACTIVITY, level }, { onConflict: "role_id,activity" });
    if (error) return databaseFailure("security.setOutreachWriterLevel", error, t.common);

    revalidatePath("/admin/security");
    revalidatePath("/outreach");
    return { ok: true };
  });
}
