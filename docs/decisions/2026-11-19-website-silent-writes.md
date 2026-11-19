# 2026-11-19 — Website admin saves refuse when no site_content row was written (#wbsrw)

**Step zero:** gap present; no `noRow` in `src/app/admin/website/actions.ts`.

**Change:** copied #1740's pattern (`2026-11-19-stocktaking-silent-save.md`): `.select("id")` on the update, and
`refuse(t.admin.website.noRow)` when nothing comes back. New `admin.website.noRow` in en and th. Own wording
because #1740's says "the switch was not saved", which is wrong for text and photo saves.

**The twelve lines, accounted for (the item said twelve; the real number is seven):**
- 100 read (`select hidden_public_pages`), left.
- 108 write (page visibility), fixed. Only runs when the list changed; a missing row is still a silent loss, so it is covered.
- 284 write (site content), fixed. 375 write (clinic visit estimate), fixed. 494 write (featured resident), fixed.
- 586 and 612 reads (previous hero file id before `set_hero_photo`). The write itself is the `set_hero_photo` RPC, which is not a direct update, so it is out of this shape; not touched.
- 1112 read, left. 1142 read, left.
- 1119 write (page photo set), 1149 write (page photo remove), 1175 write (photo alt text): fixed.
No case was found where zero rows is legitimate.

**Proof:** the mechanism is the one in `supabase/harness/stocktaking-zero-row-write.sql` (same table), reused, not duplicated.
The zero-row path cannot be reached by pressing buttons on dev (0417 backfilled dev). Not established for production,
where 0417 has not yet run at the time of writing.

**Found, not fixed:** `src/lib/site/content.ts` reads (83, 227) per #1740; reads, not this shape.
