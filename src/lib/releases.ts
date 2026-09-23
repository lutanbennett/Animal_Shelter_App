/**
 * The release notes register, rendered at /releases and mailed to admins on
 * a major release (scripts/deploy.mjs → worker/release-mail.mjs).
 *
 * How it is kept (docs/decisions.md, "Release notes register"):
 *
 *  - A PR that changes something a user would notice adds a line to
 *    `unreleased`, in the same PR — written for a shelter user, not as a
 *    commit message. Fixes nobody sees don't need one, but the test plan
 *    says so: its release-notes line is `n/a: <reason>`, and
 *    scripts/check-test-plan.mjs flags a PR that touches pages, components,
 *    the manual, i18n or the Worker with neither.
 *  - Cutting a release is its own small PR: move `unreleased` into a new
 *    entry at the top of `releases`, give it the next version and today's
 *    date, decide `major`, and set package.json's "version" to match.
 *    `scripts/deploy.mjs --env production` refuses to deploy while
 *    `unreleased` has lines in it or package.json disagrees with the newest
 *    entry, so what goes live is always a release someone wrote down.
 *  - Numbering, until go-live: a major release bumps the middle number
 *    (0.1.0 → 0.2.0), anything else the last (0.1.0 → 0.1.1). Go-live is
 *    1.0.0, and from there major bumps the first number.
 *
 * Plain data with no imports: scripts/deploy.mjs loads this file directly
 * under Node's type stripping, and the Worker bundles it to answer
 * /api/releases/current.
 */

export type Release = {
  /** Semver without the "v": "0.1.0". */
  version: string;
  /** The day the release was cut, YYYY-MM-DD. */
  date: string;
  title: string;
  /**
   * Worth an email: something admins should know has changed. Only a major
   * release is mailed; the rest just appear on the page.
   */
  major: boolean;
  /** What changed, one plain-language line each. */
  notes: string[];
};

/** Written by feature PRs; becomes the next release when one is cut. */
export const unreleased: string[] = [
  "On the Cashflow page, the \"Not priced yet\" card now takes you to the prices that are missing: straight to the right page when they are all in one category, or to the row that links each category when they are spread out.",
  "The Cashflow table can be downloaded as a CSV file for the monthly report.",
];

/** Newest first. */
export const releases: Release[] = [
  {
    version: "0.1.0",
    date: "2026-09-24",
    title: "Dates, navigation and the cashflow forecast",
    major: true,
    notes: [
      "Dates now follow Thailand's clock. Anything dated \"today\" between midnight and 7am used to record the day before, and an animal taken in overnight could not be dated today at all.",
      "The menu has been reworked: links are grouped with icons, and the Admin section is now called Settings.",
      "New Cashflow page under Management: what the shelter is about to spend on food, medication, immunizations and vet visits, in one place. Anything nobody has priced yet shows as a gap rather than as zero.",
    ],
  },
  {
    version: "0.0.1",
    date: "2026-09-23",
    title: "Current Baseline Build",
    major: false,
    notes: [
      "The starting point of this register: everything the system does as of 23 September 2026.",
      "From here on, every release lists what changed for you, newest at the top.",
    ],
  },
];

export const latestRelease: Release = releases[0];

/** -1, 0 or 1, comparing "a.b.c" version strings numerically. */
export function compareVersions(a: string, b: string): number {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d !== 0) return Math.sign(d);
  }
  return 0;
}

/**
 * The major releases a deploy brings to a site that was running `since`
 * (null when the site didn't say — then only the newest release counts,
 * so a first deploy can't mail the whole history).
 */
export function majorReleasesSince(since: string | null): Release[] {
  const newer = since
    ? releases.filter((r) => compareVersions(r.version, since) > 0)
    : releases.slice(0, 1);
  return newer.filter((r) => r.major);
}
