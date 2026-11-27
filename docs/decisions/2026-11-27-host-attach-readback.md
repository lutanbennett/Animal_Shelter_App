# 2026-11-27 — The console reads the attach flag back (#hstau)

**What.** `0449` replaces `product_admin_shelters()` with one extra output column, `attached_hosts text[]` (the
shelter's addresses whose `attach_to_worker` is true, sorted, `'{}'` when none), exactly as specified in
`2026-11-27-host-attach-console.md` lines 32-36. Everything else in `0428`'s definition is copied unchanged: the
`is_product_admin()` gate, `rls_definer` owner, grants, and the per-shelter `request.headers` loop, which is what
lets a definer read `shelter_hosts` at all (`0447`'s finding). The return type changes, so it is drop + create.

**The panel** (`src/app/platform/ProductAdminPanel.tsx`) now shows `(marked for the next deploy)` beside each
flagged address and draws **one** button: *Attach at next deploy* when unflagged, *Stop attaching at next deploy*
when flagged. Both stay behind the existing `canWrite` (product administrator at aal2). The note that said the
page "cannot yet show which addresses are marked" is rewritten.

**Deliverable 6: how "marked" and "answering" read together.** They are two different facts — an instruction
recorded, and a reading of the live address — so both stay visible as they are. Three of the four combinations
need no words (marked + answers; unmarked + answers; unmarked + silent). The fourth, **marked but not answering**,
is the one that looks contradictory, so only then a line appears under the address: *expected until the next
deploy of this environment attaches it; if a deploy has already run since it was marked, the address is not
reaching us (for a shelter's own domain, check its nameservers).* We do not try to tell "before the deploy" from
"after a failed deploy": nothing records when a deploy last ran, and guessing would be worse than saying both.

**Proof** (dev, 2026-11-27, `playwright-core` at aal2 as a product administrator): added the disposable
`readback-2026-11-27.example.invalid`; before: no badge, Attach only; pressed Attach, reload: badge, Stop only;
pressed Check it answers: "Does not answer yet" plus the marked-but-silent line; pressed Stop, reload: no badge,
Attach only; then removed the address. Flag left `false`, row gone.

**Not ticked.** `#hstau` stays open only for its release-manager warning (`0445` before the new `deploy.mjs` on
production), which this worktree cannot measure (no production deploy env here).
