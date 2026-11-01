/**
 * Pi failover (C): the facts about a write request that the browser, the
 * server action and the Worker all have to agree on.
 *
 * `docs/decisions/2026-10-31-write-requests-schema.md` is the paper for the
 * table this serves; `docs/decisions/2026-10-31-write-request-wrapper.md` is
 * the paper for this file and says why the one-transaction guarantee is NOT
 * what a shared wrapper can give.
 *
 * Plain data and one uuid call: no server imports, no React, nothing from
 * `next/`. It is imported by a client component, by a Server Action and by
 * `worker/origin.mjs` under Node's type stripping, so it must stay that way.
 */

/**
 * The form field (and server-action argument) the request id travels in.
 *
 * It is a FIELD and not a header because a Next.js Server Action's POST is
 * made by React's own fetch, which the app cannot add a header to. It is not a
 * cookie either: a cookie left over from a previous save would tell the Worker
 * that an unwrapped write was safe to replay, which is exactly the double
 * write this programme exists to prevent.
 */
export const WRITE_REQUEST_FIELD = "__writeRequest";

/** A fresh id for one save attempt. v4, from the platform's own generator. */
export function newWriteRequestId(): string {
  return crypto.randomUUID();
}

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** The id a form carried, or null when it carried nothing usable. */
export function writeRequestIdFrom(form: FormData): string | null {
  const value = form.get(WRITE_REQUEST_FIELD);
  return typeof value === "string" && UUID_V4.test(value) ? value : null;
}

/**
 * How long the Worker gives the Pi to answer a write before it falls back
 * (worker/origin.mjs, and ORIGIN_TIMEOUT_MS in wrangler.jsonc, which must
 * agree with this number).
 */
export const ORIGIN_ATTEMPT_MS = 20_000;

/**
 * What the Worker is then allowed for rendering the write itself. The option 5
 * measurement of 2026-10-31 has an intake save returning ok at 354 ms of CPU,
 * and wall time is mostly PostgREST round trips rather than CPU, so ten
 * seconds is generous rather than tight.
 */
export const WORKER_FALLBACK_MS = 10_000;

/**
 * How long the browser waits for a save before it stops waiting and says it
 * cannot tell (deliverable 4 of the (C) brief; requirement 5 of the schema
 * paper).
 *
 * WHY THIS NUMBER, and why it is a sum rather than a figure someone liked: the
 * limit must only ever fire AFTER both legs have had their chance, or it turns
 * a save that was about to succeed into an unknown. The Pi gets
 * ORIGIN_ATTEMPT_MS and the Worker's own render gets WORKER_FALLBACK_MS, so
 * the earliest moment at which there is genuinely nothing left to wait for is
 * their sum. It comes to 30 s, which is also the number the 2026-10-28 wedge
 * drill measured against (scripts/pi/drill-probe.mjs), so the drill's "4 of 85
 * writes hit the client's 30 s limit" stays comparable with what ships.
 *
 * Raising ORIGIN_TIMEOUT_MS in wrangler.jsonc without raising
 * ORIGIN_ATTEMPT_MS here would make the browser give up while the Worker is
 * still waiting on the Pi. Change the two together.
 */
export const WRITE_WAIT_MS = ORIGIN_ATTEMPT_MS + WORKER_FALLBACK_MS;

/**
 * THE PATHS WHOSE WRITES ARE ALL WRAPPED. The Worker replays a write locally,
 * after the Pi failed to answer it clearly, ONLY for a path on this list.
 *
 * THE RULE FOR ADDING ONE, and (D) owns it: a path goes on this list only when
 * EVERY write reachable at that path goes through runWriteAction(). A Server
 * Action POSTs to the page's own address, so one entry covers every action a
 * page hosts -- miss one and the Worker would replay an unclaimed write, which
 * is the #250 double write. Fail closed: leave a path off until its last write
 * is wrapped.
 *
 * Exact paths and prefixes ending in "/". Keep it alphabetical.
 */
export const WRAPPED_WRITE_PATHS = [
  "/",
  "/about",
  "/account/home-screen-icons",
  "/account/password",
  "/admin",
  "/admin/assistant",
  "/admin/blood-test-types",
  "/admin/diets",
  "/admin/diets/[id]",
  "/admin/diets/ingredients",
  "/admin/diets/ingredients/[id]",
  "/admin/enclosures",
  "/admin/facility-map",
  "/admin/immunization-types",
  "/admin/medications",
  "/admin/procedure-types",
  "/admin/recent-changes",
  "/admin/role-draft",
  "/admin/shop",
  "/admin/status",
  "/admin/stocktaking",
  "/admin/units",
  "/admin/website",
  "/admin/website/pages/[slug]",
  "/admin/who-does-what",
  "/admin/who-does-what/details",
  "/admin/who-does-what/features",
  "/admin/zones",
  "/adopt",
  "/adopt/[id]",
  "/adopt/international",
  "/adopt/journey/[id]",
  "/adopt/stories/[id]",
  "/appeals",
  "/appeals/[id]",
  "/appointments",
  "/assistant",
  "/bills",
  "/blood-tests/new",
  "/clinic-visits/[id]",
  "/clinic-visits/[id]/edit",
  "/clinic-visits/new",
  "/clinics",
  "/clinics/[id]",
  "/contacts",
  "/contacts/[id]",
  "/deliveries",
  "/diets/[id]/edit",
  "/diets/new",
  "/donate",
  "/e/[id]",
  "/enclosures",
  "/enclosures/[id]",
  "/foster",
  "/friends",
  "/friends/join",
  "/home",
  "/home/[role]",
  "/home/group/[id]",
  "/immunizations/new",
  "/login",
  "/login/forgot",
  "/login/request",
  "/maintenance",
  "/maintenance/[id]",
  "/maintenance/[id]/edit",
  "/maintenance/new",
  "/management",
  "/management/appeals",
  "/management/appeals/[id]",
  "/management/appeals/[id]/preview",
  "/management/appeals/new",
  "/management/cashflow",
  "/management/cashflow/fixed-outgoings",
  "/management/clinics",
  "/management/clinics/[id]/doctors",
  "/management/contacts",
  "/management/contacts/new",
  "/management/dashboard",
  "/management/desexing-drives",
  "/management/desexing-drives/[id]",
  "/management/desexing-drives/new",
  "/management/diets",
  "/management/donations",
  "/management/donations/[id]",
  "/management/donations/donors",
  "/management/donations/donors/[id]",
  "/management/donations/donors/new",
  "/management/donations/new",
  "/management/medication-list",
  "/management/medications",
  "/management/purchasing",
  "/management/recurring-jobs",
  "/management/shelter-friends",
  "/management/shelter-friends/new",
  "/management/stock-usage",
  "/management/translations",
  "/manual",
  "/medical/diets",
  "/medical/photos",
  "/medical/weight",
  "/memes",
  "/memes/[id]",
  "/memes/[id]/edit",
  "/memes/make",
  "/memes/new",
  "/my",
  "/no-access",
  "/operations",
  "/operations/feeding-list",
  "/operations/medication-list",
  "/our-work",
  "/our-work/[id]",
  "/outreach",
  "/outreach/[id]/edit",
  "/outreach/new",
  "/photos/add",
  "/photos/approve",
  "/prescriptions/[id]/edit",
  "/prescriptions/new",
  "/privacy",
  "/procedures/new",
  "/projects",
  "/projects/[id]",
  "/r/[code]",
  "/releases",
  "/residents",
  "/residents/[id]",
  "/residents/[id]/[section]",
  "/residents/[id]/adoption-updates/[updateId]/edit",
  "/residents/[id]/adoption-updates/new",
  "/residents/[id]/deceased",
  "/residents/[id]/deceased/undo",
  "/residents/[id]/edit",
  "/residents/[id]/hospital",
  "/residents/[id]/hospital/return",
  "/residents/[id]/move",
  "/residents/[id]/rehome",
  "/residents/[id]/rehome/return",
  "/residents/new",
  "/shop",
  "/stocktake",
  "/upcoming-visits",
  "/volunteer",
  "/weight/[id]/edit",
  "/weight/new",
];

/**
 * A "[name]" segment in an entry stands for any one segment of the real URL,
 * because the list holds page ADDRESSES as the app folder spells them
 * ("/residents/[id]/edit") while the Worker sees the pathname the browser
 * posted to ("/residents/42/edit"). Without this an entry with a "[id]" in it
 * would be a literal that no request ever matches.
 */
const matchers = WRAPPED_WRITE_PATHS.map((p) => {
  const pattern = p
    .split("/")
    .map((seg) => (/^\[[^\]]+\]$/.test(seg) ? "[^/]+" : seg.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")))
    .join("/");
  // "/" alone is the home page, not a prefix of every address.
  return new RegExp(p !== "/" && p.endsWith("/") ? `^${pattern}` : `^${pattern}$`);
});

/** Is this the address of a page whose every write is wrapped? */
export function isWrappedWritePath(pathname: string): boolean {
  return matchers.some((m) => m.test(pathname));
}

/**
 * Stop waiting for a save after WRITE_WAIT_MS and hand back `cannotTell()`.
 *
 * It is a limit on WAITING, not on the request. A Server Action's POST is made
 * by React's own fetch and cannot be cancelled from here, and it does not need
 * to be: the save carries a request id, so whatever it is still doing, the
 * person's next press is safe. What this buys is that a wedged Pi stops
 * leaving somebody looking at a spinner with no status at all -- the shape the
 * 2026-10-28 wedge drill measured.
 */
export async function waitForWrite<T>(call: () => Promise<T>, cannotTell: () => T): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      call(),
      new Promise<T>((resolve) => {
        timer = setTimeout(() => resolve(cannotTell()), WRITE_WAIT_MS);
      }),
    ]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}
