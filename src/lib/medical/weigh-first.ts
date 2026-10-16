import type { createClient } from "@/lib/supabase/server";
import { todayIso } from "@/lib/format";
import type { PickableResident } from "./residents";

type Supabase = Awaited<ReturnType<typeof createClient>>;

/** A row of `weigh_first_visits()` (0207): three columns, and deliberately no more. */
type VisitRow = { resident_id: string; visit_at: string; clinic_name: string | null };

/** A resident "Weigh these first" is waiting on, with the visit that put it there. */
export type WeighFirst = {
  resident: PickableResident;
  /** The visit's instant, as stored. */
  visitAt: string;
  /** The visit's day on the shelter's calendar, YYYY-MM-DD. */
  visitDay: string;
  /** Yesterday or today at the shelter — which of the two the visit was. */
  when: "today" | "yesterday";
  clinicName: string | null;
};

/**
 * Residents seen by a vet yesterday or today with no weight since: the top of Record Weight.
 *
 * The visits come from `weigh_first_visits()` and nowhere else. The Head of Medical may not read
 * `clinic_visits` (0134) and must not gain that to make this page easier to build, so the function
 * is `security definer` and returns three columns — resident id, the instant, the clinic's name
 * (0207, docs/decisions/2026-10-16-weigh-these-first.md). The weight comparison is done here rather
 * than in the function because `weight` is a table she *can* read, so no widening buys anything.
 *
 * `residents` is the picker's own list, and a visit whose resident is not in it is dropped: that is
 * how a Deceased or Adopted resident, or one a login may not see at all, stays off the list without
 * this file deciding who may be seen.
 *
 * Dates are the shelter's throughout. A visit at 01:00 Bangkok is *today* and the previous day in
 * UTC, so the day comes from `todayIso(instant)` (the shelter-date helper), never from the ISO
 * string's own first ten characters.
 */
export async function loadWeighFirst(
  supabase: Supabase,
  residents: PickableResident[],
  /** The instant "today" is read from. A parameter so the Bangkok boundary can be asserted at a
   *  fixed instant rather than waited for: weigh-first.test.mjs runs both sides of 17:00Z. */
  now: Date | number = Date.now(),
): Promise<{ waiting: WeighFirst[]; error: string | null }> {
  // Cast rather than `.returns<>()`: the generated types read a table-returning function as one
  // row, so the array shape is asserted here as it is for `recurring_job_dates`.
  const { data: raw, error } = await supabase.rpc("weigh_first_visits");
  if (error) return { waiting: [], error: error.message };
  const visits = ((raw ?? null) as VisitRow[] | null) ?? [];
  if (visits.length === 0) return { waiting: [], error: null };

  const byId = new Map(residents.map((r) => [r.id, r]));
  const today = todayIso(now);

  // One candidate per resident: the latest visit. Each visit wants a weight dated on or after its
  // own day, so the latest is the hardest to satisfy — if it is met, every earlier one is too.
  const latest = new Map<string, VisitRow>();
  for (const v of visits) {
    if (!byId.has(v.resident_id)) continue;
    const held = latest.get(v.resident_id);
    if (!held || v.visit_at > held.visit_at) latest.set(v.resident_id, v);
  }
  if (latest.size === 0) return { waiting: [], error: null };

  const days = new Map([...latest].map(([id, v]) => [id, todayIso(new Date(v.visit_at))]));
  const earliest = [...days.values()].sort()[0];

  // Weights on or after the earliest day in play — enough to answer every candidate in one read.
  const { data: weights, error: weightError } = await supabase
    .from("weight")
    .select("resident_id, date")
    .is("archived_at", null)
    .in("resident_id", [...latest.keys()])
    .gte("date", earliest)
    .returns<{ resident_id: string; date: string }[]>();
  if (weightError) return { waiting: [], error: weightError.message };

  const weighedOn = new Map<string, string>();
  for (const w of weights ?? []) {
    const held = weighedOn.get(w.resident_id);
    if (!held || w.date > held) weighedOn.set(w.resident_id, w.date);
  }

  const waiting: WeighFirst[] = [];
  for (const [id, visit] of latest) {
    const day = days.get(id)!;
    const weighed = weighedOn.get(id);
    if (weighed && weighed >= day) continue; // Already weighed on or after the visit's day.
    waiting.push({
      resident: byId.get(id)!,
      visitAt: visit.visit_at,
      visitDay: day,
      when: day >= today ? "today" : "yesterday",
      clinicName: visit.clinic_name,
    });
  }

  // Longest wait first: yesterday's visits before today's, each in time order.
  waiting.sort((a, b) => a.visitAt.localeCompare(b.visitAt));
  return { waiting, error: null };
}
