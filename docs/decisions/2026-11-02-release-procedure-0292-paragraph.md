# The `0292` paragraph of the release procedure now names its check (2026-11-02)

**Decision.** `docs/release-procedure.md` §5 says that the whole-page wrapping rule is
machine-checked by the blocking CI job `wrapped-write-paths`
(`scripts/check-wrapped-write-paths.mjs`), so the reverse case (wrapper deployed, a page
unwrapped) is guarded by a red build rather than by memory.

**Not a live risk.** The double-write hazard closed on 2026-11-01
(`2026-11-01-header-writes-wrapped.md` §6): the shared header's writes are wrapped,
`/admin/units` is honestly listed, and the blocking job stops the list going back into
breach. Applying `0292` and deploying opens nothing. The passage was incomplete, never
misleading; do not reopen the double-write question from it.

**Named stop or prose?** Prose. The surrounding steps carry their stops as bold prose,
not as separate gates, and the condition a stop would assert ("the list is not in
breach") is already enforced by a blocking check. A second, manual stop would duplicate
it. The paragraph says a red `wrapped-write-paths` is a stop like any red check.

**Context kept.** `WRAPPED_WRITE_PATHS` must not be emptied
(`scripts/check-worker-origin.mjs` asserts it is non-empty); the paragraph says so.

**Not done, by design.** Wrapping the shared header itself (Pi failover D) and promoting
`check-wrapped-write-paths.mjs` are their own items. No script changed.
