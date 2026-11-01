# The public desexing sign-up is replay-safe: the request id is the row's id (0297)

Backlog item: `/services/desexing` cannot go on `WRAPPED_WRITE_PATHS` until anon may supply the sign-up's `id`.
Reasoning it follows: `2026-11-01-write-paths-tail-b.md` section 4.

## What was built

1. **`0297_desexing_signup_request_id.sql`**: `grant insert (id) on desexing_drive_signups to anon`, and
   `desexing_signups_gate()` re-created with one early step (below). The insert *policy* (`status = 'new'`) was
   not the obstacle and is unchanged: the brief asked whether a policy also blocked it, and it does not. Only the
   column grant did.
2. **The form** sends a `useWriteCall` id; `signUpForDrive(fields, requestId)` refuses a non-uuid id and inserts it
   as `id`. A `23505` (primary key) answer is treated as done.
3. **`/services/desexing` is on `WRAPPED_WRITE_PATHS`.**
4. **`check-wrapped-write-paths.mjs` gained a third declaration, `row-keyed`.** This was needed and is outside the
   brief's named files. `read-only` and `replay-safe` are *refused* when the module shows `.insert(`, which this
   module must. `row-keyed` inverts the guard: it is accepted only if the module shows a write **and** `id: requestId`
   (the request id used as the key), and refused otherwise. It is still an assertion about the helper-free module,
   with the same stated limit as the others.

## The caveat, decided: a replay after the drive is full

The item warned that the gate trigger runs before the key check, so a replay after the last place went would meet
"full". **Fixed, because the fix is small and safe.** In the gate, an anon insert whose `id` already exists now
`return null`s (a `BEFORE INSERT` row trigger returning NULL skips the row with no error) *before* any limit is
counted. So the replay is a quiet success, never a false "full", "too many for this phone" or "rate limited" to a
member of the public who had in fact signed up.

Why that is safe: the check runs inside a security-definer function, so anon learns nothing: it gets the same
success whether the id was new or already stored. Guessing an id cannot overwrite or read anything, it only skips an
insert. A concurrent duplicate that races past the check hits the primary key (`23505`), which the app treats as done.
Cost: one indexed primary-key probe per anon insert.

Not exercised: the replay-after-full case itself (it needs a drive at capacity). The ordering is by construction (the
new step is above the capacity test) and the replay path it shares with the tested case was proved.

## What it widens

anon gains INSERT on one column, `id`, of a table it could already insert into. It still cannot select, update or
delete, and status stays forced to `new` by policy and trigger. A visitor can now choose their own row id; the only
effect is that a repeat of an id is ignored.
`node scripts/check-hard-coded-security.mjs` before and after: `no coded security outside the Admin bypass`, same
card-derived counts (can-use-bills 11, page-rules 46, outside-registry 4, opens-any-in 9). It reads migrations for
policies and security-definer functions calling a card/Admin function; 0297 adds a column grant and re-creates
a function that `0233` had already made acceptable, and the check stayed clean.

## Measured

`node scripts/check-wrapped-write-paths.mjs --all`, on **this branch** (not merged `main`):
before 3 unwrapped addresses, 146 of 149 complete; after 2 unwrapped (`/admin/security`, `/admin/security/verify`,
untouched and deliberately left), 147 listed, 147 of 149 complete.

Replay proof on dev, as anon over REST with the real anon key: id A first, 201; id A again, 201; fresh id B, 201.
Reading back as service role: exactly two rows, A and B. The proof rows were then deleted.
**Not driven:** the form itself in a browser; the server action's `23505` branch (the gate absorbs the ordinary replay).

## Found, not fixed

- The public sign-up has no per-IP limit beyond the global 60 an hour (0233's own choice).
- `admin/security` and `admin/security/verify` stay unwrapped on purpose (a wrapped result is stored seven days).
