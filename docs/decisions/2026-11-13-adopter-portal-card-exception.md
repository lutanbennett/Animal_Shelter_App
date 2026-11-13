# 2026-11-13: the adopter/foster-carer website account sits outside the card system (backlog #d6wxo)

**Decided by Lutan in writing (the backlog item dates his answer 2026-11-14; recorded here 2026-11-13).** Offered three shapes for the portal's gate: (1) an ordinary app login holding
one new card, scoped by a database rule to the residents they adopted; (2) a website-only account outside the card system;
(3) not now. He chose (2), was told it "needs you to agree an exception to your zero-exceptions rule, so I'd want it in
writing from you", and answered: **"Yes, an exception."**

## What is recorded
`CLAUDE.md` ("Hard-coded security is forbidden") now records one second exception, scoped to a non-staff account that
signs in on the public website, posts progress updates and photos only on residents it adopted or fosters, has them approved
before publishing, and reaches nothing else.

## What it is not
- Not a precedent: nothing else may sit outside the card system by citing it or Admin.
- Not a change to Admin's bypass (`perms.isAdmin`, SQL `key = 'admin'`).
- Not a loosening for any app login: everything beyond posting updates on its own animals stays card-governed, and staff
  approval of those updates is a card.

## Left for the portal stream
Whether the sign-in is an app login at all, and how it links to the contact row. When built, record it under
`outsideTheCardSystem` in `docs/hard-coded-security-registry.json`. This PR changes no code and not the check, which has
nothing to ignore until then.
