# A reel's tagged animals: what a login without a resident card is told (backlog #v3h8m, schema half)

## The fault
`src/lib/reels/queries.ts:49` embeds `residents(id, name, thai_name)` in its `reel_residents` read. `reel_residents_select_perm` answers to
`social.reels` at Read, but the embedded `residents` row is cut by the residents policy, so a login holding `reel_view` or `reel_add` and
none of the cards that read residents gets the link and a null resident, and the screen draws "No animal is tagged". Absence and
"may not look" were indistinguishable.

## Decision (mine to settle, per the brief): a count for everyone who may open the reels, names only where names are already readable
The three candidates were nothing, a count, or names without a link. Chosen: **count always; names and ids only where the login may already
list residents by name.**

- **Count.** A login holding `social.reels` Read already reads the `reel_residents` rows (that policy is unchanged), so the fact that a reel
  tags some animal is already its to know. Returning it widens nothing and lets the screen be honest: "2 animals tagged, you cannot see which".
- **Names.** Gated on exactly what `resident_who_and_where` gates on (`private.works_with_residents()`, card checks). **This does not widen who
  can read a resident's name**: whoever may list residents by name today gets names here, nobody else does. The two reel cards that act on
  residents (`reel_add`, `reel_library`) carry `resident.who_and_where` Read, so they get names; `reel_view` (`social.reels` Read alone) gets the count only.
- **Nothing at all** was rejected: it keeps the false "No animal is tagged". **Names for everyone** was rejected: a social card would quietly gain
  the right to read resident names, which the card rules exist to stop. The reverse direction (`src/app/residents/[id]/page.tsx:285`) is not a
  precedent for widening: there a login that can already read the resident gains the reels; here the login has no resident read.

## What was built
`0330_reel_resident_tags.sql`: `public.reel_resident_tags(uuid[])` returns `reel_id, resident_id, name, thai_name, named`, one row per link.
It is `SECURITY INVOKER` on purpose. It reads `reel_residents` (RLS: `social.reels` Read) and left-joins `resident_who_and_where`. A first draft
was `SECURITY DEFINER` calling `private.works_with_residents()` and **leaked names to `reel_view`**: that function opens with
`current_user not in ('anon','authenticated')`, which is always true inside a definer function. The harness caught it. No role key, no role column.

## Specification for the app half (replaces the `residents(...)` embed in `queries.ts`)
1. Call `supabase.rpc("reel_resident_tags", { p_reel_ids: ids })` instead of the embed. One row per tag.
2. `named = true`: render the name as today (id, name, thai_name present). `named = false`: id and names are null; count these.
3. Where a reel has unnamed rows, show an honest line such as "N animal(s) tagged, you cannot see which", never "No animal is tagged".
   "No animal is tagged" only when there are zero rows. The library tile and the resident filter need the same treatment (the filter can only use named rows).
4. No new control is drawn, so no new activity gate. The reel type gains an `unnamedCount`, not a nullable name.
5. Zero rows can also mean no `social.reels` Read, which the page already gates on.

## Proved (dev, one-card logins; harness `supabase/harness/0330_reel_resident_tags_harness.sql`, rolled back)
Exactly `reel_view`: count 1, no name, no id, and still cannot read `residents` directly. Exactly `reel_add`: named. No card: no rows. `anon`: refused.
**Proved at the data level** (the data now distinguishes the two cases); the screen is the app half's. Nothing reads the function yet, so nothing
existing changed for Admin or for a login holding a resident card.

## Found, not fixed
`src/app/api/residents/tag-search/route.ts` asks `resident.record` Read, so a login holding `reel_add` (who-and-where, not the record) cannot use the `#`
picker search; to be confirmed by the app half.
