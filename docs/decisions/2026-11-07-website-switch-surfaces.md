# 2026-11-07 — Website switches: the three unverified surfaces, driven (`#w9n4r`)

Verification of #1358 (`2026-11-06-website-switches-app.md`). Dev, port 3008, built-in browser, reached by clicking through.
Step zero: the three surfaces were still unverified. `noOwnSwitch` is not gone from the codebase: #1358 removed only the
events entry's use of it; the generic flag (type, `isPageHidden`, `hideableEntries`, `PageCards`) stays by that file's own decision.

## (a) Recent changes — recorded, but unlabelled: FIXED
Logged in as a login holding exactly `website`, pressed a live-count tick (confirm box appeared, then saved). Then, as Admin
(Recent changes is Admin-only), the entry was there with the right actor and `Show on website  true → false`. **But it read
"(no name)" under no record kind**: `0328` put an audit trigger on `public_stat_switches`, and that table was not in
`AUDITED_TABLES` (whose own comment says every table with the trigger belongs there or its rows show unlabelled). Fix: listed it,
named the row by its count key, added the kind label (en: "Website count switch"). After the fix the same entries read
`in_treatment · Website count switch · Show on website`. The Thai label `สวิตช์ตัวเลขบนเว็บไซต์` is new and unreviewed (`#ifxk8`).
The lifetime-figure tick goes through `impact_baselines`, already listed, so it needed nothing.

## (b) `/events` hide switch: works, both ways
Settings → Pages showed **Hide Events**. Pressed: the button became **Show Events**; signed-out `/events` returned the Not found
page (no `h1`, `noindex`), and `/sitemap.xml` and the home page dropped `/events`. Pressed **Show Events**: the `h1` "Fundraising
events" and the sitemap entry came back. (A signed-in editor still sees the page by design, so test it signed out.)

## (c) A login without `website.content` at edit: nothing drawn
`--cards website_photos` (holds `website.content` at **read**, plus gallery). Settings → Website offered only the **Gallery**
tab: no Home tab, zero checkboxes, no "Today's counts", no Impact figures. The page gates on `can(perms, "website.content")`
(`page.tsx:58`); the toggle's own action `setStatisticShown` asks the same activity (`actions.ts`, `can(..., "website.content")`),
so control and action agree. Hiding is the courtesy; the action's check is unchanged.

## Found, not fixed
Nothing else. Dev's count switch was put back on after the check.
