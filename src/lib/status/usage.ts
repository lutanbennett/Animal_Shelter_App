import { createAdminClient } from "@/lib/supabase/admin";
import { type CheckOutcome, type CheckResult, cached, runCheck } from "./run";

/**
 * Settings → System status, the usage half: plain counts over a period.
 * Each figure is its own check (runCheck: timeout, never throws), so one
 * slow count greys out one line instead of the page.
 */

export const USAGE_PERIODS = [7, 30, 90] as const;
export type UsagePeriod = (typeof USAGE_PERIODS)[number];

export function parsePeriod(value: string | string[] | undefined): UsagePeriod {
  const n = Number(Array.isArray(value) ? value[0] : value);
  return (USAGE_PERIODS as readonly number[]).includes(n) ? (n as UsagePeriod) : 30;
}

const sinceIso = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString();

/** Rows in a table whose timestamp column falls in the period; head-only, no rows travel. */
async function countSince(table: string, column: string, since: string): Promise<number> {
  const { count, error } = await createAdminClient()
    .from(table)
    .select("id", { count: "exact", head: true })
    .gte(column, since);
  if (error) throw new Error(`${table}: ${error.message}`);
  return count ?? 0;
}

export type SignInFacts = { signedIn: number; accounts: number };

/**
 * People whose most recent sign-in falls in the period, out of every
 * account. Supabase keeps only the last sign-in per account where the app
 * can read it (auth.users.last_sign_in_at); its audit log of every sign-in
 * isn't exposed to the API, so this is active people, not a count of
 * sign-ins.
 */
export async function countSignIns(days: number): Promise<CheckOutcome<SignInFacts>> {
  const since = Date.now() - days * 86_400_000;
  const admin = createAdminClient();
  let signedIn = 0;
  let accounts = 0;
  for (let page = 1; ; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error(error.message);
    for (const user of data.users) {
      accounts++;
      if (user.last_sign_in_at && Date.parse(user.last_sign_in_at) >= since) signedIn++;
    }
    if (data.users.length < 1000) break;
  }
  return { state: "ok", facts: { signedIn, accounts } };
}

export type RecordFacts = { residents: number; vetVisits: number; weights: number; maintenanceJobs: number };

export async function countRecords(days: number): Promise<CheckOutcome<RecordFacts>> {
  const since = sinceIso(days);
  const [residents, vetVisits, weights, maintenanceJobs] = await Promise.all([
    countSince("residents", "created_at", since),
    countSince("vet_appointments", "created_at", since),
    countSince("weight", "created_at", since),
    countSince("maintenance", "created_at", since),
  ]);
  return { state: "ok", facts: { residents, vetVisits, weights, maintenanceJobs } };
}

export type UploadFacts = { total: number };

/**
 * Every file the app put in Drive: resident photos and documents
 * (attachments, which also holds blood-test and procedure files),
 * maintenance and project photos, and the website's gallery.
 */
export async function countUploads(days: number): Promise<CheckOutcome<UploadFacts>> {
  const since = sinceIso(days);
  const counts = await Promise.all([
    countSince("attachments", "uploaded_at", since),
    countSince("maintenance_photos", "uploaded_at", since),
    countSince("project_photos", "uploaded_at", since),
    countSince("site_content_photos", "created_at", since),
  ]);
  return { state: "ok", facts: { total: counts.reduce((a, b) => a + b, 0) } };
}

export type AssistantFacts = { requests: number };

export async function countAssistantRequests(days: number): Promise<CheckOutcome<AssistantFacts>> {
  return { state: "ok", facts: { requests: await countSince("assistant_actions", "created_at", sinceIso(days)) } };
}

export type VisitorFacts = { pageViews: number; dailyVisitorsSummed: number };

/**
 * Public-site visitors from Cloudflare's own aggregate zone analytics
 * (GraphQL Analytics API, httpRequests1dGroups): totals per day, summed.
 * No cookie, no script, nothing per visitor — /privacy promises "no
 * analytics tracking", and these are counts Cloudflare already keeps from
 * the connection logs that page mentions (docs/decisions.md, 2026-09-26).
 *
 * Needs a Cloudflare API token with Zone → Analytics → Read in
 * CLOUDFLARE_ANALYTICS_TOKEN and the zone's id in CLOUDFLARE_ZONE_ID; grey
 * until both are set. Counts are for the whole zone, so they include
 * test.lannacare.org and staff.
 */
export async function countVisitors(days: number): Promise<CheckOutcome<VisitorFacts>> {
  const token = process.env.CLOUDFLARE_ANALYTICS_TOKEN;
  const zone = process.env.CLOUDFLARE_ZONE_ID;
  if (!token || !zone) return { state: "off" };

  const day = (offset: number) => new Date(Date.now() - offset * 86_400_000).toISOString().slice(0, 10);
  const res = await fetch("https://api.cloudflare.com/client/v4/graphql", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      query: `query($zone: String!, $from: Date!, $to: Date!) {
        viewer { zones(filter: { zoneTag: $zone }) {
          httpRequests1dGroups(limit: 100, filter: { date_geq: $from, date_leq: $to }) {
            sum { pageViews }
            uniq { uniques }
          }
        } }
      }`,
      variables: { zone, from: day(days - 1), to: day(0) },
    }),
    signal: AbortSignal.timeout(6_000),
  });
  type Group = { sum: { pageViews: number }; uniq: { uniques: number } };
  const body = (await res.json().catch(() => null)) as {
    data?: { viewer?: { zones?: { httpRequests1dGroups?: Group[] }[] } };
    errors?: { message: string }[] | null;
  } | null;
  if (!res.ok || body?.errors?.length || !body?.data) {
    throw new Error(`Cloudflare analytics: ${body?.errors?.map((e) => e.message).join("; ") || `HTTP ${res.status}`}`);
  }
  const groups = body.data.viewer?.zones?.[0]?.httpRequests1dGroups ?? [];
  return {
    state: "ok",
    facts: {
      pageViews: groups.reduce((a, g) => a + g.sum.pageViews, 0),
      dailyVisitorsSummed: groups.reduce((a, g) => a + g.uniq.uniques, 0),
    },
  };
}

export type UsageReport = {
  days: UsagePeriod;
  signIns: CheckResult<SignInFacts>;
  records: CheckResult<RecordFacts>;
  uploads: CheckResult<UploadFacts>;
  assistant: CheckResult<AssistantFacts>;
  visitors: CheckResult<VisitorFacts>;
};

export function getUsageReport(days: UsagePeriod): Promise<UsageReport> {
  return cached(`usage:${days}`, async () => {
    const [signIns, records, uploads, assistant, visitors] = await Promise.all([
      runCheck(() => countSignIns(days)),
      runCheck(() => countRecords(days)),
      runCheck(() => countUploads(days)),
      runCheck(() => countAssistantRequests(days)),
      runCheck(() => countVisitors(days)),
    ]);
    return { days, signIns, records, uploads, assistant, visitors };
  });
}
