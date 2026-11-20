// Migrations that must reach a database only AFTER the code that makes them safe is live (#ujqr5, Part 5 of #ykefa).
//
// Why this is a registry here and not a `-- consumer:` header: 0392 is applied to dev, and an applied file is never edited,
// so its header stays `none`. And the header mechanism cannot carry this anyway: it WARNS and prints "the safe direction",
// which for these files is the wrong way round (docs/decisions/2026-11-17-tenancy-part5-release-guard.md).
//
// "Live" cannot be read off the site: /api/version answers for the Pi's build, and nothing reports what the WORKER runs. So
// the proof is a commit the release manager names (the one the Worker was deployed from), and this checks that the Worker
// files that send the header are byte-identical at that commit and at origin/main.

export const MUST_FOLLOW_WORKER = [
  {
    migration: "0392_per_shelter_restrictive_policies.sql",
    files: ["worker/shelter.mjs", "worker/index.mjs"],
    why: "with these policies on and no x-shelter-id arriving, anon reads no rows, so the public website serves blank pages until the Worker is deployed",
  },
];

// The opposite direction: migrations that must be applied BEFORE the Worker that calls what they create (#rlord). Hand-kept on purpose,
// narrower than the `-- consumer: worker/` header (3 files: 0236, 0408, 0426): 0236 and 0408 name a whole directory or tolerant reads,
// and a guard that refuses a release for the wrong reason is worse than a silent one
// (docs/decisions/2026-11-20-release-order-precede-registry.md). `uses` is the text proving a Worker file calls the new object.
export const MUST_PRECEDE_WORKER = [
  {
    migration: "0426_shelter_public_site.sql",
    files: ["worker/shelter.mjs"],
    uses: "resolve_shelter_site",
    why: "the Worker calls resolve_shelter_site(); without it the RPC answers 404, no x-shelter-id is sent, and since 0392 that means no rows: the public website blanks and signed-in pages read empty",
  },
];

/** The two lines a clean run prints, one per direction, so a pass on one cannot be read as covering both. */
export function releaseOrderSummary({ pending, workerSha, follow = MUST_FOLLOW_WORKER, precede = MUST_PRECEDE_WORKER }) {
  const f = follow.filter((e) => pending.includes(e.migration)).length;
  const p = precede.filter((e) => pending.includes(e.migration)).length;
  return [
    `must-follow-Worker: ${f ? `${f} pending, Worker proven live at ${workerSha}` : "none pending, nothing to prove"} (${follow.length} registered)`,
    `must-precede-Worker: ${p ? `${p} pending, ${workerSha ? "the named Worker does not call them" : "no Worker named, so none is being served yet"}` : "none pending, nothing to prove"} (${precede.length} registered)`,
  ];
}

/**
 * pending: migration names the target database has not applied. workerSha: the commit the live Worker was deployed from, or null.
 * read(ref, path) returns file text or null. Returns the reasons to refuse; [] means nothing is guarded or all of it is proven.
 */
export const releaseVersionAt = (read, ref) => read(ref, "src/lib/releases.ts")?.match(/^\s*version:\s*"([^"]+)"/m)?.[1] ?? null;

/** liveVersion: { ok: true, version } | { ok: false, reason } as read from the Worker's /api/releases/current. */
export function releaseOrderProblems({ pending, workerSha, read, liveVersion, registry = MUST_FOLLOW_WORKER, precede = MUST_PRECEDE_WORKER }) {
  const problems = [];
  // Direction two: a pending migration the named Worker already calls means a Worker serving without its database object.
  for (const { migration, files, uses, why } of precede) {
    if (!pending.includes(migration) || !workerSha) continue;
    for (const path of files) {
      const text = read(workerSha, path);
      if (text !== null && text.includes(uses)) {
        problems.push(`${migration} is still pending but the Worker at ${workerSha} (${path}) already calls ${uses} (${why}). Apply the migration before that Worker serves traffic.`);
      }
    }
  }
  for (const { migration, files, why } of registry) {
    if (!pending.includes(migration)) continue;
    if (!workerSha) {
      problems.push(`${migration} is about to be applied and nothing proves the Worker that sends x-shelter-id is live (${why}). Deploy the Worker first, then pass --worker-deployed <the commit it was deployed from>.`);
      continue;
    }
    if (!liveVersion?.ok) {
      problems.push(`${migration}: could not ask the live Worker what it runs (${liveVersion?.reason ?? "not asked"}). Unreachable is not the same as wrong, but a guard that cannot tell must not look like one that passed: retry once the host answers.`);
      continue;
    }
    const wanted = releaseVersionAt(read, workerSha);
    if (wanted && wanted !== liveVersion.version) {
      problems.push(`${migration}: the live Worker reports release ${liveVersion.version} but ${workerSha} is release ${wanted}, so the Worker is not the one you named. Deploy the Worker again.`);
      continue;
    }
    for (const path of files) {
      const atWorker = read(workerSha, path);
      const onMain = read("origin/main", path);
      if (atWorker === null) problems.push(`${migration}: ${path} does not exist at ${workerSha} (not a commit this checkout knows, or the wrong one).`);
      else if (onMain === null) problems.push(`${migration}: ${path} is not on origin/main.`);
      else if (atWorker !== onMain) problems.push(`${migration}: ${path} at ${workerSha} differs from origin/main, so the Worker you deployed is not the one this release needs live first. Deploy the Worker again.`);
    }
  }
  return problems;
}
