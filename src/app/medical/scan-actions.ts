"use server";

import { cookies } from "next/headers";
import { runWriteAction, type ActionResult, type WriteMessages } from "@/lib/action-result";
import { writeRequestIdFrom } from "@/lib/write-requests";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { loadPermissions } from "@/lib/permissions/load";
import { canOpen, routeFor } from "@/lib/permissions/routes";
import {
  CARD_WAIT_COOKIE,
  CARD_WAIT_JOBS,
  CARD_WAIT_MINUTES,
  encodeCardWait,
  isCardWaitJob,
} from "@/lib/residents/card-wait";

// PI FAILOVER (D), 2026-11-01: both writes here set or clear a cookie, so a replay would be harmless -- but
// the rule is "every write reachable at the address goes through runWriteAction()", not "every harmful one"
// (docs/decisions/2026-11-01-write-paths-admin-sweep.md section 6), and this one file sits on twelve addresses
// through ScanCardButton. If a third write is added here it goes through runWriteAction() too.

/** The words runWriteAction() needs; the same three for every write here. */
const write = (t: Dictionary): WriteMessages => ({
  somethingWentWrong: t.common.somethingWentWrong,
  saveUnknown: t.common.saveUnknown,
  reloadToSave: t.common.reloadToSave,
});

export type CardWaitResult = ActionResult<{ left: true }>;

/**
 * Scan card on an iPhone: leave the waiting marker for one job. Refused unless this person may open
 * that job now (nothing is widened for the scan). Returns whether it was left.
 * `formData` carries only the request id (WRITE_REQUEST_FIELD).
 */
export async function startCardWait(job: string, formData: FormData): Promise<CardWaitResult> {
  const { t } = await getT();
  const supabase = await createClient();
  return runWriteAction<{ left: true }>(
    "scan.startCardWait",
    write(t),
    { id: writeRequestIdFrom(formData), action: "scan.startCardWait", db: supabase },
    async () => {
      if (!isCardWaitJob(job)) return { ok: false, error: t.common.somethingWentWrong("card-wait") };
      const perms = await loadPermissions();
      const route = routeFor(CARD_WAIT_JOBS[job]);
      if (!route || !canOpen(perms, route)) return { ok: false, error: t.common.somethingWentWrong("card-wait") };
      (await cookies()).set(CARD_WAIT_COOKIE, encodeCardWait(job, Date.now()), {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: CARD_WAIT_MINUTES * 60,
      });
      return { ok: true, left: true };
    },
  );
}

/** "Stop waiting": clear the marker. */
export async function stopCardWait(formData: FormData): Promise<ActionResult<{ cleared: true }>> {
  const { t } = await getT();
  const supabase = await createClient();
  return runWriteAction<{ cleared: true }>(
    "scan.stopCardWait",
    write(t),
    { id: writeRequestIdFrom(formData), action: "scan.stopCardWait", db: supabase },
    async () => {
      (await cookies()).delete(CARD_WAIT_COOKIE);
      return { ok: true, cleared: true };
    },
  );
}
