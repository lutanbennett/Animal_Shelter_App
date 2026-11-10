# Control sweep 12: the 26 read-opened pages — all read for both shapes, two driven (2026-11-10)

Brief: `#79sqf`'s remainder (a notice that promises an ability the login lacks; a control gated on a different
activity than its own action asks) on the 26 pages of `2026-11-08-control-sweep-11-count.md` §3a, plus the `#t3n9r` proof.
Step zero: §3a and §3c read; `docs/destination-activity-allowlist.json` holds 0 rows; no earlier PR on the slug.

## What was done, honestly

**Driven** (of the 26: `/memes`, `/memes/[id]`; also `/memes/new`, outside the 26) (dev, port 3006, one-card login `meme_add`, reached by clicking Home → `/memes` → Add a meme, `requestAnimationFrame` fired):
`/memes` (Make a meme and Add a meme drawn, both asked by `social.library`), `/memes/new`, `/memes/[id]`
(Edit and Record a share drawn; `social.library` edit is what `actions.ts` asks).

**Read statically, NOT driven** (the page's `can(perms, …)` set against the action file's `can(perms, …)` / RPC, and every
`readOnly`-style notice searched for in `en.ts`): `/admin/shop`, `/admin/website` and its page route, `/admin/who-does-what`
(+ `/details`, `/features`), `/appointments`, `/upcoming-visits`, `/bills`, `/clinics`, `/clinics/[id]`, `/enclosures`,
`/enclosures/[id]`, `/management/cashflow`, `/management/expenses`, `/management/medications`, `/medical/diets`,
`/operations/feeding-list`, `/operations/medication-list`, `/reels`, `/reels/[id]`, `/outreach`, `/suppliers`, `/suppliers/[id]`.
**Found: nothing.** Each control read asks the activity its action asks (`shop.manage` edit; `social.reels` / `social.reels_manage`;
`community.outings`; `stock.medications`; `visit.book`; `maintenance.bills` / `bills.*`). The only notices naming a promise
(`outreach.readOnly`, who-does-what `readOnly`) promise reading only, which the page's read guard gives.
A static read is **not** a drive: it is the weaker evidence, and the 24 undriven pages are left open in `#79sqf`.

## Found, not fixed (not in this slice)

`ClinicHub`'s `canManage` (`clinics.list`) still gates other controls, as `#d9k2w` left it. The cashflow page's
`canEditClinicEstimate` (`website.content` edit) draws a link to `/admin/website`, which that guard opens, so it is fine.

## The `#t3n9r` fold

Login holding only `meme_add`: on `/memes/new` attached an image, tagged resident "Test 1" through Choose residents, pressed Save meme;
the server action took ~20 s, then `/memes/[id]` listed "Test 1" under *Residents in it*. **Proved.** `/memes/make` (canvas editor)
was not driven, so `#t3n9r` stays open for that one page. Dev row "Drive sweep 12 tag test" left in place (dev data is disposable).

## For the next stream

Drive the 24 pages above with the one-card logins in §3a. Do not re-read them statically.
