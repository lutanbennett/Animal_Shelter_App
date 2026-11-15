# Public site speed, measured on a quiet machine (#7bd5u)

**There is no speed regression and none is claimed.** These are optional optimisations from #1207's triage.

## Apparatus and machine load

Lighthouse 12 mobile (installed in the session scratchpad, not in `package.json`), `next build` + `next start` on port 3002, English nine pages
`/ /adopt /adopt/international /our-work /donate /foster /volunteer /friends /privacy`, two runs each. Builds were swapped by renaming `.next`
so baseline and variant ran from separate builds of the same tree.

**Quiet check, before the first figure:** no `node` process running except this stream's; the other worktree (`worker-rate-limit-binding`) had
no build process; CPU 1-5% over five samples. Each reading below records the CPU percentage sampled just before it
(`cpuBefore` in the raw output). Machine load was **lower and steadier in the first bracket than in the later ones**: the later runs
(the `/friends` bracket and the Thai passes) saw 11-97% before a run, with the user's own Chrome running, so those figures are noisier
and are read as such.

## Findings

**(c) Google Map on Shelter Friends: DONE.** `MapThumbnail` already had `loading="lazy"`, which skipped maps far down the page
but still loaded the one already in view at the top before anyone scrolled. That one embed was **~620 KB from Google**. Changed so the embed
is fetched only after the visitor first scrolls, touches or presses a key **and** the box is near the screen. The 200 px box is reserved
from the start (no layout shift) and the "Open in Google Maps" link over it is always there, so a keyboard or screen-reader visitor who never
scrolls still has the map one press away.

Bracketed on `/friends`, three runs per leg, with three disposable dev Shelter Friends carrying maps (removed afterwards; dev had none published):

| Leg | Avg score | Page weight | Google transfer | Machine CPU before a run |
|---|---|---|---|---|
| baseline | 74.0 | ~1437 KB | ~622 KB | 11-34% |
| variant | 75.3 | ~816 KB | 0 KB | 19-42% |
| baseline again | 74.0 | ~1435 KB | ~620 KB | 14-49% |

The two baselines agree exactly, so it is a reading. **The score moved +1.3, which is inside the noise on this machine and is not claimed.**
**What is claimed is the bytes: ~620 KB less on a page that has a map in view, deterministic and independent of load.**
An earlier variant (load when near the screen, without waiting for a first action) saved almost nothing: the first card's map is already in view
at load, so it still loaded. That is why the final version waits for a first action.

**(d) Appeals and Shop layout shift: NOT WANTED.** Layout shift measured **0 on every page measured**, including `/campaigns` (Appeals) and
`/shop`, in every run of every leg (about 90 runs). The 0.04-0.07 target was measured under load and does not reproduce. Nothing changed.

**(e) Thai: NOT WANTED, no real gap.** Same build, Thai (`locale=th` cookie) against English, nine pages, two runs each, bracketed
(Thai, English, Thai):

| Leg | Avg score |
|---|---|
| Thai first | 73.2 |
| English | 74.7 |
| Thai again | 72.3 |

The two Thai legs agree within 0.9. The gap is about **2 points**, not 5-14, and page by page it flips sign (`/donate`, `/foster`, `/adopt/international`
Thai equal or higher). That is within this machine's noise. No font change; recorded as not wanted. (The Thai second pass saw CPU spikes up to 97%.)

**(a) Unused JavaScript: NOT DONE, dropped on purpose.** Lowest priority and the easiest thing to break; this stream chose to spend its
builds on (c), (d) and (e). It stays open on #7bd5u, wanted but unbuilt.

## Not changed

The Thai font, `AppHeader.tsx`, `worker/`, migrations, `package.json`. (b), the logo, landed on 2026-11-12 and was not touched.

## Dev data

Three contacts named `SPEED-TEST friend 1-3` with published Shelter Friend rows were inserted into the shared dev database to give `/friends`
a map and were deleted when measuring finished.
