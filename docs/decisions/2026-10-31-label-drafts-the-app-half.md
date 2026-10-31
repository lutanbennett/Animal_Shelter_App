# 2026-10-31 — Thai labels, app half: the screen learns `proposed`, and three headings get words

**`claude/translations-labels-app`.** The app half of the two `## Management` backlog items whose schema half
merged this morning as #1134 (`0293`, `0294`). The authority on the schema is
`docs/decisions/2026-10-31-label-drafts-and-unlisted-labels.md`; this file records what the screen does with it
and the five judgements the brief left open. **No migration, and no `src/lib/manual/` topic** — both outside this
stream.

**What it is for, in one line:** 72 labels had a proposed Thai that no Thai speaker had read, sitting in a
document on Lutan's Desktop because publishing unapproved Thai is worse than leaving the English. They are now
on the screen, marked as waiting, and approving one is a press.

---

## 1. `proposed` is its own count and its own filter, and is NOT part of Missing

The brief left this open: *"whether that is a separate count or a qualifier on the existing one is yours."*

**It is separate, and three things say so rather than taste.**

- **The database already decided it.** `label_translations()` returns `proposed` **instead of** `missing`, not
  beside it. Counting it as missing in the page would be the client disagreeing with the function it is reading.
- **The two ask different things of the reader.** Missing means somebody has to write Thai. Proposed means
  somebody has to read one line and press a button. Putting them in one number asks a translator and an approver
  to share a worklist.
- **It is the only way the feature can be seen to have done anything.** If a proposal still counted as missing,
  entering all 72 would move no count at all. The screen would look exactly as it did before and the whole
  waiting step would be invisible — which is the opposite of the point.

So: a fourth filter, **Waiting** (`?show=proposed`), and a per-section `N waiting` beside `N missing`, in the
page's accent colour. The words a reader sees are *"Thai proposed — waiting to be approved"*.

**One deliberate overlap, because hiding it would be worse.** A label that already has Thai *and* a proposed
change keeps `stale` or `current` — the status describes the **live** value, which is what a reader of the app
sees — so it does not read as `proposed`. The Waiting filter and the waiting count therefore ask
**"does this label carry a proposal?"** rather than `status === 'proposed'`, which means such a row is counted
under both *out of date* and *waiting*. That is true of it, and a proposal invisible to the one filter whose job
is to list proposals would be a trap.

**Prose is untouched by the new filter.** Prose has its own `draft` state (a machine wrote it, nobody has read
it) and no `label_drafts` row, so `proseShown()` returns false for Waiting rather than falling through to its
Missing branch — which it would otherwise have done silently.

## 2. The three controls, and the activity each one asks

| control | function | activity it asks | touches the row? |
|---|---|---|---|
| Save | `set_label_th()` (0166) | `translations.manage` | yes — publishes at once |
| Propose | `propose_label_th()` (0293/0294) | `translations.manage` | **no** |
| Save & approve | `approve_label_th()` (0293) | `translations.manage` | yes — publishes the draft |
| Reject | `discard_label_draft()` (0293) | `translations.manage` | no |

**Every activity was read from the function body, not from the control's label**, as the rule requires. All four
ask `translations.manage` today. **`translations.propose` was NOT built** — the schema file's §3 names it as
warranted and the brief says it is now a filed, deferred backlog item and not this stream's job. Where that
decision file's closing list still says *"the app half's first job"*, it is superseded by the brief; the
reasoning in its §3 stands and is why the item exists.

**Found and fixed, in scope because it is the same activity:** the label's **Save** box and button were drawn
unconditionally. `canManage` never reached `LabelCard` at all, while the prose panel beside it took it as a
prop. Today the page's own guard (`requirePermission("translations.manage")`) means nobody without the activity
ever got there, so nothing was ever offered that the database refused — but the control disagreed with its own
action, which is exactly the shape Lutan's 2026-10-27 rule exists to stop. All four controls, and the Thai box,
are now behind `canManage`, read from `can(perms, "translations.manage")`.

**Hiding is the courtesy, never the security.** Not one server check, RPC, policy or guard was changed or
weakened. The page still requires `translations.manage` to open; widening it to `translations.view` would be a
grant nobody asked for, so it was not done.

**The negative case cannot be fully driven today, and that is a finding rather than a gap in the testing.** The
single `translations` card bundles **both** `translations.view` and `translations.manage`
(`src/lib/permissions/cards.ts`), so **no login can hold view without manage** and the controls-hidden state is
unreachable through the card system. What was driven instead is the real card-only case —
`node scripts/dev-signin.mjs --cards translations` — which showed Management holding exactly one tile, the page
open, all 72 drafts readable, and every control drawn. The hidden branch is in place for the day a view-only
card exists; it is noted in the backlog beside the `translations.propose` item, since that is the same
neighbourhood.

## 3. Who proposed it: "you" or "someone else", because there is no name to show

`label_translations()` returns `draft_proposed_by` as a **uuid**, and **this app has nothing that turns a login's
uuid into a name** — checked rather than assumed: no `profiles`-style table, no name RPC, and the prose queue's
own `reviewed_by` has never been displayed either. Giving it one means schema, which this stream must not write.

So the panel says **"Proposed by you"** or **"Proposed by someone else"**, with the date, by comparing
`draft_proposed_by` with the signed-in `user.id` that `page.tsx` already has. It is honest, it needs nothing new,
and it answers the question that actually matters when approving — *is this my own wording coming back to me?*
Both readings were seen on dev: "by you" for a draft proposed in the browser, "by someone else" for the 72 under
a different login. A real name is a backlog item.

## 4. The three headings, and why these words

Nothing on record said what they should be; the brief asked for words and for the reasons.

- **`appeals` → "Help a sick resident".** Not "Appeals". Those are the feature's **own** words — it is
  `t.appeals.navLabel`, the header entry and the page heading a shelter user already reads. A heading invented
  here would be a second name for one thing.
- **`home` → "Home screen".** It holds `role_groups.name` (a doorway tile on a role's home) and `features.name`
  (an area of the system). **"Home screen" is the better of two imperfect names, not a clean fit:** a feature's
  name is read on Settings → Who does what, not only on the home screen. The group key `0293` chose is `home`
  and the per-label field names carry the detail — *Home screen tile* and *Area of the system* — so the heading
  stays short. Easily corrected on screen if Lutan reads it differently.
- **`social` → "Social media".** `memes.caption_en`, a group of one. `0293` reasoned that the website is not
  social media and there was nowhere else to put it; the heading just says so.

`sortGroups()` still **widens**: an unknown group sorts last and is shown, never hidden. `appeals` sits beside
`residents` (an appeal is about a sick resident), `social` beside `website`, `home` before `roles`.

The five tables `0293` registered also gained a `LABEL_SCREENS` entry, so their labels link to the screen they
are typed on, and a `labelFields` name in both dictionaries, so they stop showing a raw column name.

## 5. `translations-open` is NOT taught about drafts yet — and there is no graceful version to write

The brief offered three passing answers. The answer is **"not yet, and here is the condition"**, because the
other two **cannot be built**, which is worth stating since "gate it on the table existing" sounds easy.

`buildQuery()` wraps a check's SQL in `do $o$ begin raise exception 'CHECK-RESULT %', ((<sql>)::jsonb); end $o$;`
and `assertSelectOnly()` allows **one statement** starting with `select` or `with`. Every relation in it is
therefore resolved when that block is planned, so a query naming `label_drafts` **stops** on a database without
the table. `to_regclass` cannot help: a guard still has to mention the relation it is guarding. Two statements,
a probe-then-choose, or dynamic SQL in a function are all outside what the harness accepts.

A check that stops reports **nothing** — on 2026-10-07 a stalled `audit` cost the release manager 45 minutes,
and this would cost him the translation counts entirely. A check that under-reports by a known amount is
strictly better. **On production that amount is zero**, because a database with no `label_drafts` can hold no
drafts.

The size of the under-report on dev, measured today, so the trade is a number rather than a claim: the check
reports **383 missing labels** where the screen shows **311 missing and 72 waiting**.

The condition and the exact edit are now written in a comment beside the check itself, so the next reader meets
them there rather than in a brief that no longer exists. Backlog item filed under `## Security`.

## 6. The 72 drafts: how they were matched, and the two the document could not identify on its own

Entered on **dev only**, through `propose_label_th()`, after deliverable 1 was proven working — the schema
stream's warning about a `proposed` row arriving typed as something it is not was honoured.

The document (`Thai translation gaps and draft - 2026-10-31.html`) carries **no row ids**, so each row was
matched on **(section, English)** against `label_translations()`. 84 rows, 12 of them grey practice rows the
document itself says to skip, leaving exactly **72** — the number the brief states.

**The two ambiguities, and why the fix is a reading rather than a guess.** "Renal diet" matched both
`diet_types.name` and the newly registered `diets.name`; "cup" matched both `item_unit_conversions.unit` and the
newly registered `units.name`. **The document was made before `0293` was applied**, so the five tables `0293`
registered were not on the screen it was made from and cannot be what it names. Excluding them makes all 72
unique — and the document's **own printed section counts prove the reading**: its Diets section says
*"8 to translate"* and `diet_types.name` has exactly 8 missing (`diets.name` has 4); its Stock units section says
*"5"* and `item_unit_conversions.unit` has exactly 5 (`units.name` has 282, the 2026-10-28 Pi drill rubbish).
Every section's matched count is checked against the document's own count, minus that section's practice rows,
so the reading fails loudly if it is ever wrong.

**Result: 72 proposed, 0 refused.** `label_drafts` holds 72 rows and `label_translations()` reports exactly 72
`proposed` — so nothing was published, which is the invariant the whole design rests on. **Nothing was entered
on production, and nothing ever will be by this stream**; doing it there is its own step and its own backlog
item, since the Thai is still unread.

## 7. What was left alone, deliberately

- **`src/lib/manual/`** — the Translations screen now has a step the manual does not describe. That belongs to
  the `assistant-manual-topic` stream this batch and is named in the PR.
- **`translations.propose`**, the activity and the card — filed and deferred.
- **The `translations-open` empty-table fault** (`uncovered` tested against data, so an empty table contributes
  no arm rows) — its own item.
- **`fixed_outgoings.label`** in `readonly-checks.mjs` — already covered on `main`, another stream's line.
- **The wording of the Thai itself**, beyond entering the 72 already drafted — the Thai sweep item.

## 8. One dev artifact, put back

`units` row `drill-mvscd7zn-0` was renamed to `… renamed` to prove that the English changing under a waiting
draft shows as out of date, then renamed back. Its `name_th` is still null, which is the proof that Reject left
the row alone.
