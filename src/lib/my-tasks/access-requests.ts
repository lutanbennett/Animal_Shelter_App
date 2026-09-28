import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { todayIso } from "@/lib/format";
import { getWaitingAccessRequests } from "@/lib/status/access-requests";
import type { MyTaskSection } from "./types";

/**
 * One row on every admin's My tasks while anyone is waiting for access:
 * "Review access requests", due the day the oldest one arrived, linking to
 * Settings → Security (through the 2-step step-up). Not a stored task —
 * it is worked out from the waiting requests each time, so it appears for
 * all admins at once and is gone for all of them as soon as the last
 * request is dealt with. It carries the count, never who is waiting.
 */
export async function loadMyAccessRequestTasks(t: Dictionary): Promise<MyTaskSection> {
  const section: MyTaskSection = { source: "accessRequests", tasks: [], error: null };
  const result = await getWaitingAccessRequests();
  const waiting = result.facts;
  if (!waiting) {
    section.error = result.error ?? null;
    return section;
  }
  if (waiting.count === 0) return section;

  section.tasks.push({
    key: "accessRequests:review",
    source: "accessRequests",
    title: t.my.accessRequests.title,
    about: t.my.accessRequests.about(waiting.count),
    due: waiting.oldestSince ? todayIso(new Date(waiting.oldestSince)) : null,
    href: "/admin/security",
    others: [],
    status: null,
    action: null,
  });
  return section;
}

/** For the nav badge: the row is always due today or overdue while it exists. */
export async function countMyUrgentAccessRequests(): Promise<number> {
  const { facts } = await getWaitingAccessRequests();
  return facts && facts.count > 0 ? 1 : 0;
}
