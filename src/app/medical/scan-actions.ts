"use server";

import { cookies } from "next/headers";
import { loadPermissions } from "@/lib/permissions/load";
import { canOpen, routeFor } from "@/lib/permissions/routes";
import {
  CARD_WAIT_COOKIE,
  CARD_WAIT_JOBS,
  CARD_WAIT_MINUTES,
  encodeCardWait,
  isCardWaitJob,
} from "@/lib/residents/card-wait";

/**
 * Scan card on an iPhone: leave the waiting marker for one job. Refused unless this person may open
 * that job now (nothing is widened for the scan). Returns whether it was left.
 */
export async function startCardWait(job: string): Promise<{ ok: boolean }> {
  if (!isCardWaitJob(job)) return { ok: false };
  const perms = await loadPermissions();
  const route = routeFor(CARD_WAIT_JOBS[job]);
  if (!route || !canOpen(perms, route)) return { ok: false };
  (await cookies()).set(CARD_WAIT_COOKIE, encodeCardWait(job, Date.now()), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: CARD_WAIT_MINUTES * 60,
  });
  return { ok: true };
}

/** "Stop waiting": clear the marker. */
export async function stopCardWait(): Promise<void> {
  (await cookies()).delete(CARD_WAIT_COOKIE);
}
