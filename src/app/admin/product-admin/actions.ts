"use server";

import { revalidatePath } from "next/cache";
import { type ActionResult, databaseFailure, runWriteAction, type WriteMessages } from "@/lib/action-result";
import { hasTwoStep } from "@/lib/auth/two-step";
import { isProductAdmin } from "@/lib/auth/product-admin";
import { getT } from "@/lib/i18n/get-t";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { createClient } from "@/lib/supabase/server";

/*
 * Add and remove a product administrator (#shmgt). The checks here are the courtesy: the database is the
 * security. 0411's policies answer is_product_admin() for insert and delete and a restrictive policy demands
 * aal2 on both, so a press that gets past these checks by a forged request is still refused there.
 * Both go through the signed-in client; no service role is used (docs/decisions/2026-11-18-product-admin-screen.md).
 */

const write = (t: Dictionary): WriteMessages => ({
  somethingWentWrong: t.common.somethingWentWrong,
  saveUnknown: t.common.saveUnknown,
  reloadToSave: t.common.reloadToSave,
});

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function addProductAdmin(userId: string, requestId: string | null): Promise<ActionResult> {
  const { t } = await getT();
  const e = t.admin.productAdmin.errors;
  const supabase = await createClient();
  return runWriteAction("productAdmin.add", write(t), { id: requestId, action: "productAdmin.add", db: supabase }, async () => {
    if (!(await isProductAdmin())) return { ok: false, error: e.notProductAdmin };
    if (!(await hasTwoStep())) return { ok: false, error: e.needsTwoStep };
    const id = userId.trim();
    if (!UUID.test(id)) return { ok: false, error: e.badId };
    const { error } = await supabase.from("product_admins").insert({ user_id: id });
    if (error) {
      // 23503: no auth.users row has that id (the foreign key to auth.users).
      if (error.code === "23503") return { ok: false, error: e.unknownAccount };
      return databaseFailure("productAdmin.add", error, t.common);
    }
    revalidatePath("/admin/product-admin");
    return { ok: true };
  });
}

export async function removeProductAdmin(userId: string, requestId: string | null): Promise<ActionResult> {
  const { t } = await getT();
  const e = t.admin.productAdmin.errors;
  const supabase = await createClient();
  return runWriteAction("productAdmin.remove", write(t), { id: requestId, action: "productAdmin.remove", db: supabase }, async () => {
    if (!(await isProductAdmin())) return { ok: false, error: e.notProductAdmin };
    if (!(await hasTwoStep())) return { ok: false, error: e.needsTwoStep };
    const {
      data: { user },
    } = await supabase.auth.getUser();
    // Not a permission: it stops the list being emptied by one press. Someone else removes you.
    if (!user || user.id === userId) return { ok: false, error: e.lastOne };
    const { error } = await supabase.from("product_admins").delete().eq("user_id", userId);
    if (error) return databaseFailure("productAdmin.remove", error, t.common);
    revalidatePath("/admin/product-admin");
    return { ok: true };
  });
}
