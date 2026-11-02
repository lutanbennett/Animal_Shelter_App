# `loadClinicScope()` reads "any clinic" for every login: intended, harmless to access, but the code and three harnesses still describe a retired model

Stream `clinic-scope-inert`, 2026-11-02. An answer, not a repair: no migration, no policy change, no new card.

## Answers

**1. Is the inert scope intended? Yes.**
- `0264_inert_security_leftovers.sql:1-9` header: every function it rewrites "answers a constant, so this changes NO access", and its `-- consumer:` line names `src/lib/clinics/scope.ts` — the file was known to read it.
- `0264:629-636`: `current_user_clinic_ids()` is `select '{}'::uuid[]`. Its decision file (`2026-10-25-inert-security-leftovers.md:32-33`) says it "read `is_clinic_login()` and so answered a constant".
- `0259:103`: the narrowing was driven by `roles.scope_clinical`, a role column, now dropped (`0264`, section 6).
- `0266:10-12` and `0273:8-9` kept the function only because `scope.ts` still called it. Never a decision to keep the narrowing.
- `scope.ts:31` turns the empty answer into `{ kind: "any" }`, so the `clinics` and `unlinked` branches are unreachable today.

**2. Does RLS still narrow writes? No — not by clinic.**
- `clinic_visits_insert_perm` asks only `visit.book` (`0264:153-154`); `clinic_visits_update_perm` asks only `medical.visits` (`0264:78-80`); select asks `medical.visits` at read (`0264:76-77`). The `doctor_*_clinic_visits` policies were dropped (`0264:54-56, 69`). No delete policy exists (`0268:16`).
- `current_clinic_resident_ids()` is called only by `current_doctor_resident_ids()` (`0264:620-627`). After `0264` no migration's policy or view mentions `current_doctor_resident_ids()` (grep of `supabase/migrations`), so nothing enforces either helper. The old comment's "RLS agrees" was false.
- The planner's production reading ("called by 1 — `current_doctor_resident_ids`") agrees: a function calling a function, no policy. Caveat: I did not read production's `check-production.mjs` SQL or run it; this is from migration files, which the hard-coded-security check also cannot see past.

**3. Can a login be offered a clinic the database then refuses? Not by clinic.** Insert and update ask a card, never a clinic, so a login holding `visit.book` can book at any clinic the page lists and the database accepts it. Not driven in the browser pane (no one-card login run); this is a policy-text reading plus the harness behaviour below.
**But a different offered-then-refused case is real** (deliverable 7): `check-doctors.mjs` `rls` fails `42501` on `doctors`. `clinic_visits_link_doctor()` is security invoker and adds a typed doctor name; `doctors_insert_perm` asks only `clinics.doctors` (`0182_perm_policy_cleanup.sql:54-56`, "adding a doctor: clinics.doctors only"). `0147:217-221` had also let `visit.book` insert; `0182` removed that. So a login holding `visit.book` without `clinics.doctors` who types an unknown doctor name is refused. This is a card-state fact, not a stale harness line alone: the harness's expectation ("booking adds the doctor") is stale against `0182`, and the app consequence (the form allows a typed name) is a finding. Fix direction, for the planner: narrow what the form offers (typed new-name entry only with `clinics.doctors`) or decide that `visit.book` should add doctors (a permissions change; not mine).

## Harness verdicts (dev `qxkmhwybjggxvsfxsxbd`; none edited)
| Harness | Red | Verdict |
|---|---|---|
| `check-clinics-readonly.mjs` | `HARNESS-FAIL setup: the doctor login is not at its own clinic (current_user_clinic_ids)` (line 117) | Stale: asserts the retired model. Sections A–B behind it assume clinic narrowing that no longer exists, so it needs a rewrite, not a one-line edit. |
| `check-doctor-multi-clinic.mjs` | `HARNESS-FAIL A: moving a visit left it with a doctor who is not at its new clinic (-1)`; section C (224-228) also asserts real clinic lists | Stale in C (asserts the retired function). The A failure was reached first and is a separate doctor-link assertion I did not diagnose. |
| `check-doctors.mjs` | `rls`: `42501` on `doctors` (above); `behaviour` prints HARNESS-OK then raises at its own line 146 | `rls`: card-state/stale-expectation as above. `behaviour`: its assertion on `current_user_clinic_ids` is stale; the wrapper reports OK text via RAISE, so I did not read it as a pass. |

I did not edit any check: a faithful fix is a rewrite onto card-shaped assertions, which I did not scope.

## Recommendation for `scope.ts`
Rewrite card-shaped later, or delete: the five importers get "any" always, so the file adds a database round trip per page and two dead branches. Cleanest: replace `loadClinicScope` with a constant `any` (or drop the calls) and delete `current_user_clinic_ids()` / `current_doctor_resident_ids()` / `current_clinic_resident_ids()` in one migration after the harnesses are rewritten. I changed only the comment.

## Could not establish
- Browser proof with a one-card login; production policies (run below).
- Cause of the `check-doctor-multi-clinic` A failure.
- Whether `check-doctors.mjs` `behaviour` is truly passing.
- Which cards the harness's login holds on dev (Doctor test state is deliberate; not touched).

## Commands for the planner (production, `dbkodyyxxhtygxcxmfcu`)
- `node scripts/check-production.mjs clinic-login-helpers` (read its SQL in `scripts/lib/readonly-checks.mjs` first)
- `node scripts/check-production.mjs table-policy-commands` to confirm `clinic_visits` policies match `0264`/`0182` there.
