# Planner handover — edition `546`, 2026-11-01

**A delta, thirty-third edition in this shape. AMENDED the same day it was written: it first covered
batches 9 and 10, and batch 11 merged eighteen minutes after it did.** So it now carries **nine streams
in three batches**, all built, merged and measured, every PR green on its own head commit. **Two things
changed that outrank anything in the bands:** the dials are now the planner's, and `537`'s central
banding advice was wrong within hours of being written. The subject is why five of the first six streams
overran — **and the amendment below is why the obvious correction to that was ALSO wrong:**

> **A RULING YOU ASK A STREAM TO MAKE BECOMES AN INSTRUMENT. Band it as one.** The skill's *"must it
> build the instrument? Dear. Widen."* is written about deliverables. **It applies to the QUESTIONS a
> brief asks**, and that is the gap the overruns fell through.

**Nothing here outranks `CLAUDE.md`, the skill, `docs/backlog.md` or `.plan-day.md`.**
**Read first:** `CLAUDE.md` → the skill → `.plan-day.md` → this. **The next slug is `555`.**

> **Never carried forward: anything read from the repo** — counts, migration numbers, PR numbers,
> release state, candidates. **Re-read every time, never diffed.**

---

## THE ONE THING TO READ: ASK WHETHER THE ANSWER MUST BE ENFORCED OR MERELY WRITTEN DOWN

Five of six streams ran over, and the three worst each had a brief that asked for a **ruling**. Ruling
honestly meant building the thing that enforces the ruling.

| stream | what it was asked | what it had to build | miss |
|---|---|---|---|
| `write-paths-tail-b` | *rule* on five GoTrue modules | **a new `// write-requests: replay-safe` declaration in a check that BLOCKS CI**, plus a shared write moved out of an action module, three client components, a captured replay proof | **+54%** |
| `translations-propose-schema` | *answer* a design question | `scripts/prove-translations-propose.mjs`, because the existing proof runs as the database owner and **cannot exercise grants at all** | +3.4% |
| `write-paths-management` | wrap fourteen modules, no ruling | nothing; 69 writes rather than the ~40 implied | +17.8% |

**The question that separates them: does the verdict have to be ENFORCED, or merely recorded?** A
verdict the toolchain must respect is a toolchain change. A verdict in a decision file is judgement, and
judgement bands near an ordinary stream. **`write-paths-management` is the control case** — same sweep,
same size, no ruling, smallest miss of the three.

**It sits beside, and is sharper than, the reconciliation rule.** That rule asks *which two things must
agree*; this asks *who has to obey the answer*. Where both apply, this one moved the number more.

## THE AMENDMENT: THE PLANNER RAISED THE BANDS AND BATCH 11 CAME IN UNDER THEM

**Batch 10 ran 17–54% over, so batch 11's bands were raised. All three of batch 11 then landed UNDER:**
`write-paths-list` **215,119** against 275–350k (**22% under**), `translations-propose-app` **215,708**
against 250–310k (**14% under**), `assistant-raw-db-message` **155,569** against 165–210k (**6% under**).
All `sonnet`/`low`, none compacted or rescoped, all finished. Figures and floors in `.plan-day.md`.

**The correction was real and was applied to the wrong batch, and it is the SAME axis both times: how
much must the stream FIND OUT?**

- **Batch 10 was asked to RULE**, and a verdict the toolchain must enforce is an instrument. That is
  this edition's subject and it stands.
- **Batch 11 was asked to EXECUTE decisions batch 10 had already written down.** #1160's handover named
  the files and the exact lines; five decision files told the listing stream what every wrapped module
  had concluded; and the assistant fix turned out to live in **one** shared write path, so it was done
  once rather than twelve times.
- **The worst miss was the one that looked biggest.** 146 addresses to verify read as the largest stream
  of the programme and was banded 275–350k. It was **mechanical**, because the understanding had already
  been done and handed over.

**So: NEVER RAISE A BAND FOR THE SIZE OF A SURFACE.** A huge surface with the thinking already done
lands near the floor; a small surface with a verdict to enforce does not. This is the existing *"a brief
that hands over the cause, the decision and the shape of the fix lands near the floor"* rule, and these
three are its strongest evidence yet — **three for three, on the widest surface the programme has had.**

## THE FINDING OF THE ROUND: A COUNT IS ONLY AS GOOD AS THE QUESTION BEHIND IT

Twice in one round the planner produced a frightening number that meant nothing, and both times the
real answer was one.

- **#1162 found a write helper exported from a `"use server"` module and called by the assistant** — *"a
  public, unclaimed second way to write a prescription"* — fixed its own instance, and nobody had asked
  how many others there were. The planner asked *"which action exports are referenced outside their own
  folder?"* → **dozens, across 79 files.** Useless: a client component importing a server action is the
  normal case and the entire point of one. **The question that matters is SERVER-SIDE importers, and the
  answer is ONE** — and it is a *different* fault, a **claim inside a claim** rather than an unclaimed
  path. Filed.
- **The same shape, same day, on Lutan's own tooling:** a `lastModelUsage` record naming Opus was
  reported to him as the cause of new sessions opening on Opus. **It is a cost ledger, not a
  preference** — one record across 999 folder entries, none on any worktree. **A record that agrees
  with your hypothesis is not evidence.** The measurements are in #1167.

**Same family as *a count quoted without its database*, one step earlier: a count quoted without its
QUESTION.** The cheap habit is to say out loud what the number would mean if it came back large, before
running it.

## WHAT CHANGED IN THE LOOP: THE PLANNER NOW SETS THE DIALS, AND MODEL FINDINGS ARE RETIRED

**Lutan, after re-dialling batch 10 by hand: *"I had to change those three streams manually."*** Every
batch makes three new folders, every new session opens on Opus, and he re-dialled three times a batch —
a cost no plan had ever recorded, because dials are read back *after* the fact, where a hand-set one and
an inherited one look identical.

**Measured, so nobody re-derives it:** `model` in `~/.claude/settings.json` is **inert for the Code
tab** (set, read back by `get_settings`, new session still opened Opus), and there is **no per-folder
memory**. Nothing he or Claude can edit sets it.

**So the planner now starts the batch's sessions itself**, passing `model` and `effort`, with `cwd` on
the existing worktree and `use_worktree: false`. **Tried this round: refused once, then passed on all
three — and it has since worked on a second batch and been MERGED AS A RULE** into `CLAUDE.md`'s
workstream step 1 and the skill's steps 7 and 8 (#1167). Full procedure and the verification tables are
in `.plan-day.md`.

**Three consequences, and the third is the one for you:**

1. **It only works from a turn Lutan typed in the DESKTOP APP.** Over Remote Control it is refused
   outright — *"for now you can start a session only on a message typed in the desktop app"* — whatever
   folder or dials you pass. **A condition, not a fix.** Keep the fallback.
2. **Verify with `get_session` before starting the rest.** A session that starts is not a session on the
   right dial.
3. **NO MODEL FINDING CAN BE DRAWN ANY MORE, and `537`'s banding advice is void.** That edition read
   twenty-one consecutive streams on `opus`/`medium` and concluded *"stop recommending Sonnet/low and
   band at `medium`"*. **All six streams since ran `sonnet`/`low`** — the recommendation was taken the
   very next batch. And now the planner sets the dial, so `get_session` reports **its own choice**. A
   `stream-usage` figure remains a clean *scale* reading; it is no longer evidence about a model. **Stop
   writing model advice. Band at `low` and state the `medium` figure beside it.**

## WHAT `537` ASKED FOR, and what each warning did

- **Its own subject — an item's count of a textual fault is a lower bound — NOT TESTED**, as no stream
  was a textual-count item. Unrefuted and unconfirmed; **do not report it as fired.** Batch 12's
  wording stream is the first that will test it.
- **The reconciliation rule: fired, fourth and fifth rounds**, and **superseded where the answer must be
  enforced** (above).
- **"A stream can REPORT; only the planner can FILE": fired, and it changed character.** Batch 9 left
  two findings on no item; **batch 10's streams then filed their own leavings properly**, leaving the
  planner only one. **Keep the pass; expect it to find less as the streams get better at it.**
- **"Say which branch your count was measured on" and "read the usage fields rather than
  `unmeasured`": both NEW, both FIRED twice.** Two streams' branch counts do not combine — which is why
  a backlog item read 60 when the truth was 30 — and #1162's three-column table is the shape to copy.
  **Both are now standing practice and are promotion candidates for the skill**, so the next edition
  should cite them rather than re-explain them.
- **An open question in the numbered deliverables: fired, seven rounds, no miss.**
- **"No wrapping stream lists anything": HELD across five streams and now RETIRED** — the listing stream
  exists, so the rule has done its job.
- **The floor is `tokens − messages`: twenty-one readings.** Batch 9 read 103.3–108.4k, batch 10
  105.3 · 104.3 · 104.3k (two identical). **Drift still upward. Re-derive; never carry.**
- **The release-note truth rule: held on all six.**
- **Interruptions: zero across both batches.** The one round-trip was the batch confirmation itself.

## THE PROGRAMME: (D) IS FINISHED EXCEPT FOR THREE DELIBERATE EXCEPTIONS

The Pi-failover sweep is done. The exceptions are not debt to chase but decisions to respect, and each
is its own filed item: **`/admin/security` and `/admin/security/verify`** stay out because they return a
TOTP secret and a temporary password and a wrapped result is stored for seven days — **a secret must not
sit there**; **`/services/desexing`** writes as anon and the claim needs `auth.uid()`.

**AND THE SWITCH-ON HAS HAPPENED: #1165 put 146 of the app's 149 addresses on the path list**, where
before it held **one**. Every earlier stream added nothing to it on purpose, so none changed runtime
behaviour; that one is the first in the programme a person can feel, and **the app now leans on the
Worker fallback on almost every page.**

**WHICH MAKES THE NEXT THING THE MOST SERIOUS ITEM ON THE BOARD, and it is NOT a stream:** the
power-pull drill measured the fallback answering 7 of 11 saves over about 11 seconds and then stopping,
with 44 seconds of 503s carrying **no `x-lanna-served-by` header at all** — so those replies never came
from our Worker. **Settling it needs `wrangler tail` during a repeat drill, which needs Lutan's login
and Lutan at the Pi.** Band a stream for the *instrument* that captures what the next drill needs, never
for the diagnosis. **Do not let a brief touch the timing constants:** "about eleven seconds" looks like a
timeout and the measurement says it is not one.

## STATE, RE-READ EVERY TIME

Everything below is read from the repo and is stale the moment it is written. **Re-read it; never diff it.**

- `main`, the open item count, the highest migration, how far production is behind, and both batches'
  measured figures: `.plan-day.md`'s own blocks. **Batch 11 carries no migration**, and the next number
  is free for the desexing item, which is the natural first stream of batch 12.
- **A RELEASE IS OVERDUE AND IT IS THE LARGEST THING NOT BEING DONE.** Eleven batches have merged
  without a cut. **Major versus minor is his and mails every admin; the production Worker deploy is
  his.** Ask once batch 11 is in.
- **ONE DECISION HE HAS ALREADY MADE THAT A STREAM WILL BE TEMPTED TO RE-ASK:** a **machine login** may
  exist in production Auth holding the label-proposing card, with its password as a Worker secret. **It
  does not exist yet** and the three steps are his. It is on the item and in batch 11's brief. **Do not
  put it to him again.**
- **One open PR that is nobody's stream:** Dependabot's `actions/setup-node` bump. It touches a workflow
  file, not `package.json`, so `audit` shows skipped. **Decide it rather than letting it sit.**
- **One worktree is likely a leftover rather than held work** — its PR has merged. **Ask before tearing
  it down**, and clean it by **branch** name: `worktree.mjs list` prints it as a folder-name mismatch and
  a husk and it is neither.
- **The backlog merged cleanly on one of this round's two syncs and auto-merged on the other.** The
  every-day conflict `528` described did not appear. **Routine either way; not a signal.**
