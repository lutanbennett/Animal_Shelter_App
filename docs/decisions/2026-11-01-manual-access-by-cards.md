# The manual describes access by card, not by role — and three of the sentences were wrong

2026-11-01, stream `manual-access-by-cards` (batch 7). Two backlog items under `## Documentation`,
both in `src/lib/manual/en.ts`, folded into one stream because they are the same kind of work in the
one file.

## Why this needed doing, and why no check will ever do it

`CLAUDE.md`: *"no code may fall back to a role BY NAME"*, because a shelter must be able to call its
roles whatever it likes. Describing access is not granting it, so
`scripts/check-hard-coded-security.mjs` is right to pass every one of these sentences, and the
rewrite had to be read for rather than searched for. The only durable description of who can do
something is **the activity the app actually asks**, named by its catalogue label — the shape the
`assistant` topic already uses (*"needs \"Prescriptions: what should be given\" as well as permission
to record through the assistant"*).

## The count: 57 sentences and 6 `path:` lines, not "about fourteen"

The item's examples came from one grep, which found the sentences worded *"a volunteer's list is…"*,
*"for staff and management"*, *"the 2IC"*. Reading the whole file turned up as many again in shapes
that grep missed:

- *"An admin keeps this list tidy under Settings → Medications"* — "an admin" reads as a plain
  English word, not a role key.
- *"(the Head of Medical)"* and *"(the 2IC)"* inside `path:` strings, which are not prose and are
  easy to skim past.
- *"Signed in as a doctor, the form offers only your own clinics"* — a role used as the subject of a
  sentence rather than in a list.

Six `path:` lines are counted separately because they are labels, not sentences.

## Three of the rewrites changed a fact, not only the wording

This is the part worth keeping. A sentence saying what access allows is a claim about the app, so
each rewrite was checked against the code that decides it. Three failed that check:

1. **"Doctors and volunteers aren't given maintenance jobs."** The maintenance assignee picker
   filters nobody: `loadAssignableUsers` (`src/lib/auth/app-users.ts`) offers every unarchived
   non-test login. What is true is narrower and card-shaped — the job only appears on My tasks while
   your cards let you read the board, because `loadMyMaintenanceTasks` reads through the board's own
   loader and RLS returns nothing without it.
2. **"a maintenance job or a delivery lists admin, management and staff"** (the recurring-job
   picker). It is decided entirely by the page the job links to, asked of `role_can()` on that
   page's registered activity. `src/lib/recurring-jobs/eligibility.ts` says so in its own header:
   *"Nothing here names a role."* The *"and never doctors"* clause is likewise a consequence, not a
   rule: no code excludes them.
3. **"Settings → Medications is the list itself, which only an admin can change"**, and the same
   claim for Diets and Units. All three register `reference.types` in the route registry — an
   ordinary card. Saying Admin here is both a named role and false.

A fourth, found while rewriting rather than looked for: the manual said Appointments is a **home
tile** the **Doctor role** gets from the **Book clinic visits** card. That card has opened
`/upcoming-visits` for every role that holds it since
`docs/decisions/2026-10-25-remove-hard-coded-security.md`, and Appointments is a **menu** entry
(`src/app/NavPane.tsx`), shown on `medical.visits` at Read and pointed at `/appointments` only when
the login's clinic scope is its own clinics.

## How a clinic login is described without naming a role

`is_clinic_login()` (`supabase/migrations/0167_perm_convert_vet.sql`) asks
`roles.scope_clinical = 'own_clinic'` and *"deliberately does not ask a cell"*. So the honest
wording is **"a login that works by its own clinic"** — a property of the login, not a role name,
and it stays true if the shelter renames the role tomorrow. This is also why the rule is not broken
by the `clinicRule` entry in `src/lib/permissions/fixed-for-now.ts`: that entry records which boxes
on Who does what the system does not obey, and it is keyed on a role for the grid's sake, not in the
check the database runs.

## Where a sentence was written to say less

`placement.death_withdraw` has a catalogue label but **no card bundles it** (`cards.ts` notes it was
deliberately kept out of Manage medical). So the manual names the activity and does not promise a
card: *"Withdrawing a recorded death afterwards needs \"Withdraw a death recorded in error\""*.
`reference.types`' label reads *"Setup lists: immunization, procedure and blood-test types,
frequencies"*, which does not mention Medications, Diets or Units although the same activity opens
all three; rather than coin wording, those sentences say *"a login whose cards include the setup
lists"* and name the page. That label gap is on the backlog.

## Four things deliberately not "fixed"

A role named as a **contact type** (*"their type (Carer, Volunteer or Supplier)"*); a volunteer named
as **a person** rather than an access level (*"print one for a volunteer who has no login"*, *"a
volunteer who has moved on"*); the **Roles and cards** topic, which is about roles and cards; and the
public website's **Volunteer page**, which is a page about volunteering. Admin is also left exactly
as it was wherever it is genuinely Admin — it sits outside the card system and that is settled.

## Translating

Steps 2 and 3 were written before the label drafts shipped in `0.41.0`, so they described a screen
that is live to users. Rewritten from the running page and from
`src/app/management/translations/TranslationQueue.tsx`, with a third step added for the waiting
panel. The topic's Thai is untouched: the Thai edition is its own backlog item and waits on the
real-use review, and a sentence rewritten after translation is translated twice.
