# Two Supabase Pro-only features are dropped, not deferred — never put either to Lutan again

**Date:** 2026-10-29. **Decided by Lutan**, the second time for one of them.

## The ruling

Two Supabase Auth hardening settings sit behind the **Pro plan**. This project runs on a hard
**zero-ongoing-cost** rule — no paid plans, Supabase Pro explicitly declined on 2026-10-10 — so
neither was ever a question he could answer yes to. Both are **dropped, not deferred.**

| feature | what blocks it | his words |
|---|---|---|
| **Session inactivity timeout** (60-day) | `402 User sessions can only be configured on Pro Plans and up`, returned by **both** projects when attempted on 2026-10-07 | *"Supabase user sessions are only available in pro plan, we will not be doing this."* (2026-10-29) |
| **Leaked-password protection** | Pro-only; established 2026-10-07 in the same pass | Declined with Pro itself on 2026-10-10; recorded in handover `456` as *"must never return to it"* |

**Neither may appear on any "waiting on Lutan" list, security checklist, release gate, backlog item
or handover again.** They are not debt, they carry no baseline, and they are not to be re-priced
"in case the plan changes" — if the cost rule ever changes, that will be its own decision.

## Why this needed a decision file and not just a backlog note

**The ruling was already on the board and he was still asked again.** The 2026-10-07 finding was
recorded on the item that carried it; that item was then **ticked**. A separate, still-open item went
on listing the session timeout as to-do, and **nobody re-reads a ticked item**, so the question
survived its own answer. Handover `456` then copied it into its closing list of what was with Lutan —
two paragraphs after saying leaked-password protection must never return there.

So the general rule, which is the transferable part:

> **A ruling that closes a *class* of future asks — a paid tier declined, a feature dropped rather
> than deferred — goes in `docs/decisions/`, not only on a backlog item.**

A decision file is found by `ls docs/decisions/ | grep -i <subject>`, which the planning skill already
instructs every planner to run before briefing anything. A backlog item is read until it is ticked and
then never again. Writing *do not ask again* on an item that is about to be ticked puts the guard
somewhere it will not be read.

## What this does not touch

Nothing about the app's own security changes. Password sign-in, the second factor, the card system and
every server and database check are exactly as they were. What is dropped is **two settings in a
console that require a paid plan**, and the standing cost rule is what decides them.

The free hardening that remains open is tracked separately under *Security* in `docs/backlog.md`:
rate-limiting the sign-in page (one free rule, none used) and Cloudflare's free leaked-credentials
detection, both sequenced behind the domain move at his instruction of 2026-10-29.
