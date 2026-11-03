// Run a rollback harness's SQL against dev and report it honestly.
//
// These harnesses end in a deliberate `raise exception 'HARNESS-OK ...'` so nothing commits. The
// Management API then answers HTTP 400 "Failed to run sql query: ERROR: P0001: HARNESS-OK ...", and
// printing that raw made a PASS look like an error. The marker is the verdict: this prints PASS with
// the evidence, or FAIL with the database's message, and returns whether it held.
export async function runHarness(ref, env, label, query) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  const text = await res.text();
  let msg = text;
  try { msg = JSON.parse(text).message ?? text; } catch {}
  const m = /HARNESS-OK\s*([\s\S]*?)(?:\nCONTEXT:|$)/.exec(msg);
  if (m) {
    console.log(`PASS ${label}: ${m[1].trim()}`);
    return true;
  }
  console.log(`FAIL ${label} (status ${res.status}): ${msg}`);
  return false;
}
