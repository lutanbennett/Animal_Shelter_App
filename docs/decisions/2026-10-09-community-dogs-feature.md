# Outreach visits: the phone note, the Settings control and the public tile

*2026-10-09 · `community-dogs` (batch 81) · no migration (schema is `0169`)*

The feature half of *Record community and temple dogs helped*. The Director's
eight answers and the schema behind them are in
`docs/decisions/2026-10-09-community-dogs-unit.md`; this file records the
choices made building on them.

## With no starting number, there is no tile, not "0 dogs helped"

`public_impact_figures` returns a figure only once both its baseline count and
date are entered, and the homepage band draws one tile per row it returns
(`impactFigureStats`). That behaviour is kept for `community_dogs`. The
alternative, showing the live count alone while her number is owed, would put
a small number on the website that later jumps by hundreds when the baseline
lands: the jump the options paper warned makes the shelter look careless. Her
estimate is most of the claim, so the figure waits for it.

The Settings → Website editor now says which figures the outreach notes add
to, and the backlog item asking her for the number warns that the date must
not be later than notes already recorded, because those would silently fold
into her estimate.

## Who may write is Settings → Security, one choice per role

She asked for "Management for now — can this be an option to change later in
Settings". The schema made that one cell, `community.outings`. The control is
a small section on Settings → Security, *Who may write outreach notes*: one
select per live role that opens the app (No / Read only / Write and correct),
Management first. It writes or deletes that role's single `role_permissions`
row and nothing else.

Why Security and not Website or a page of its own: `role_permissions` accepts
writes only from Admin at aal2 (`0132`), and Security is the one page already
behind the authenticator-app step, so the control needs no new step-up path.
It writes as the admin's own session, not the service role, so the table's
RLS and its audit trigger stay the enforcement, and the change appears in
Recent changes like any other permission edit. When a full Settings → Roles
grid exists (custom roles, parked), this section folds into it.

## The form: three steps, the last one saves

About 30 seconds standing at a temple: date and place, then what we did, then
how many dogs (with *how many sterilised* appearing only when Sterilised is
ticked, as `0169` requires), note and photos. There is no Review step, unlike
intake and maintenance: for five short answers a review screen costs more taps
than it saves. Checks run when leaving each step, and again on Save, because
the browser cannot report a required field on a hidden step.

A new place is typed on the form; a name matching a live place, ignoring case,
reuses it rather than failing on the unique index. Editing a note is one plain
form, with its photos and Delete beneath it.

## Photos are a recorded wish, not a publication

Photos upload after the save, to Drive under `Outreach visits/<yyyy-mm>/`. Each
has a *May be shown on the website* tick on the edit page, saved to
`is_public`, and the page says outright that nothing on the website shows them
yet. No public view was added and `is_public_drive_file()` is unchanged, so a
ticked photo is still served only to whoever may read the notes: the photo
proxy's internal check gained `community_outing_photos`. Publishing them is its
own piece of work, needing a page to show them on.

## The band wraps

The band could already take any number of tiles, but its grid went to three
columns past four tiles, which left seven as 3 + 3 + 1. It is now a centred
flex wrap in rows of four (two on a phone), so the last row sits in the middle.

## Her scanned sheet is transcribed, not committed

The brief asked to copy her scanned sheet into `docs/roles/`. The scan's second
page names a person, and the repository is public, so the scan stays on Lutan's
Desktop (`LCA\Answers for what we need 081026.pdf`) and
`docs/roles/2026-10-08-director-answers-community-dogs.md` transcribes the part
this work rests on, word for word.
