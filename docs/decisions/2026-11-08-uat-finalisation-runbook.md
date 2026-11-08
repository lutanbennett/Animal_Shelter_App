# 2026-11-08: one list to finalise UAT, and a preflight that proves its configuration

Lutan, 2026-11-08: *"Can you consolidate all things left to be done to finalise the UAT environments and
put it into a stream."* Stream `uat-finalise`.

## What was done

- `docs/uat-finalisation.md`: the seven steps in dependency order, each with whose hands and the command.
  It links to `docs/pi-hosting.md` and the decision files rather than copying them.
- `scripts/check-uat-ready.mjs` (logic in `scripts/lib/uat-ready.mjs`, tests in
  `scripts/check-uat-ready.test.mjs`): read-only, wired into nothing. Reads the required set from
  `PI_REQUIRED` and `PI_FORBIDDEN` in `scripts/lib/runtime-config.mjs`, never a copy. Fails on a missing key,
  a Supabase URL that is not `fsjagxmxjosauwmxwype`, a Drive root equal to production's or Test's, either
  calendar key present, an `ORIGIN_KEY` that differs from production's; warns on the token rules. It prints
  names and verdicts only, and a test asserts no value appears in its output.
- `docs/pi-hosting.md`: memory step reworded as a confirm (the figures were measured on 2026-11-07), the
  Pi's `.env.deploy.uat` is said to hold no `SUPABASE_ACCESS_TOKEN`, and a pointer to the list.
- The four backlog items (`#uat7p`, `#u7d3b`, `#rqv5c`, `#uq4vz`) are retitled to read correctly without their
  last paragraph; none is ticked.

## Why it is shaped this way

- **The two copies of `.env.deploy.uat` differ on purpose** (the dev machine's has the Supabase token, the
  Pi's must not). It was written down nowhere; the list now says it in one sentence.
- **Never "copy the `GOOGLE_*` keys".** Only the three `GOOGLE_OAUTH_*` account credentials are shared; the
  Drive root is UAT's own and the two calendar keys stay out, so a tester cannot write onto the real
  calendar. `check-uat-ready` fails on either calendar key.

## Findings, not fixed here

1. **`drive-copy-tree.mjs` creates a new root at the top of My Drive** (`parents: ["root"]`, about line 160);
   it does not fill UAT's empty root from the 2026-11-07 bucket work. After the copy, the printed id has to
   become UAT's `GOOGLE_DRIVE_ROOT_FOLDER_ID`, or UAT keeps using the empty folder. Recorded in the list and
   on `#rqv5c`. Not changed: it is Lutan's step and a small choice.
2. **The restore recipe was proved on a fresh project; UAT is not one** (326 migrations already applied).
   The list tells him to run `apply-migrations --status --env uat` afterwards.
3. **Only the default dark theme shows UAT's indigo.** Light, high contrast and magenta redefine the same
   tokens later in `globals.css` and win; the header's fixed-colour strip and badge are what identify UAT
   there. This is the documented design (`globals.css` comment, `2026-10-10-user-colour-themes.md`), not a
   fault, but "UAT's colour holding under all four themes" was never literally possible.

## What was measured, and what was not

Measured on `http://localhost:3001` (dev server, signed in as a disposable admin) with `data-env="uat"` **set
by hand**: computed `--background`, `--primary` and `--danger` under each of the four themes; the Delete
button on `/admin/blood-test-types` and an error message both resolve to `--danger` under all four (dark and
magenta `#ff453a`, light `#c0261a`, high contrast `#ff7b72`). Pages were reached by clicking through.
**Not measured: that `getAppEnv()` resolves to `uat` on a real build.** The badge read DEV throughout,
which is the point. That is `#uq4vz`'s remaining half, after step 5.

Not done, on purpose: every Lutan step, `.env.deploy.uat` (never read or edited), production anything.
