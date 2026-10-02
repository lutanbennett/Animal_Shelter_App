# 2026-10-02 — A vet reads id, name and type of a contact; a volunteer name and phone; no login emails (`0126`)

Lutan's decision, 2026-10-02, on the database review's DB-5 and DB-8: **vets
get id, name and type only; volunteers get name and phone; staff and above keep
everything.** The "no access at all" alternative for vets is closed, and so is
the older question *Should a vet read the shelter's address book at all?* — a
vet keeps a minimal view rather than none. Thai PDPA is the reason, so the
smaller column set is the point.

**This supersedes `0105` and `0108`**, which each recorded that
`vet_read_contacts` was deliberately left alone pending this decision. Neither
was wrong to; the question was open and is now answered.

- **Views, not policies or column grants.** `vet_read_contacts` and
  `volunteer_read_contacts` (`0001`) were row policies, so both roles read
  every column from `/rest/v1/contacts`. A policy cannot narrow columns and a
  column grant is per Postgres role — `authenticated` for every app role alike.
  So the policies are dropped and each role reads a fixed-column view,
  `vet_contacts` (id, name, type) and `volunteer_contacts` (id, name, phone),
  `0122`'s pattern: a new `contacts` column is private until named in a view.
  The views are owner-rights and gated on `current_user_role()`, so any other
  role, and anon, gets nothing.
- **The id is in both views.** The brief named columns for what a role may
  *see*; a row with no key cannot be linked to or joined, and a uuid is not
  personal data. That is the one call the decision did not spell out.
- **Embeds follow the view.** PostgREST resolves `carer:vet_contacts(name)`
  through the foreign key on `placement_history.carer_id`, so the resident hub
  keeps its carer and sender names. `src/lib/contacts/visibility.ts` picks the
  relation by role. A vet no longer gets a carer's archived state on the
  housing section (`archived_at` is not in the view); a volunteer's contact
  list and page lose the type chips, badge, address, email and notes, and the
  contact page the Shelter Friend card (which needs the type).
- **`check_carer_type` is now security definer.** It read `contacts` as the
  caller on every placement write; a volunteer inserts `ChangeEnclosure`
  placements, so it must not depend on that caller reading contacts.
- **DB-8: login emails.** `private.app_users` returns a null `email` to a vet
  or a volunteer; the column stays so the public gate (`0086`) and the app's
  select list do not change. The cost is that a vet or volunteer sees no
  fallback for a login with no Google display name (the picker shows "—").
- **Proved with refusals, not renders** — `scripts/check-contact-visibility.mjs`,
  one rolled-back transaction on dev, with each role's own JWT: a vet reads no
  row of `contacts`, and `vet_contacts` has no phone, email, address, LINE,
  WhatsApp, Messenger or notes column; a volunteer likewise, with name and phone
  intact; staff, management and admin still read every column; anon is refused;
  vets and volunteers see logins with every email null.
- **The vet's resident page.** The queries it runs for a carer or sender name
  now go through the view; `doctor-multi-clinic-feature` changes which
  residents a vet sees, not how a name is read; its branch (@ `fd13073`)
  touches no file this change does, so the two cannot be confused.
