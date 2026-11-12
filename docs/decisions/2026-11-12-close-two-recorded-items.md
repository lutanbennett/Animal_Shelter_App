# Two recorded answers written down, and the one optimisation that needed no measurement

2026-11-12, stream `close-two-recorded-items` (branch `claude/close-two-recorded-items`).

Backlog items `#f56bs` (Assistant) and `#7bd5u` (Public website). Neither item
needed a decision from anybody: both had been answered and neither answer was
written where it belonged. This file records what was written, the one line of
code that changed, and — the part most likely to be re-derived — **why four of
the five public-site optimisations were deliberately not attempted today.**

## 1. `#f56bs` — always on, written into the runbook

Lutan decided on 2026-11-06 that the assistant's model machine is **always on**.
The decision was recorded on the backlog item and nowhere else, so the runbook
that a person actually follows still offered three open choices.

`docs/self-hosted-model-runbook.md` now has a section of its own, **"The machine
stays on: decided, and what it means in practice"**.

**It was placed where the three choices used to stand, not appended to the end.**
That matters: the three choices were what the decision supersedes, so leaving them
in place and adding a contradicting paragraph later in the file would have left a
runbook that says two things. The section opens by naming the three closed options
so that somebody who remembers them can see they are closed.

What it says, in the runbook's own plain-steps register (it is written for Lutan,
not for a developer):

- Never sleep, never shut down, and the Windows setting that does it
  (Settings → System → Power, Screen and Sleep both **Never** on mains).
- **The 11-second wait in the table just above it never happens.** That wait is
  what a *sleeping* machine costs. This is the sentence the section exists for:
  the table and the decision sit next to each other and now agree.
- Wake-on-LAN is **not** needed and is not being set up — it only ever existed as
  a way round sleeping.
- The idle power draw is named as the real ongoing cost of keeping this in house.
  It is not zero, and it should be stated rather than discovered.
- The keyword reader is unchanged, still the safety net for a restart, a Windows
  update or a power cut.
- **None of it is set up, and it waits on one thing only: the machine existing**
  (`#z04wr`). Until then the spare i7 laptop stays the build-and-measure box and
  is not expected to be on.

The item is ticked, and its title rewritten so it reads as done without its tail.
Its remaining dependency is the machine, which is `#z04wr`, not this item.

## 2. `#7bd5u` (b) — the header logo, proved by bytes

`src/app/AppHeader.tsx` drew the logo at `width={28} height={28}` inside an
`h-8 w-8` span, and loaded `/lca-logo.jpg`, which is 781×746. It now loads
`/lca-logo-160.jpg`, which is 160×153 — still over twice the 28 CSS pixels asked
for, so a high-density display is covered with room to spare.

| File | Bytes |
|---|---|
| `public/lca-logo.jpg` (before) | 33,032 |
| `public/lca-logo-160.jpg` (after) | 5,492 |
| **Saved** | **27,540** |

That saving lands on **every signed-in page**, because this header is drawn by the
root layout.

**Proved by `ls -l` and by the browser's own resource timing, not by a Lighthouse
score.** Two sibling streams were building on this machine for the whole of this
one, and load moves a score 12–17 points (`CLAUDE.md`, *"Measuring the public
site"*). Measured in the browser on port 3003, signed in, after clicking through:
one request for `/lca-logo-160.jpg`, 5.4 KB encoded, natural size 160×153,
rendered 24×23 inside the 28×28 box (the span's `p-1` accounts for the
difference), and the logo paints correctly in its circular badge.

**The ~1 point this was predicted to be worth is not claimed anywhere**, and must
not be quoted as measured. Nobody measured it.

### The staff-paths caveat needed no further change

`#7bd5u` attached a caveat to (b): *"check the staff paths, since that header is
drawn on every signed-in address"*. Checked, and it needs nothing:
`/lca-logo-160.jpg` was **already** on both `PUBLIC_PATHS` and
`LOCKED_PUBLIC_PATHS` (`src/lib/public-paths.ts:34,81`), so it is reachable
whether or not the public site is locked.

**The other five call sites of `/lca-logo.jpg` are deliberately untouched**, and
this is a decision rather than an oversight:

- `src/app/login/page.tsx`, `login/forgot`, `login/request` draw it at 72×72 — a
  160 px source is marginal there, and the login page is one page, not every page.
- `src/app/layout.tsx` uses it as the favicon and `MemeMaker` composites it — both
  want the large file.
- `src/components/OfflineBanner.tsx` uses it as its reachability **probe**, where
  the file's size is not the point and changing it would alter what is being
  probed.

## 3. Why (a), (c), (d) and (e) were not done — stated once

**The instrument, not the appetite.** Lighthouse on this machine moves a score
12–17 points with load; two other streams built throughout; and a false "the public
site has got slower" finding of exactly this kind has already cost a complete
bisect stream (`docs/decisions/2026-11-02-public-site-speed-bisect.md`). Running it
anyway would have produced a figure that **looks like evidence and is not**, which
is worse than no figure.

- **(a) unused JavaScript / the 280 KiB shared set — wanted, needs a quiet
  machine.** Still the biggest single win. It is bundle surgery, and the only way
  to know it helped rather than merely moved code about is a before-and-after.
- **(c) defer the Google Map on Shelter Friends — wanted, needs a quiet machine.**
  ~570 KiB and the most visitor-visible of the five. **The one to do first.**
- **(d) reserve space for the Appeals and Shop footer and grid — wanted, needs a
  quiet machine.** One honest nuance: layout shift is *less* load-sensitive than
  the overall score, so this is the one that might survive a noisy measurement —
  **but the 0.04–0.07 figure it aims at was itself taken under load and was never
  re-measured by #1207.** The target is unproven, so a fix today would be aimed at
  a number nobody has confirmed. Measure first.
- **(e) the Thai font — cannot be settled here, and is not being guessed at.**
  Thai ran 5–14 points under English, that gap was **also** measured under load,
  and the item says to re-measure Thai on a quiet machine before touching
  anything. This stream was not a quiet machine, so it has nothing to add.
  **It is not recorded as "not wanted"**, because that would assert something
  nobody has measured. Whether (e) is a real gap is still unknown.

`#7bd5u` therefore **stays open on purpose**, and its title now says what is open:
four optional optimisations, all four waiting on a quiet machine. Its done-when is
nevertheless satisfied in the sense the item asks for — each of (a)–(e) is now
either done or recorded — and the judgements live in **one consolidated block** on
the item rather than a sixth dated note.

## 4. The measurement rule was already met — confirmed, not rewritten

The other half of `#7bd5u`'s done-when was *"the measurement rule is in
`CLAUDE.md`"*. **It already was, before this stream**, as a section of its own:
**"Measuring the public site: load moves the score"** (line 632 as read on
2026-11-12), landed 2026-11-03. All four parts are present — never benchmark while
another stream builds, interleave the variants rather than measuring in commit
order, bracket the run with the baseline twice, and record the machine load beside
every figure.

It was confirmed and cited rather than written again. Writing it a second time
would have been the more visible thing to do and the wrong one.

## 5. What would close `#7bd5u`

One session on a machine with nothing else building: (a), (c) and (d) each with a
bracketed before-and-after, and Thai re-measured for (e) before anybody decides
whether (e) is a real gap at all.

## 6. One thing found in passing, for the planner

**A dev-signin snippet cannot be loaded into the page from a file placed in
`public/`.** Serving it as `/__devsignin.js` and injecting a `<script src>` fails:
the proxy redirects the request to `/login` because the path is not on
`PUBLIC_PATHS`, the script tag receives HTML, and the console shows
`Uncaught SyntaxError: Unexpected token '<'` — which looks nothing like an auth
problem. The route that works, and needs no change to any path list, is to serve
the snippet from a separate local port with `access-control-allow-origin: *`, fetch
it from the page and assign the cookie value directly, without `eval`.

Worth knowing because the pasting step is where transcription errors happen, and a
mistyped JWT presents as `?error=expired` — identical to a genuinely dead session.
The token's `exp` claim is the thing to decode before believing the word
"expired". **Not filed as a backlog item: this is the planner's to file if it is
wanted.**
