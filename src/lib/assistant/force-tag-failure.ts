/**
 * A way to SEE the "tags did not attach" notice on dev (#bqs1w / #a7r3k).
 *
 * The failure it stands in for needs a faulted database or a login whose cards allow the note write but refuse the
 * link insert, neither of which a dev session can produce honestly. So, on `next dev` only, setting
 * ASSISTANT_FORCE_TAG_FAILURE makes the link step report a failure after the note has been saved:
 *   ASSISTANT_FORCE_TAG_FAILURE=denied  → as if the link policy refused (Postgres 42501)
 *   ASSISTANT_FORCE_TAG_FAILURE=failed  → as if the link write failed for any other reason
 * Any other value, or any NODE_ENV other than "development" (every deployed build is "production"), does nothing.
 * It never grants anything: it can only make a link fail, so it is not access control.
 */
export function forcedTagFailureCode(
  env: Record<string, string | undefined> = process.env,
): string | null {
  if (env.NODE_ENV !== "development") return null;
  const v = (env.ASSISTANT_FORCE_TAG_FAILURE ?? "").trim().toLowerCase();
  if (v === "denied") return "42501";
  if (v === "failed") return "XX000";
  return null;
}
