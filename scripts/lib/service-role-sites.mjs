// Enumerates every createAdminClient() call in src/ and names the function it sits in. Shared by
// scripts/check-service-role-sites.mjs and its test. Pure: takes {path: text}, returns sites.
const FN = /^(?:export\s+)?(?:default\s+)?(?:async\s+)?function\s+\*?\s*([A-Za-z0-9_$]+)|^(?:export\s+)?const\s+([A-Za-z0-9_$]+)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[A-Za-z0-9_$]+)\s*(?::[^=]+)?=>/;

export function findSites(files) {
  const sites = [];
  for (const [file, text] of Object.entries(files)) {
    if (file === "src/lib/supabase/admin.ts") continue; // the definition itself
    const lines = text.split(/\r?\n/);
    const seen = new Map();
    lines.forEach((line, i) => {
      if (!/createAdminClient\(/.test(line) || /^\s*(\/\/|\*)/.test(line) || /export function createAdminClient/.test(line)) return;
      let fn = "(module level)";
      for (let j = i; j >= 0; j--) {
        const m = FN.exec(lines[j]);
        if (m) { fn = m[1] || m[2]; break; }
      }
      const base = `${file}#${fn}`;
      const n = (seen.get(base) ?? 0) + 1;
      seen.set(base, n);
      sites.push({ id: n === 1 ? base : `${base}#${n}`, file, fn, line: i + 1 });
    });
  }
  return sites;
}

// Compare enumerated sites with the registry's entries. Returns the three ways they can disagree.
export function compare(sites, registry) {
  const have = new Set(sites.map((s) => s.id));
  const recorded = new Map(registry.sites.map((r) => [r.id, r]));
  return {
    unregistered: sites.filter((s) => !recorded.has(s.id)),
    stale: registry.sites.filter((r) => !have.has(r.id)).map((r) => r.id),
    unclassified: registry.sites.filter((r) => r.classification !== "needs-shelter-filter" && r.classification !== "cross-shelter" && r.classification !== "unclassified" && r.classification !== "filtered"),
    noReason: registry.sites.filter((r) => !r.reason || r.reason.trim().length < 15).map((r) => r.id),
  };
}

// A site recorded "filtered" must actually name a shelter filter in its own function: from the call's function header to the next
// top-level function. A claim of filtering with no shelter_id / actingShelterId in that body fails.
export function unfilteredClaims(files, sites, registry) {
  const byId = new Map(sites.map((s) => [s.id, s]));
  const bad = [];
  for (const r of registry.sites) {
    if (r.classification !== "filtered") continue;
    const s = byId.get(r.id);
    if (!s) continue;
    const lines = files[s.file].split(String.fromCharCode(10));
    let start = s.line - 1;
    while (start > 0 && !FN.test(lines[start])) start--;
    let end = s.line;
    while (end < lines.length && !FN.test(lines[end])) end++;
    if (!/shelter_id|shelterId|actingShelterId|userInActingShelter|givableRole[(]/.test(lines.slice(start, end).join("\n"))) bad.push(r.id);
  }
  return bad;
}
