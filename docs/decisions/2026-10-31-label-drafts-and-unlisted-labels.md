# 2026-10-31 — Thai labels, schema half: the eleven unlisted labels, and a draft that waits

**`claude/translations-labels-schema`. `0293_label_drafts_and_unlisted_labels.sql` and
`0294_propose_label_th_checks_the_row.sql`.** Two backlog items under `## Management`, folded into one schema
PR because they are the same subject and `CLAUDE.md` allows two streams' migrations to share one. **The app
half is a separate stream and is briefed from this file**; the last section is written for it. **No `src/`
file was touched.**

The two items:

1. *Bring the twelve Thai columns Management → Translations cannot see onto the screen, and stop the next one
   going missing.*
2. *A translated label goes live the instant it is typed — there is no draft.* **Lutan answered this himself
   on 2026-10-31**, asked plainly whether a proposed short label should be able to sit on the screen marked as
   waiting rather than going live at once: **yes, add the waiting step.** Nothing about it was re-asked.

---

## 1. The eleven labels, and the homes they were given

`node scripts/check-production.mjs translations-unlisted` named twelve `_th` columns on base tables with no row
in `translatable_labels` — the same twelve on dev and on production, so this was live and not a dev artifact.
Eleven are a manager's wording and are now registered. **`rounds.name_th` stays out**, as `0166` says in its own
comment: a fixed seeded vocabulary whose Thai ships with it. After this migration `translations-unlisted` reports
exactly one column, and that one is deliberate.

| label | group | `optional` |
|---|---|---|
| `site_content.contact_address` | `website` | no |
| `site_content.registration_text` | `website` | no |
| `site_content.about_photo_alt` | `website` | no |
| `site_content.donate_photo_alt` | `website` | no |
| `site_content.foster_photo_alt` | `website` | no |
| `site_content.volunteer_photo_alt` | `website` | no |
| `diets.name` | `diets` | no |
| `units.name` | `units` | no |
| `features.name` | **`home`** (new) | no |
| `role_groups.name` | **`home`** (new) | no |
| `memes.caption_en` | **`social`** (new) | **yes** |

**Four things here are not what the item said, and each is a reading of the database rather than a preference.**

- **`memes.caption_en`, not `memes.caption`.** There is no `caption` column: `0223` named the pair `caption_en`
  / `caption_th`. The registry stores both column names separately, so the real one is used. The item's
  *"memes.caption"* meant the pair.
- **`memes` is the only one marked `optional`.** A meme is an image that usually carries its own words, so a
  caption deliberately left in English is a normal answer and must not be counted as a gap. Every other one is
  wording a Thai reader is shown and has to have.
- **Two new groups, not one.** The item asked for `features` and `role_groups` *"in a group of their own, since
  they name the sections of the home screen"* — that is `home`, and it is right because neither belongs to the
  website, a setup list or the roles themselves. It then said `memes.caption` *"wherever social wording goes"*,
  and **there is nowhere**: `0166`'s nine groups have no social heading and the website is not social media. So
  `social`, a group of one for now.
- **`residents` had to go back into the check constraint.** `0166`'s `check` listed nine groups and `0209`
  widened it to ten; writing the new list from `0166` alone dropped `residents` and **the dry-run refused the
  constraint against real rows** rather than letting it be added unvalidated. The constraint is now dropped by
  *definition* rather than by name, so the file is re-runnable whatever the constraint ended up called.

**`role_groups.name_th` is `not null` with a non-blank check (`0241`), so that pair can never read `missing` or
`as_typed`.** It is registered anyway, and what it gains is `stale`: rename a group in English today and the Thai
beside it silently stops matching, with nothing to notice.

### What registering these does to the screen's counts, measured

`translations-open` on dev went from **84 missing labels to 382**. The 298 new ones are: `units.name` 280,
`features.name` 13, `diets.name` 4, `site_content` 1, `role_groups.name` 0 — and `memes` contributed 2 *shown
as typed*, not missing.

**The 280 is dev rubbish and not a real backlog**, established rather than assumed: `units` holds 295 rows on dev,
created on two days only (2026-10-23 and 2026-10-28), and the untranslated ones are named `drill-mvsct7k9-84`,
`drill-probe-1793205653` and so on — the Pi failover drills' own writes. Exactly **one** real untranslated unit
exists on dev (`pouch`); the seeded units shipped with their Thai in `0252`. **So registering `units.name` costs
the screen almost nothing in real wording, and the production figure must be taken on production before anybody
judges what they see.** `node scripts/check-production.mjs translations-open --env production` is the command.

---

## 2. The draft is a TABLE, not a status column — deliverable 3's real content

The item sketched either *a `status` column* or *a small `label_drafts` table beside `label_sources`*. **It is
the table, and the reason is not taste.**

**The paired `_th` column IS the live value.** Dozens of views read it directly, the public website reads it, and
every screen that shows a diet, a unit, a section name or a photo description reads it. A `status` column could
only mean *"the Thai is sitting in its own column but do not show it yet"*, and that sentence has to be honoured
**by every one of those readers**. That is a flag day across the whole app, and it **fails open**: the day one
reader forgets, unapproved Thai is on the public website, which is precisely the outcome Lutan's rule exists to
prevent. A proposal therefore **cannot live on the row at all**.

`label_drafts` holds it beside the row. The row is untouched until approval, and **nothing that reads a `_th`
column changes or needs to know the table exists.** That property is the whole design and nothing in the app half
may weaken it.

```
propose_label_th(table, row_id, column, text) -> boolean   writes the draft. NEVER touches the row.
approve_label_th(table, row_id, column)       -> boolean   publishes the draft onto the row, then clears it.
discard_label_draft(table, row_id, column)    -> boolean   throws the proposal away. The row is untouched.
```

- **Only `approve_label_th()` and `0166`'s `set_label_th()` reach the row.** So `set_label_th()` is no longer the
  only way Thai is published, and **the proposing path cannot publish at all** — it does not read the row for
  update, does not lock it and does not write it.
- **`approve_label_th()` takes no text.** The Thai comes from the draft, never from an argument, so an approval
  cannot quietly publish something other than the proposal that was reviewed. That is asserted as proof 6.
- **`set_label_th()` is unchanged.** An approver typing Thai and pressing save should still publish at once;
  taking that away would make the screen worse for the person the rule exists to serve.
- **One draft per label** (primary key on `table_name, row_id, column_name`): a second proposal replaces the
  first. *"Proposed, waiting"* is one state, and a queue of competing proposals is not what anyone asked for.
- **`label_drafts.source_text`** is the English the proposal was written against, so a draft can be seen to have
  gone out of date **while it waited** — the same comparison `label_sources` supports for a published label.
- **`label_translations()` gains one status value and four columns.** `proposed` replaces what would otherwise read
  `missing` or `as_typed`, so the screen's *missing* count stops claiming nobody has written anything when
  somebody has. **A label that already has Thai and also has a proposed change keeps `stale` or `current`** — those
  words describe the live value, which is what a reader of the app sees — and carries the proposal in
  `draft_text_th` / `draft_source_text` / `draft_proposed_at` / `draft_proposed_by`. It is dropped and recreated
  because a function returning a table cannot gain columns through `or replace`.
- **A spent draft clears itself.** `record_label_sources()` (a trigger function, so still outside the
  `security definer` rule) now deletes a draft whose text is what the row's Thai now says, by whatever path it got
  there, and deletes a draft when its row is deleted. Without that, approving a diet's Thai on the Diets screen
  would leave a proposal sitting on Translations for Thai that is already live.

---

## 3. The access rule, said as cards

**Every gate in both files is a card-derived activity and nothing else.** No role key, no role name, no role
column, no `kind`, appears anywhere in `0293` or `0294`. `propose_label_th`, `approve_label_th` and
`discard_label_draft` each ask `has_permission('translations.manage')`; `label_drafts`' one policy and
`label_translations()` ask `translations.view` **or** `translations.manage` at Read, exactly as `0166`'s do. Admin
sits outside the card system and is untouched.

**Does proposing need a different grant from approving? Yes, it does — and it is NOT created here.**

The argument for it is card-shaped and worth keeping: **the two acts have different consequences.** Proposing
puts Thai somewhere no reader of the app can see; approving puts it on every screen and on the public website. A
login that can only propose can do a great deal of real work — entering the 72 proposed Thai labels from the
2026-10-31 sweep — **without being able to publish one word of it.** That is exactly the shape a card is for, and
there is no existing lever that gets it: **`translations.manage` is `kind: "yesno"`** in
`src/lib/permissions/catalogue.ts`, so there is no Read-versus-Edit split to lean on. It is one switch.

**The name: `translations.propose`, `kind: "yesno"`, `area: "management"`, carried by its own card.**

**Why not now, and this is a constraint rather than a choice.** An activity must exist in **both**
`src/lib/permissions/catalogue.ts` **and** `permission_activities`, in one PR, or `npm run lint` fails — the
catalogue says so in its own header. `catalogue.ts` is an `src/` file this stream must not touch, and an activity
needs a card in `src/lib/permissions/cards.ts` to carry it or it can never be granted through the card system at
all. Adding the database row alone would make the gate **dead for everyone but Admin**, which is a card that does
nothing, and the rule forbids that. So the migration asks the card that exists, **says so in its own header**,
and the swap is the app half's first job.

**Nothing is lost in the meantime.** No login gains anything it did not have: a login that can approve can also
propose. What is deferred is only the ability to let somebody propose *without* being able to publish.

---

## 4. The proof, and what it does not cover

**`scripts/prove-label-drafts.mjs`** exercises both files against **real rows** inside one
`begin … do $$ … $$ … rollback`, in the shape of `scripts/prove-write-requests.mjs`. Fourteen numbered proofs,
each a `raise exception` the Management API surfaces as an error. The three the brief asked for are **4** (a
proposed label is not the live Thai: the row's `_th` is untouched and the screen reads `proposed`), **5**
(approving publishes it, clears the draft and reads `current`) and **2** (all eleven newly registered columns are
reported by `label_translations()` once their English is filled in). The rest cover rounds staying out, a second
proposal replacing the first, discard by empty text and by `discard_label_draft()`, refusals for an unregistered
label and a missing row, a spent draft clearing itself, a deleted row taking its draft, a proposal on a label
that already has Thai, and `label_drafts` being closed.

**It was verified to be capable of failing.** Proof 4's assertion was inverted once and reported
`4 FAILED: proposing wrote <NULL> onto the row. A proposal must never publish.` A proof that cannot fail proves
nothing.

**It kept nothing**, checked afterwards rather than assumed: `label_drafts` holds 0 rows on dev and no `PROOF`
row survives in `diets`, `units`, `features`, `role_groups`, `memes` or `site_content`.

**And it found a real bug, which is why the harness was worth the hour.** Proof 10 failed on the first run:
`propose_label_th()` relied on `FOUND` after an `EXECUTE … INTO` to tell a real row from a missing one, which is
not something `EXECUTE` reports reliably, so a proposal against a row that does not exist **returned true and
wrote a dead draft** — harmless to readers, because `label_translations()` walks the real table and would never
list it, but the file's own comment claimed the opposite and the screen would have reported a save that
referenced nothing.

**That is why there are two migrations.** `0293` had already been applied to dev when the proof found it, and
**an applied migration is never edited** (`CLAUDE.md`): a database that had run the old text would otherwise
differ from the file for ever with nothing to say so. `0294` restates the function asking how many rows match,
in so many words, before writing anything. The brief asked for one file; this is two, and the fault and its catch
stay visible in history instead of being tidied away.

**What it does not cover, said rather than implied:** the Management API runs as the database owner, so the
grants in proof 14 are read from the catalogue (`has_table_privilege`, `has_function_privilege`) rather than
exercised as `authenticated`. `auth.uid()` is set through `request.jwt.claims`, which is how the functions read
it in production, but the SQL role is not switched. And it has only run against **dev**: a worktree cannot read
production.

---

## 5. The `-- consumer:` header: `src/lib/translations/labels.ts`, and why not `none`

**`-- consumer: src/lib/translations/labels.ts`**, on both files. **This is the opposite answer to `0292`'s
`none`, reasoned from the same mechanism rather than copied from it.**

The header feeds exactly one thing: `apply-migrations.mjs` warns when a migration's declared consumer is **not in
the release assumed live**, so schema is not applied ahead of the code that reads it. `0292` chose `none` because
nothing read it on the day it landed. **Here something does, and it is already deployed.**
`src/lib/translations/labels.ts:54` calls `label_translations()` today, `0293` replaces that function, and
**registering eleven labels puts them on the Translations screen the moment the migration applies, with no app
change at all** — `labels.ts` says so in its own comment: *a table registered later with no entry here simply has
no link; the label still shows and can still be translated.*

So the honest declaration is the file that calls the function. It is identical at the assumed-live release and on
`main`, so the warning stays silent, **and that silence is the correct answer** rather than an absence of one.
`page.tsx` is deliberately **not** listed: it consumes the rows through `labels.ts` and does not call the
function, and #1113's fault was a header naming a file that did not consume what it pointed at.

**The gap this leaves, named rather than hidden:** the header cannot say *"the new draft columns have no reader
yet"*, because the same function has both an old reader and new columns. Nothing warns about that, and nothing
needs to: on the day this lands there are **zero** drafts, so no row can carry `proposed` or a draft column.
Which leads to the one thing that must not be done early.

---

## 6. Declared crossing: eleven `UNION` arms in `scripts/lib/readonly-checks.mjs`

The brief forbade `src/` and named the `fixed_outgoings.label` arm as another stream's. **This changed a
different part of the same file, and it is declared rather than quiet.**

`translations-open` reads the registered label pairs through one hand-written `UNION` arm each, and **names any
registered pair it has not been taught as `uncovered`, which fails the check** — the designed behaviour from
#1128, so a label registered by a later migration becomes a gap in the *check* rather than a silently smaller
count. **Registering eleven labels and stopping there would have turned a passing production check red on the
day the migration applied**, with the release manager unable to read the translation counts at all. Eleven arms
were added, in the file's existing alphabetical order. `fixed_outgoings.label` was **not** touched: it is already
covered on `main`, and it stays the other stream's line. The check now reports *"Every registered label pair is
counted."*

**Drafts were deliberately NOT taught to that check**, and the reason is in a comment beside it: the query would
then name `label_drafts`, and a database that has not had `0293` applied — **production, today** — would stop with
*"could not run"* instead of reporting its counts. It costs nothing until a draft exists, and it is a line in the
app half's brief.

---

## 7. Found and left for the app stream, so nothing is inherited silently

- **Two new group headings have no words.** `home` and `social` are not in `GROUP_ORDER` in
  `src/lib/translations/labels.ts` and have no dictionary entry. `sortGroups()` widens rather than narrows, so
  they **appear** at the end of the screen with a raw key as the heading — the same shape as the `appeals` heading
  already filed. The labels are usable on day one; the headings are ugly.
- **Five newly registered tables have no entry in `LABEL_SCREENS`**, so those labels show with no link to the
  screen they are typed on. `labels.ts` documents that as the intended fallback.
- **The three things the brief handed to the app stream are untouched:** translating the wording itself, the
  appeals `proseGroup()` heading, and the `fixed_outgoings.label` arm.
- **"Stop the next one going missing" is still open.** `translations-unlisted` exists and now reports exactly one
  column, the deliberate one, but nothing *runs* it as a gate. The item asks for it in the release checks or as a
  file-only CI check with `rounds.name_th` as its one named exception. **That is the half of item 1 that no code
  in this PR closes.**

---

## What the app half must do, because the schema cannot do it alone

1. **Create `translations.propose` and the card that carries it, then flip the two gates.** A row in
   `src/lib/permissions/catalogue.ts` (`kind: "yesno"`, `area: "management"`), the matching
   `permission_activities` insert in the same PR or lint fails, and a card in `src/lib/permissions/cards.ts`.
   Then change `propose_label_th()` to ask it instead of `translations.manage` — **one line, by design.** Until
   this is done, anybody who can propose can also approve, and §3 above says why that was the right place to
   stop rather than the right answer.
2. **Teach the screen the `proposed` status before anything proposes.** `LabelStatus` in
   `src/lib/translations/labels.ts` is `missing | as_typed | stale | current`; a `proposed` row would arrive
   typed as a `LabelStatus` it is not, and the `?show=missing` filter would drop it. **So do not call
   `propose_label_th()` on dev or production — not even once, not as a trial — until the screen handles it.** The
   schema is safe either way; the screen is not. This is the single most important line here.
3. **Draw the second button, and read the draft columns.** `TranslationQueue.tsx`: a *Propose* path for a login
   that cannot approve, and **Approve** / **Reject** on a waiting proposal, calling `approve_label_th()` and
   `discard_label_draft()`. Every one of those controls is drawn only when the login's cards allow that action
   (Lutan, 2026-10-27), reading the same activity its action asks — `translations.manage` today,
   `translations.propose` for the proposing control once step 1 lands.
4. **Say "proposed, waiting" in the counts**, and show who proposed it and when, from `draft_proposed_by` /
   `draft_proposed_at`. A draft whose `draft_source_text` differs from `source_text` went out of date while it
   waited — the same comparison the screen already makes for a published label.
5. **Add `home` and `social` to `GROUP_ORDER` and give them headings**, and add the five new tables to
   `LABEL_SCREENS` so their labels link to the screen they are typed on.
6. **Teach `translations-open` about drafts** once `0293` is on production, and not before (§6).
7. **Then enter the 72 proposed Thai labels from the 2026-10-31 sweep as proposals**, which is the thing all of
   this was for: read on the screen by a Thai speaker, approved with a press, instead of read on paper and typed
   in by hand.
8. **Re-run `node scripts/prove-label-drafts.mjs`** after any change to the four functions.
