# 2026-11-14 — The system is called Cooper Jaidee, and that unblocks the multi-tenancy build

**Lutan, 2026-11-14, in chat: *"ok we will use cooperjaidee as the system name"*, and immediately after:
*"I will buy the domain tonight"*.**

This is the decision `#ykefa` has been waiting on since 2026-10-09. It is recorded here rather than only in
a plan file because **several documents say in terms that work is blocked until the name exists**, and the
next session to read any of them needs to know it no longer is.

## What was chosen, and what it was chosen over

**Cooper Jaidee** (`cooperjaidee`). The shortlist he was shown on 2026-11-13 was **CooperCare**, **Cooper
Jaidee** and **Baan Cooper**, with the deciding test put to him as *what will people shorten it to*. He had
said he was torn between honouring Cooper — his late dog, whom the project is named for — and the
*jai dee* (kind-hearted) idea. **Cooper Jaidee carries both**, which is why it was on the list.

**The name honours a real animal and that is the point of it.** Anything built on it should keep that
plain rather than explaining it.

## The domain

**All three were free when checked by RDAP on 2026-11-14, minutes before he decided:**

| domain | state |
|---|---|
| `cooperjaidee.org` | AVAILABLE |
| `cooperjaidee.com` | AVAILABLE |
| `cooperjaidee.net` | AVAILABLE |

**REGISTERED THE SAME DAY. Lutan, 2026-11-14: *"ok cooperjaidee.org is now mine and available for use on cloudflare"*.** Confirmed by RDAP minutes later: `cooperjaidee.org` **registered 2026-11-14, expires 2028-11-14**, status *client transfer prohibited, add period* — the ordinary state of a fresh Cloudflare registration. **`.com` and `.net` were still free at that moment and he took neither**; asked which to make canonical, the recommendation was `.org` (every public deployment is already `.org`, the users are non-profits, and a `.org` beside a donate button is what a donor expects), with `.com` worth taking defensively and `.net` not worth taking at all.

- **It is registered, but it POINTS AT NOTHING and no stream may change that.** There is no DNS record, no Worker route, no Pages project and no certificate beyond what Cloudflare does by default. **Nothing deploys to it, and no code, test or document may assume it resolves.** Its first real use is the multi-tenancy build, which is a programme the planner sequences — not something a stream starts because a domain exists.
- **`lannacareforanimals.org` is still production** and `lannacare.org` still 301s to it. **This decision
  changes neither**, and no DNS, Cloudflare or Worker change follows from it today.

## What this unblocks, and what it does NOT

**Unblocked: the multi-tenancy BUILD** — `#ykefa`. Its own text says *"deferred until Lanna is live and the
product has a name"*, and three planner editions have recorded the name as the thing with him. **The parts
that were waiting on it:** `shelter_id` across the tenant tables, the restrictive per-shelter policies,
`current_shelter_id()` and `is_trusted_caller()`, per-shelter Drive (each shelter's own Google account),
roles a shelter adds at setup, and **the permanent canary diff**, which could not be built at all because
there was no shelter concept to plant a second shelter into.

**Already shipped without it, and not affected:** the **hardening** the spike said must ship with tenancy —
`scripts/check-tenancy-catalogue.mjs` (#1573) and the re-own to `rls_definer` in `0375` (#1580). Those were
deliberately split off precisely because they needed neither tenancy nor the name.

**NOT unblocked, and nobody should read this as permission to start:** `#ykefa` is **≈50 hours (40–65)**
measured by the spike, and the re-own found the object counts **40% larger** than the spike priced (53
owner-run views and 92 definer functions on dev, against 38 and 58). **It is a programme of streams across
several days, and it is the planner's to sequence** — not something to begin inside another stream because
the name arrived.

## What is NOT decided here

- **Whether anything is renamed in this repository.** The app, the GitHub repo, the Supabase projects, the
  Pi service names and the existing domains are all untouched. "The system name" is what the product is
  called; **a rename of code, infrastructure or branding is separate work and has not been asked for.**
- **Which TLD becomes canonical**, and whether the Lanna site eventually moves. His, tonight and later.
- **How a shelter's own name appears beside the product's** on its public site. That is part of the tenancy
  build's design, not of this decision.

## Where this is recorded

- This file.
- `docs/backlog.md`, `#ykefa` — one consolidated note, on the `backlog` branch.
- `docs/planner-handover.md` edition `747`, which otherwise told the next planner the name was still with
  him. **That line was corrected in the same change as this file.**
