import { countWaitingAccessRequests, type WaitingAccessRequests } from "@/lib/auth/access-requests";
import { createAdminClient } from "@/lib/supabase/admin";
import { type CheckOutcome, type CheckResult, cached, forgetCached, runCheck } from "./run";

/**
 * Settings → System status, the Access requests card: how many logins are
 * waiting for a role and since when, readable at a normal sign-in because
 * it says nothing about who (src/lib/auth/access-requests.ts). The same
 * result puts a "Review access requests" row on every admin's My tasks.
 *
 * Amber while anyone waits — it needs an admin, nothing is broken — and
 * green when nobody does. Not part of the health report, so the alert
 * schedule never sees it: an access request is not an outage, and there
 * is no mail for one (decided 2026-09-28, docs/decisions.md).
 */
export async function checkAccessRequests(): Promise<CheckOutcome<WaitingAccessRequests>> {
  const { data, error } = await countWaitingAccessRequests(createAdminClient());
  if (error || !data) return { state: "fail", error: error ?? "No answer." };
  return { state: data.count > 0 ? "warn" : "ok", facts: data };
}

const CACHE_KEY = "access-requests";

/** Short timeout like the other checks; cached for the minute, so the nav can ask on every page. */
export function getWaitingAccessRequests(): Promise<CheckResult<WaitingAccessRequests>> {
  return cached(CACHE_KEY, () => runCheck(checkAccessRequests, 5_000));
}

/** After a Security change: the next read counts again. */
export function forgetWaitingAccessRequests(): void {
  forgetCached(CACHE_KEY);
}
