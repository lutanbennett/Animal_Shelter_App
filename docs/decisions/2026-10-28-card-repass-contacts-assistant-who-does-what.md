# Card re-pass: `contacts`, `assistant`, `who_does_what` (2026-10-28)

**Stream:** `claude/card-repass-contacts-admin`. **What:** the 17 walkthrough steps of three cards driven again after `0268`, `0269` and the #965 app half (last driven 2026-10-25). Rows are in `docs/card-access-faults.md` under one new heading. Nothing was fixed and no card was proposed.

**Step zero held:** all three were last driven 2026-10-25 (before 0268/0269), so the pass was owed. `view_contacts` was not walked; it was driven 2026-10-27. The backlog item's "contacts = 14" was `contacts` 7 plus `view_contacts` 7.

**Result in one line each.** `contacts` still works end to end and is still all edit. `who_does_what` is still read only and wide; its Features page is fully disabled for this login. `assistant` is the one with a finding: it now names an enclosure but says it is **empty** when 5 residents are in it (**proven**: service-key read, and the same login's Open enclosure page lists them), and still cannot name a resident (**read from `src/lib/assistant/data.ts`, not proven**: it loads `resident_list_view` and `resident_current_state` rather than `resident_who_and_where`, the view 0268 granted).

**Contradicted earlier row, kept:** `assistant` on 2026-10-25 answered "Which enclosure do you mean?"; that no longer happens. "Which resident do you mean?" still does.

**Unobservable, not owed:** who_does_what's Delete press needs an authenticator code (aal2, #1014); it is not one of its four steps. Doctor **Merge...** under `contacts` was offered but not driven, so as not to alter real doctors. Contact Delete and Archive were offered, not pressed.

**Found, not fixed, outside the walkthrough:** the Assistant page offers write example buttons ("Send Panda to hospital today", "Panda weighs 12.4 kg", ...) to a login that cannot record. They are suggestions, not actions, and were not pressed. They belong to the buttons sweep if it decides suggestions count; the activity to ask is the one the confirm step asks (`assistant.record` was removed by 0268).
