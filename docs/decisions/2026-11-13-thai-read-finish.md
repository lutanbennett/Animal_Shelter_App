# 2026-11-13: finishing the Thai read (boundary fix, uploads, wording rulings)

**The boundary fault.** `docs/thai-read-progress.md` said to resume from `list-thai-added.mjs 2026-11-13`. That is a date,
and the read is a set of strings: it returned 308 strings, mostly the ones just read, and `2026-11-12` returned 491, not the
417 read, because more merged after the list was made.

**Chosen fix: a commit for the list, plus subtracting what was read.** The list read in the first session is exactly the
dictionary diff from 2026-11-12 to commit `4bf320928` (found by `--until`: 417 strings, 14 areas). New option
`--skip-read <base>..<commit>` drops any key in that set whose English has not changed since. Result: **74 strings** =
the ones merged after the list, i.e. never read. A bare commit boundary (the other option) would have re-served the
reader's own 78 Thai corrections and hidden the 74 unread ones; recording every key would have worked but grows forever.
Limit: a Thai rewording of an already-read key by someone else is not served again (an English change still is).
Tests extended in `scripts/list-thai-added.test.mjs`.

**The 34 `uploads` strings:** read with Lutan in four batches; all fine, none changed. One note for the planner: English
`uploads.errors.cannotReadResidentsList` says "Your role cannot read the residents list". It names a role, not a card;
the English is not this stream's to change.

**The 74:** 66 were only the บัตรสิทธิ์ rewording already ruled, not shown again. The 8 new (website animal counts, shop names in
Recent changes) were read. Lutan asked the three shop names to match the shop (สินค้า, as in ร้านขายสินค้า).

**Rulings applied:** supplier is **ซัพพลายเออร์** everywhere (45 places; three variants existed, including ผู้จำหน่าย);
size is **ขนาด** everywhere (the one ไซซ์).

**RULE_3_BLOCKS:** see the measurement below.

**RULE_3_BLOCKS measurement and flip.** Read the "rule 3:" line from the `check-thai-dictionary` step of 35 sampled CI runs, 2026-11-09 to
2026-11-13 (logs before 9 Nov were not retrievable, so 3 to 8 Nov is NOT measured). Every run that printed it said
"0 in the `user` class, 0 to translate": rule 3 never flagged anything, so no false positive appeared. The precondition was "a day of PRs",
and this is five days. Both conditions held (read complete, no false positive), so the flag is `true` in
`scripts/check-thai-dictionary.mjs` and the test asserts it. Rule 3 now fails the build on English prose in a user-facing
`.ts` position that is not allowed by name. Revert the one line if it ever flags something wrong.
