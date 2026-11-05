# Release handover — written 2026-11-06 after `0.43.3`

A **delta**. The durable rules are in `docs/release-procedure.md` and this release's own record is
`docs/releases/2026-11-06-0-43-3.md`. **Both outrank this file.**

## START HERE

**This was an ordinary release, and the last one was not.** Production is `lannacareforanimals.org`,
`lannacare.org` is UAT on the **dev** Supabase project, `test.lannacare.org` is test. Nothing about
the hosts moved this release.

**`0.43.3` did NOT mail** — the deploy said so (`no major release new to production (was 0.43.2)`)
and the inbox confirmed it with a presence control. The public site is **still locked**
(`PUBLIC_SITE: "locked"`, his decision of 2026-11-05).

**Re-measure before trusting any of this.** `git fetch`, `git diff --stat <record SHA>..origin/main`,
`gh pr list`, `--status --env production`, `node scripts/check-production.mjs all`, `/api/version` on
all three hosts.

## THE ONE THING TO READ BEFORE YOUR NEXT CUT

**It is the same line as last edition, and it worked.** `git log --oneline -1` before cutting, then
read the decision file it names. Last release that one command was the only thing standing between a
"quick minor release" and an unannounced domain cutover. **This release it came back clean in
seconds** — `518290a7`, a public wordmark merge — and that is what a cheap check looks like when
there is nothing wrong. Run it every time.

**He asks for releases in words that do not decide the version.** *"Can we do a quick minor release -
noemail"* — "minor" means the **middle** number in his usage, which in this repo is the shape that
**mails**. He named the email, so the email is the answer: `major: false`, last number. **Never offer
"major or minor" as the question.**

## New this release

- **`wrangler deployments list` earned its keep for the second release running.** He said *"Yes,
  carry on"* while his build was still in OpenNext's bundling stage. The list showed `v0.43.2` as
  newest and his terminal showed the bundle being assembled, so the test Worker deploy was **not**
  started — which would have killed his build in seconds. **Two reads, a few seconds, and the
  \`0.40.3\` failure avoided.** Read the Worker and read his terminal; "it finished" is not evidence.
- **`--base` was NOT needed, breaking a three-release run.** The rule behind it: `--base` is needed
  only when the cut writes a note of its own, because then `origin/main` no longer holds what the new
  entry should be compared against. This cut wrote none. **Expect to need it again** the next time a
  release closes a step streams were waiting on.
- **`docs/test-plan-template.md` still says `lannacare.org` runs production** and
  `test.lannacare.org` runs the dev database — wrong since the cutover. `lock-page-coming-soon`, a
  plan written on 2026-11-06, inherited the sentence verbatim. **Every plan written from the template
  carries the wrong hosts until it is corrected.** Recorded as a defect; it is the planner's, not a
  release's.
- **The two Pi build caches went DOWN**, 958–961 MB → **779 and 782 MB** against the 1024 MB ceiling.
  **The last edition's "they will cross it soon" was wrong** and is withdrawn rather than recopied.
  `deploy-pi.sh` prunes above 1 GB and nothing is near it.
- **No migration in the release at all** — production read `318 applied, 0 pending` with zero drift
  both ways, so the apply step was **skipped rather than run empty**, and `role-cells`/`role-cards`
  were not taken because nothing writes them. Say which it was in the record; an empty apply and a
  skipped apply read the same afterwards.

## Corrections to the last edition

- **The Pi build caches are not about to overflow** (above). That inference came from two data
  points, which is the fault the runbook names: *two data points turned into a trend*.
- **`package-lock.json`'s version field was stale for the THIRD release running.** Backlog `#jhd8s`
  has still not landed and **two hand fixes have now failed to make the script do it**. Fix by hand
  (root and `packages[""]`, two strings) and expect to again. **Do not fix the script in a release** —
  a release ships what the build gave it. Three consecutive records now say this, which is the case
  for the planner.
- **`release-prs.mjs` was not short a PR**, third release running. It resolved #1312 from GitHub
  rather than git because that PR was squash-merged and left no merge commit — normal, not a gap.
- **The `[UAT]` mislabelling is fixed.** `RELEASE_MAIL_ENV: "Production"` was read in the production
  deploy's own variable list. It will show correctly on the next release that mails; nothing to do.
- **`doctor-cells` reading `MISSING` is expected.** Never restore, never edit, never raise.

## In flight and open

- **UAT's zone cache has STILL never been purged.** `.env.deploy.uat` holds only `CLOUDFLARE_ZONE_ID`
  and no `CLOUDFLARE_PURGE_TOKEN`, so it is a dashboard job until one is added. That zone may still
  hold year-long `immutable` `/_next/static/**` from the **old production** build. Raised with Lutan
  on 2026-11-05 and left as his call; it affects only the practice site.
- **Production's `CLOUDFLARE_ZONE_ID` is still the OLD zone**, which the Settings → System status
  visitor count reads. `domain-checklist.md` step 13(a). The purge itself uses
  `CLOUDFLARE_ZONE_ID_LANNACAREFORANIMALS` and worked.
- `scripts/pi/setup.sh` and `docs/pi-hosting.md` still call `lannacare.org` production. Step 13(b).
- **Two plans shipped signed `pending:`** — `lock-page-coming-soon` and `public-wordmark-home`, both
  *"has somebody looked"* on a visual change to the public site. **They are the whole content of this
  release**, so they are the one thing worth a glance.
- **The restore drill, still never exercised.** The Worker-fallback 44-second gap from the power-pull
  drill, still the only measurement.
- **`tee` under PowerShell still writes UTF-16** — read his terminal for the production deploy's own
  lines, which is how it was done again this time, and it is also how the premature "carry on" was
  caught.

**Next free migration number: `0318`.** `0317` is the highest on `main` and both databases read 318
of 318 with nothing applied that has no file. Check `origin/main` *and* open `*-schema` PRs anyway.
