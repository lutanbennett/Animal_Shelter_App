# The cutover to `lannacareforanimals.org`: what it changes, the pre-flight, and the diff that is NOT applied

2026-11-04. Stream `cutover-rehearsal`, item `#ki6cx`. Cutover date: Friday 6 November 2026.
**This PR changes no production host, route or variable.** The diff in section 5 is text only.
The ordered runbook is `docs/domain-checklist.md`, section E.

## 1. The brief's three claims, checked against the code

| Claim | Verdict | Evidence |
|---|---|---|
| The two host lists (`PUBLIC_HOSTS`/`PUBLIC_SUFFIX` in `same-origin.ts`, `allowedOrigins` in `next.config.ts`) are the outage to fear | **Overturned (already corrected on the item)** | `same-origin.ts` calls `isSiteHostname()`; `next.config.ts` has `allowedOrigins: siteAllowedOrigins()`; both read `src/lib/site-hosts.ts`, which reads `APP_HOST`/`PUBLIC_HOST` from `wrangler.jsonc`. `check-site-hosts.mjs` asserts it. |
| "Whether the app works with public and staff on one host is NOT ESTABLISHED" | **Overturned** | `site-hosts.ts` header: equal host means one address serves everything. `wrangler.jsonc` production sets `APP_HOST` and `PUBLIC_HOST` both to `lannacare.org`; test and UAT likewise. One host is the live shape today. The cutover changes the *name*, not the shape. |
| The configuration is already staged | **Confirmed, with a limit** | `uat` block exists with `"routes": []`. But only the wrangler half is staged; see 3. |
| No host literals in the app | **Confirmed for `src/` and `worker/`.** The three `lannacare.org` hits in `src/` are the manual and two release notes (history, left alone); `worker/` has only a test fixture. | `grep -rn "lannacare\.org" src/ worker/` |

## 2. What the cutover actually changes (found by reading the scripts, not the item)

Host literals the code does not read from `wrangler.jsonc` and that a cutover must edit:

1. `scripts/pi/cloudflared-config.yml`: production's `httpHostHeader`.
2. `scripts/pi/deploy-pi.sh` line 201: `HOST=lannacare.org`. It is the address the post-deploy asset check hits. Left alone, the check still passes (UAT answers there) but checks the wrong site.
3. `src/lib/app-env.ts`: `UAT_PROJECT_REF` is `""`; `scripts/deploy.mjs` refuses `--env uat` until it is set.
4. `src/app/releases/page.tsx` line 26: production's label is `"UAT"`.
5. `scripts/purge-cache.mjs` line 48: `"lannacare.org"` for any non-test environment. It purges production's zone by that name; after the cutover production's zone is the new one (the script already has `CLOUDFLARE_ZONE_ID_LANNACAREFORANIMALS` as an optional second target).
6. `STATUS_ALERT_SITE`, `STATUS_ALERT_FROM`, `RELEASE_MAIL_FROM`, `RELEASE_MAIL_ENV` in production's `vars`.
7. `scripts/check-env-leak.mjs` line 14 hard-codes `SITES`; it tests fixtures so it is expected to keep passing, but its production example goes stale. **Not run to completion by me; not established.**

Derived, so they follow automatically: `SITE_ORIGINS` in `scripts/lib/env.mjs` (from `APP_HOST`), the Pi's `.env.production.local` (`write-env.mjs`), `allowedOrigins`, `isSiteHostname`.

## 3. Why the pre-flight changed

The old check accepted an `httpHostHeader` that matched **any** environment's address. After the cutover UAT owns `lannacare.org`, so a tunnel left presenting `lannacare.org` to **production** would still pass, while every Server Action on the new host is refused. The new rules (`scripts/lib/site-hosts-problems.mjs`) tie each tunnel to the one environment whose `ORIGIN_HOST` it is, and require its header to be *that environment's own* address. Also: an environment missing either host; one custom-domain route claimed by two environments; a route outside its environment's hosts; an environment's `APP_HOST`/`PUBLIC_HOST` not routed; an `ORIGIN_HOST` with no tunnel; production still locked once routed away from UAT's address. `check-site-hosts.mjs` also runs the rules on deliberately broken copies, including the full cutover edit with the tunnel forgotten, and fails if any rule does not fire. It passes the complete edit (wrangler + tunnel) as clean.

## 4. THE UAT TUNNEL QUESTION: answered

**UAT needs no tunnel.** The `uat` block has `"ORIGIN_HOST": ""`, which the Worker reads as "render here" (`worker/index.mjs`, comment at line 45). It never calls the Pi, so it needs no hostname and no `httpHostHeader`. Test is the only other tunnel user (`test-pi.lannacare.org`, unchanged).

**Production keeps `pi.lannacare.org`.** The Pi hostname, its WAF rule and the tunnel are on the `lannacare.org` zone and stay valid; the Worker passes the visitor's address in `x-lanna-public-host`, so the tunnel hostname does not have to be on the new zone. Only the `httpHostHeader` under `pi.lannacare.org` changes, to `lannacareforanimals.org`. Do **not** rename the Pi hostname on Friday; "Pi origin item after the cutover" in the backlog is where that belongs.

**Order, because it is the whole risk:** the Pi is changed *before* the Worker routes move. The Pi's Server Action allow-list is built from `APP_HOST` when the Pi is deployed, so from that moment `lannacare.org` actions are refused on the Pi until the Worker serves the new name. That window is minutes and the runbook puts it inside a freeze. Doing it the other way round (Worker first) refuses every action on the new host instead, and that is the one people would be looking at. No code supports allowing both names at once; I did not add one.

**Not established:** (a) whether `wrangler deploy` of production detaches the `lannacare.org` custom domains when they leave its `routes`, or they must be detached in the dashboard before the UAT deploy can take them; the runbook says check and, if needed, detach by hand. (b) Whether the Sav parking records (an A and a CNAME) on the new zone block creating the custom-domain routes; they very probably do, so the runbook deletes them first.

## 5. The production diff: TEXT ONLY, NOT APPLIED

Applied by the release manager on the day, in the order in `docs/domain-checklist.md` section E. `node scripts/check-site-hosts.mjs` must say `all right` on the branch that carries it.

`wrangler.jsonc`, `uat` block:

```diff
-      "routes": [],
+      "routes": [
+        { "pattern": "lannacare.org", "custom_domain": true },
+        { "pattern": "www.lannacare.org", "custom_domain": true }
+      ],
```

(UAT's `vars` already read `APP_HOST`/`PUBLIC_HOST` = `lannacare.org`, `ORIGIN_HOST` empty, `PUBLIC_SITE` locked, `RELEASE_MAIL_ENV` `UAT`. Add `STATUS_ALERT_SITE`/`STATUS_ALERT_FROM` and the `STATUS_ALERT_MAIL` binding and cron only if UAT is to send alerts; the production comment says it takes "a copy of these alert entries". Its Supabase URL and secrets go in `.env.deploy.uat`, pointed at `dbkodyyxxhtygxcxmfcu`.)

`wrangler.jsonc`, `production` block:

```diff
       "routes": [
-        { "pattern": "lannacare.org", "custom_domain": true },
-        { "pattern": "www.lannacare.org", "custom_domain": true }
+        { "pattern": "lannacareforanimals.org", "custom_domain": true },
+        { "pattern": "www.lannacareforanimals.org", "custom_domain": true }
       ],
...
-        "APP_HOST": "lannacare.org",
-        "PUBLIC_HOST": "lannacare.org",
+        "APP_HOST": "lannacareforanimals.org",
+        "PUBLIC_HOST": "lannacareforanimals.org",
...
-        "RELEASE_MAIL_ENV": "UAT",
-        "RELEASE_MAIL_FROM": "releases@lannacare.org",
-        "PUBLIC_SITE": "locked",
+        "RELEASE_MAIL_ENV": "Production",
+        "RELEASE_MAIL_FROM": "releases@lannacareforanimals.org",
...
-        "STATUS_ALERT_SITE": "https://lannacare.org",
-        "STATUS_ALERT_FROM": "alerts@lannacare.org",
+        "STATUS_ALERT_SITE": "https://lannacareforanimals.org",
+        "STATUS_ALERT_FROM": "alerts@lannacareforanimals.org",
...
-        "SUPABASE_URL": "https://dbkodyyxxhtygxcxmfcu.supabase.co",
+        "SUPABASE_URL": "https://<new production project ref>.supabase.co",
```

(`ORIGIN_HOST` stays `pi.lannacare.org`. The `From` domains need sender onboarding on the new zone first, a Lutan/release-manager step in the runbook.)

`scripts/pi/cloudflared-config.yml`:

```diff
   - hostname: pi.lannacare.org
     service: http://127.0.0.1:3000
     originRequest:
-      httpHostHeader: lannacare.org
+      httpHostHeader: lannacareforanimals.org
```

Also in the same cutover commit: `UAT_PROJECT_REF = "dbkodyyxxhtygxcxmfcu"` in `src/lib/app-env.ts`; `ENV_LABEL.production = "Production"` in `src/app/releases/page.tsx`; `HOST=lannacareforanimals.org` for production in `scripts/pi/deploy-pi.sh`; `scripts/purge-cache.mjs` host for production; the README environments table.

## 6. Dev proof (deliverable 5): not run, and why

Not attempted in this session; the brief asked for it only if provable. What it could show is limited: `next dev` has no Worker or cloudflared in front of it, and the 2026-10-01 outage was caused by `cloudflared` overwriting `x-forwarded-host`, which dev does not reproduce. A Server Action on `localhost` with a different `APP_HOST` would pass because the browser's `Origin` and `Host` agree, and it would prove nothing about the rule that broke. **What does prove it:** the smoke test in runbook step E.9 on the real new name (sign in, save a setting, upload a photo, open an `/r/` link), and `check-site-hosts.mjs` before the deploy. One-host serving itself is proved by production and test, which run that shape today.

## 7. Left for the planner to file (not added to the backlog by this PR)

- `check-env-leak.mjs` hard-codes the three site addresses; give it `SITE_ORIGINS`.
- A single flag for "which environment is production" so `deploy-pi.sh`, `purge-cache.mjs` and `releases/page.tsx` stop carrying their own copy of the host/label.
- Whether `wrangler deploy` releases removed custom domains (item 4, not established).
