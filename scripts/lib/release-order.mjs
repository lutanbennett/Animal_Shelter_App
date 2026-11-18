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

/**
 * pending: migration names the target database has not applied. workerSha: the commit the live Worker was deployed from, or null.
 * read(ref, path) returns file text or null. Returns the reasons to refuse; [] means nothing is guarded or all of it is proven.
 */
export const releaseVersionAt = (read, ref) => read(ref, "src/lib/releases.ts")?.match(/^\s*version:\s*"([^"]+)"/m)?.[1] ?? null;

/** liveVersion: { ok: true, version } | { ok: false, reason } as read from the Worker's /api/releases/current. */
export function releaseOrderProblems({ pending, workerSha, read, liveVersion, registry = MUST_FOLLOW_WORKER }) {
  const problems = [];
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
