"use server";

import { revalidatePath } from "next/cache";
import { assertAdminRole } from "@/lib/auth/require-admin";
import { clearStatusCache } from "@/lib/status/run";

/** "Check now": forget the minute's cached results and render again. */
export async function checkNow() {
  await assertAdminRole();
  clearStatusCache();
  revalidatePath("/admin/status");
}
