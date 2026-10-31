// Just enough of next/navigation for action-result.ts: unstable_rethrow, which
// lets Next's own control-flow throws (redirect(), notFound()) past a catch
// instead of being turned into a refusal. Next marks those with a `digest`
// string, which is what the real one looks at, so a rule that depends on the
// difference can be tested without loading Next.
export function unstable_rethrow(error) {
  const digest = typeof error === "object" && error !== null ? error.digest : undefined;
  if (typeof digest === "string" && (digest.startsWith("NEXT_REDIRECT") || digest === "NEXT_NOT_FOUND" || digest === "NEXT_HTTP_ERROR_FALLBACK")) {
    throw error;
  }
}
