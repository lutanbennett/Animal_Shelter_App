# 2026-11-21 — Driving a browser proof: use headless Chrome, not the pane (`#bprf7`)

Stream `browser-proof-instrument`, port 3002.

## What the pane does (measured)

`node scripts/dev-signin.mjs management --port 3002` printed a snippet of 2,764 characters, its cookie 2,689 of them (a 2.7 KB base64 token).
It was pasted into the pane's `javascript_tool` **by retyping it into the tool call**. The pasted cookie was **2,509 characters:
180 were lost**. The app then redirected `/my` to `/login?next=%2Fmy&error=expired` about two minutes after sign-in. The original token,
decoded, was valid (expires 1 h on, not expired), so the app was reading a **broken** cookie and `proxy.ts` (line 79) labels any
unusable session as `expired`. **So "my dev sign-in kept expiring" (#1790) is, in the case measured, a corrupted paste and not a
50-minute lapse.** The cookie's real life (`max-age=3000`) was not run to its end.

**Not established:** whether #1790's own session was corrupted the same way (its stream is closed) and whether a faithfully pasted
cookie holds the full 50 minutes in the pane. I could not paste faithfully by hand, which is the finding.

## What works

`playwright-core` is already in `node_modules` (six scripts use it). `scripts/lib/driven-session.mjs` runs `dev-signin.mjs` (unchanged),
reads the cookies out of the snippet it prints and adds them to headless Chrome, so nothing is retyped. Drove it as `management` on :3002:
opened a resident's edit page, filled *Other names*, pressed **Save changes** (a POST, 200), reloaded and read the value back
(`saved: true`), then restored it. Headless Chrome fires `requestAnimationFrame`, so the pane's direct-load hydration fault does not apply.

## Which to use when

- Pane: **reading** a page, layout, a screenshot.
- Driven Chrome: **any proof that presses something**. Command and snippet are in `CLAUDE.md`, "Getting a signed-in dev session".

## Decisions

- **A helper in `scripts/lib/`, not a framework**: one 35-line module, no dependency, not wired into `gates.mjs` or CI. The example
  lives as a snippet in `CLAUDE.md`, because every proof presses different things.
- **Pane not "fixed"**: the cause is the manual retype, which no change to the pane or the script removes. A short relay (a one-shot local
  server the pane `fetch`es) would, but the driven method is better for proofs and the relay would be a second instrument to keep. Not built.
- **`dev-signin.mjs` untouched** (#1784 shipped it yesterday).

## Two gotchas from the run, now in `CLAUDE.md`

`edit` for a dev resident with no *size* will not submit: the browser blocks it silently (`:invalid`). Public text fields (bio, hook line)
wait for approval, so they do not read back after a save; use an identity field to prove a save.
