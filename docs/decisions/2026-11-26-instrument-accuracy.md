# Two instruments that reported the wrong thing (#pcats, #dfnwi)

2026-11-26, stream `instrument-accuracy`. Neither fault grants anybody anything; both are read by a
person deciding whether to look further.

## #pcats: the permission catalogue's product-page comments

`scripts/check-permission-catalogue.mjs` said `/platform/about` and `/platform/features/[slug]` read
"no table". Since PR #1886 both read the public view `public_platform_content` (0441) through
`loadProductPage()` in `src/lib/site/product-content.ts`, and `generateMetadata` does too (`about`
calls it directly; `features/[slug]` through its `feature()` helper). Both `why` lines now say so.
Only comments changed; nothing the check asserts and no route's access.

The sweep, every `/platform*` route and `platform/*` server-file entry against the code today:

- `/platform/about`, `/platform/features/[slug]`: **corrected** (above).
- `platform/access-actions.ts`: **corrected**. It named only the 0438 functions; 0443 replaced
  `product_admin_access_add`, which still checks `is_product_admin()` and aal2. Now named.
- `/platform/cooper`: already right (names `platform_content`'s public view, page `cooper`).
- `/platform/content`: already right (`is_product_admin()`, writes need aal2 via 0441; it reads the
  same public view, which needs no gate).
- `platform/content/actions.ts`: already right (0441's two functions, both re-check admin and aal2).
- `/platform`, `/platform/enquire`, `/platform/shelters`, `platform/actions.ts`,
  `platform/enquire/actions.ts`: already right; nothing in #1886, 0441 or 0443 touched what they read.

## #dfnwi, fault one: the range is the newest RELEASE, not the last "Cut" message

`lastCut()` used `git log --grep='^Cut [0-9]+\.[0-9]+\.[0-9]+'`. `0.49.1`'s cut commit is worded
*"Cut release 0.49.1 (minor, no email)"* (`ba6603e5b`), so the grep skipped it and fell back to
`0.49.0`'s, listing 35 plans where the window held 13.

**A cut commit is not a release, and a commit message is not a record.** The message is free prose
written by whoever cut it; nothing checks its shape, so any regex over it decays the first time
someone words it differently. Two cuts in one day, or a cut reworded on review, breaks it the same
way. `src/lib/releases.ts` is the one file every cut must change (`cut-release.mjs` writes the
entry; `deploy.mjs` refuses unless `package.json` matches its newest), so it is the record. The
range now starts at the commit that **added** the newest version found in `releases.ts` at `--head`
(`git log -1 -S 'version: "x.y.z"' <head> -- src/lib/releases.ts`). Verified: it gives `ba6603e5b`
for 0.49.1 and `3465d61b8` for 0.49.2. `cut-release.mjs` calls `lastCut()` with no argument, so it
reads HEAD, which at cut time still holds the previous release: the right answer.

**What it still cannot see:** whether that release was **deployed**. `releases.ts` records that a
release was cut; nothing in git knows which cut reached production. A cut that never shipped would
start the window too late, and its plans would not be listed again. That has not happened yet; if it
does, pass `--since`.

`--head` is now honoured by the default range and the report's label (before, it was ignored by
`lastCut()` and the label always said `HEAD`).

## #dfnwi, fault two: read the answer, not the line

The matcher took the first `n/a` on the line, colon optional. A **ticked** line carries the
template's own prose, *"every `n/a` was right about shelter users and wrong about Admin…"*, and that
was reported as its answer (`product-content-console`, `product-site-finish` on 0.49.2). Now:

- a ticked line is never an n/a (its note is in `unreleased`; `check-test-plan.mjs` holds that to the diff);
- on an unticked line the answer is `n/a:` **with** a colon and **not** followed by a `<placeholder>`.

Fixtures added to `--self-test`: the ticked line with the admin prose (null), an unticked line with
the same prose plus a real answer (reads only the answer), the prose alone (null), and the range
helper returning a commit. A sweep of every plan in `docs/test-plans/` found five unticked lines
that now return nothing (`donations-payments-paper`, `manual-access-by-cards`, `pi-service-user`,
`tenancy-host-map-schema`, `tenancy-unscoped-tables`): each is the template's untouched text with no
answer written, so before this the guard reported template prose as their reason. Nothing is the
honest reading.

**Before / after, 0.49.2's window:** default 35 plans / 15 candidates and `--since ba6603e5b` 13 / 3
→ both now 13 / 1 (`shelter-membership-schema`, a real deferral). `cut-release.mjs` therefore refuses
on fewer, correct candidates; its own logic is unchanged.
