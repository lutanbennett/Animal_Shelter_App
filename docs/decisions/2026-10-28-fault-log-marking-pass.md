# Fault-log marking pass (2026-10-28, `claude/fault-log-marking-pass`)

Lutan: *"Run a marking pass"* on `docs/card-access-faults.md`, for pane artefacts (see
`2026-10-28-pane-entry-aal1-list-and-owed-note.md`). Nothing deleted, rewritten or fixed.

## Result

**12 rows matched, not 14.** Re-running the grep (`pane|hydrat|plain get|dead|nothing happened`, table rows only)
gives 12; the 14 was a looser count. **All 12 fell to reading alone (pass one). No page was re-driven (no pass two)**,
so `requestAnimationFrame` was not tested here; that check only applies to a re-drive.

**No row is a pane artefact.** Every hit is the word "dead" meaning a dead-end page or link ("Appointments opens a page
saying there are no appointments"), or "pane" meaning a different thing (the browser cannot choose a file; a "panel").
None records a dead control or a plain-GET submission. Most were saved and then read back after a reload, which a
non-hydrated page cannot do.

**Where the word went.** The brief says "the existing column"; no column holds a verdict, so the word is appended to
each row's last cell (`read at`) as `· pane-check: <word>`. Meaning of the words here: `confirmed` = the row's own
evidence is not the pane; `not re-checked` = the row says it was not driven or only read, so there is nothing to judge.

| line | card | how settled (pass one) | word |
|---|---|---|---|
| 147 | `do_maintenance` | "pane cannot choose a file" is a file-picker limit; the row records a photo added/removed and a job marked done persisting after reload | confirmed |
| 148 | `do_stocktaking` | "dead end" is a menu entry; counts saved and read back after reload | confirmed |
| 149 | `do_purchasing` | "dead link" is a link to a refused page; page loads, switches and Print/CSV worked | confirmed |
| 185 | `book_clinic_visits` | "panel", not pane; row says it was not re-established | not re-checked |
| 189 | `medical_records`, `book_clinic_visits` | "dead end" is a page's own message | confirmed |
| 215 | `donations_receipts`, `run_appeals` | "dead end above" points at another row; receipts issued | confirmed |
| 233 | `do_stocktaking` | counted and persisted after reload | confirmed |
| 234 | `do_purchasing` | page works; link and menu entry gone | confirmed |
| 358 | `do_maintenance` | prompts only read, nothing pressed | not re-checked |
| 359 | `do_maintenance` | "dead end" is a page that opens empty by URL; not a control | confirmed |
| 386 | `book_clinic_visits` | row says not driven | not re-checked |
| 407 | `medical_records` | row says not re-driven | not re-checked |

**#1001's row** was not among them and was not touched.

## Found, not fixed (outside the set, listed by line, not widened)

Lines 333, 467, 510, 577 are method or environment notes (not rows) that already name the pane (plain GET, hidden
pane, pixel misses) and already say they are not card faults. No further rows look like pane artefacts.

## Recommendation

Not worth a pass over the `pending:` lines in `docs/test-plans/`: this pass found no pane artefact in the log's rows,
which agrees with #1024's reading that it is rare. His review of the marked log remains gate 3 of Card review 2.
