# Planner handover — edition `767`, 2026-11-20

**This is a DELTA against `766`.** It says what changed, corrects its predecessor, and reports what `766`
left owed. Figures, batch composition and ports live in `.plan-day.md`.

**It outranks nothing.** One chat reads it, one plan replaces it, and a wrong line is corrected by its
successor rather than by a reviewer.

**IT COVERS THE TEN STREAMS MERGED SINCE `766`:** #1759, #1760, #1761 (batch 1), #1762, #1763, #1764
(batch 2), #1766, #1767, #1768 (batch 3), plus **#1765**, which the Backlog manager role session shipped
outside the plan. **ALL TEN HAVE FIGURES** — the first edition where none is `unmeasured`. The release's
own two (#1757 cut, #1758 record) do not count.

**NINE PLANNED STREAMS, THREE BATCHES, ALL MERGED IN ONE DAY, SEVEN BAND READINGS AND EVERY ONE INSIDE.**
He agreed batch 1; batches 2 and 3 were set up without asking, as step 8 requires.

## FOR YOUR FIRST TURN

1. **Read `.plan-day.md` first.** Gitignored. It carries the figures, the floors and the batch tables.
2. **Read the system date and compare it with this document's.** **Never derive today's date from a
   document**, this one included.
3. **TWO PEER SESSIONS ARE LIVE AND THEY CORRECTED THE PLANNER FOUR TIMES ON 2026-11-20** — a Release
   Manager and a Backlog manager, both on the main checkout. **Every exchange ended with a better answer
   than either side started with, and three of five were settled by reading a file rather than by
   arguing.** Treat a peer correction as the mechanism working, not as a cost.
4. **SAY WHEN YOU PICK UP AN AREA, AND SAY WHEN YOU ARE OFF IT.** The one thing that cost real work was
   `#uatsb` being **built twice, ten minutes apart** — the planner and the Backlog manager each wrote the
   same fix because neither said it had started. **A coordination gap, not a reasoning one.** The Backlog
   manager holds the env files and Drive until `#drvtk` and the token close.
5. **The six merged worktrees from batches 1 and 2 were cleared on his instruction**; batch 3's three and
   `planner-handover` remain. `/clean-streams` settles them.

## THE ONE LESSON, WITH NINE INSTANCES — DO NOT SPEND NINE PARAGRAPHS ON IT

**A reading that describes part of a state is not a reading of the state, and the layer a check covers is
part of what the check means.** All on 2026-11-20; four were the planner's own.

- `766`'s headline named **two** pending production migrations from the PRs it had read. **It was five.**
  The Release Manager ran the status read. `766` wrote *"only a production read tells you what is
  missing"* and then narrowed to what the console needed.
- A `shelter_hosts` row the planner was told to add **was already there**, created six minutes earlier.
- A check briefed against the **configured** hosts rather than the **answering** ones would have passed
  while two addresses were broken. The Release Manager caught it; it then found **four** missing rows.
- *"All three environments now pass"* — true of the data, **wrong about sign-in**: both proofs were
  database-level and UAT's Worker read nothing.
- A peer's uncommitted edits were inferred from a hook that merely names ids **cited inside** a changed
  line.
- The shelter's own name on a public page was taken as proof a host row worked. **The no-shelter fallback
  IS that name.**
- A tool returning only the first shelter card was read as the whole console (the Release Manager's).
- The UAT deploy owner was taken from habit rather than from `docs/release-procedure.md`.
- A `wrangler.jsonc` slice between `"uat"` and `"production"` **ended before the block it meant to read**,
  because `"NODE_ENV": "production"` comes first — and reported a merged fix as absent.

**THE MECHANICAL DEFENCE, from the Backlog manager and worth copying:** assert that the parts you did
**not** mean to change came out **byte-identical**, and that values which must differ **are distinct**. A
bad read then fails an assertion instead of producing a confident wrong answer.

## WHAT PRODUCTION AND UAT OWE NOW

**PRODUCTION OWES NOTHING AND IS HEALTHY ON `0.47.6`** — all five pending migrations (`0422`-`0426`)
applied to production and UAT on 2026-11-20, all four hosts serving, **one touch from Lutan against a
target of two.** `0426` had to precede the Worker, which `#rlord` (#1759) now guards in both directions.

**UAT IS THE ONE THAT OWES, AND IT NEEDS A CLAUDE SESSION, NOT HIM:**

- **`#uatsb` is fixed on `main` (#1765) and needs a UAT Worker deploy to take effect.** **That deploy is
  CLAUDE's** — `docs/release-procedure.md` line 64; **only the Worker PRODUCTION deploy is his** (line
  62). The planner had this wrong in three files and the Release Manager caught it. **`npm run
  deploy:uat` carries no `--secrets` and is safe.**
- **DO NOT pass `--secrets` until the local Drive token is fixed.** `WORKER_REQUIRED_SECRETS` includes
  `GOOGLE_OAUTH_REFRESH_TOKEN`, pushed from this PC's `.env.deploy.uat`, which holds a **revoked** one
  (`#drvtk`). `deploy.mjs`'s existing refusal guards **provenance, not staleness**, so it would not catch
  it. **A plain Worker deploy touches neither Drive nor the Pi** — verified: `deploy.mjs` has no `scp`
  and no Pi step, and the Pi scripts run on the Pi against its own clone.
- **`SUPABASE_SERVICE_ROLE_KEY` for `uat` is unproven** — it cannot be read back. **A plain deploy that
  fixes sign-in answers it empirically;** if sign-in is still refused, `--secrets` is next, after the
  token.

## FIGURES — TEN STREAMS, SEVEN READINGS, THREE SET ASIDE, ALL SEVEN INSIDE

| slug | PR | band | actual | verdict |
|---|---|---|---|---|
| `release-order-both-ways` | #1759 | 143-170k | **149,266** | inside |
| `host-pin-guard` | #1760 | 143-170k | **161,715** | inside |
| `test-host-row` | #1761 | 175-215k | **181,784** | **NOT A READING — `rescoped=yes`** |
| `release-process-notes` | #1762 | 146-175k | **148,670** | inside |
| `platform-console-apex` | #1763 | 145-190k | **176,217** | inside |
| `onboarding-faults` | #1764 | 175-215k | **182,662** | inside |
| `uat-supabase-url` | #1765 | — | **414,500** | **NOT A READING — no band, `compacted=yes`, `rescoped=yes`, opus-5/medium** |
| `lanna-leftovers` | #1766 | 143-170k | **152,000** | inside |
| `runbook-shots` | #1767 | 150-190k | **189,097** | inside |
| `drive-scope-read` | #1768 | 145-190k | **155,298** | **NOT A READING — `rescoped=yes`** |

**SEVEN READINGS, SEVEN INSIDE. The table is right where it is being used.** All three set-aside figures
were set aside for the planner's own mid-flight corrections or dials, **not for anything a stream did.**

### THE REAL FINDING OF THE DAY: BAND FROM READING THE TREE, BEFORE WRITING THE BRIEF

**Three bands were cut after reading the code and before the stream ran. All three landed inside.**

- **`#pltfd` 185-250k → 145-190k**, after `#padui`'s DONE note showed the console move had already
  shipped with it. **Came in 176,217 — inside the new band and UNDER the old one.**
- **`#lnlft` 146-175k "may need a migration" → 143-170k, none**, after `site_content.contact_email`
  turned out to exist since `0018` and the adopt page already read it. **152,000.**
- **`runbook-shots` 160-200k placeholder → 150-190k**, after the three shots were found already
  registered in `scripts/manual-screenshots.mjs`. **189,097.**

**A band corrected from evidence BEFORE the stream runs is worth more than any revision afterwards.
Spend the reading; it is the planner's cheapest instrument.**

### A STEP-ZERO CHECK MUST BE ABLE TO COME BACK NEGATIVE — NEW RULE, AND IT COST AN INTERRUPTION

**`drive-scope-read` stopped at step zero reporting `#dscop` already shipped. It had not.** The brief
said `ls docs/decisions/ | grep -i "drive|scope|oauth"`, **which returns a dozen files whose names look
decisive and are not** (`keep-shared-drive-token-for-now`; `scope-functions-beside-a-cell`, a different
sense of the word). **A filename grep over 300 decision files cannot fail.**

**So: name the file's required CONTENT, or give `git log -S` on a distinctive symbol, or name the one
line to open.** The discriminating test here was `scripts/google-oauth-setup.mjs:79`.

**This is the MIRROR of the 2026-11-12 incident:** there, step zero caught a brief naming a file that did
not exist; **here it was FOOLED by a brief naming a search that could not fail.** Same instrument,
opposite failure. **Lutan had to ask, so it counts as a briefing defect** — and the stream behaved
correctly throughout, reporting plainly and stopping rather than rebuilding.

## STILL OWED — the skill-file edits, now a FIFTH edition

- **Narrow the floor row to ~87.2-91.5k**, note that **exact repeats recur across days and briefs**, and
  **OFFER NO CAUSE.**
- **Drop the band-table note about two bottoms nearer 135k.** Nothing has landed below **142,750** in
  twenty-seven readings.
- **Lower the edit-is-not-an-audit row back toward the audit row** — `766`'s verdict was negative and
  nothing since has challenged it.
- **The `+10k` for looking STILL has no verdict, and this time it is the planner's fault.**
  `drive-scope-read` was built as the test with the allowance deliberately omitted; **it came in 155,298,
  comfortably inside, but the planner corrected its brief mid-flight, so `rescoped=yes` keeps it out.**
  **Suggestive, not a verdict. The next looking-not-driving stream needs a brief nobody has to touch.**

### THE FLOOR, FROM EIGHTEEN READINGS — AND THREE HYPOTHESES REFUTED IN ONE DAY

`tokens − messages`, sorted: **87,236 · 87,236 · 87,236 · 87,236 · 87,460 · 87,854 · 87,919 · 87,959 ·
87,959 · 88,183 · 88,248 · 88,248 · 88,248 · 88,248 · 90,464 · 90,569 · 90,569 · 91,508**

**Eighteen readings, eleven distinct values, four of them repeating EXACTLY** (87,236 ×4, 88,248 ×4,
87,959 ×2, 90,569 ×2). **Range 87.2-91.5k.**

**THE PLANNER OFFERED THREE EXPLANATIONS AND ALL THREE ARE DEAD OR WEAKER:** brief length (**refuted** —
a 476-line brief and a 413-line brief gave the same figure to the digit); bimodal (**refuted** — eleven
values, not two); quantised (**weakened** — the repeats are real but the spread is wider than claimed,
and 91,508 is a new high).

**THE INSTRUCTION IS ABOUT THE PLANNER, NOT THE FLOOR: RECORD THE RANGE AND THE REPEATS, AND STOP.** Two
of the three were offered on three readings and refuted by the next morning's data. **The repeats to the
digit are worth carrying forward; every account of them so far has been wrong.**

## HIS DECISIONS OF THE DAY — SETTLED, DO NOT RE-OPEN

- **`#shsup` — what a stranger's sign-up form does: AN ENQUIRY.** *"Record an enquiry"* — it records who
  asked and emails him; **nothing is created** until he creates the shelter. Self-service is ruled out by
  his answer. **Recorded on the item with the title rewritten.** Not built: it needs `#pltfd`'s apex
  (shipped) and probably a schema half, so **it is the next plan's first candidate, schema then app.**
- **`#msgtp` — the console's single shared message slot: *"Wait for the redesign"*.** **Do NOT let a
  stream pick it up as a quick win**, however cheap it looks.
- **`#pacon` — the console redesign is HIS OWN DIRECTION now, not a guided session waiting to happen:**
  *"The landing page needs to be some cards that give me access to the settings for each shelter and some
  action buttons, there is way too much information on the landing page"*. **Brief it from his words, not
  from the code**, and note that some of the confusion may belong to `#nxtqs` and `#stpbk`.
- **The production sign-in proof on `www.lannacareforanimals.org`: *"Leave it for later"*.** Recorded on
  `#hostx`. **Do not re-ask.** Raise it only if someone reports a sign-in failure on a `www.` address.

## FILED, TICKED AND CORRECTED

**`#hstrw` — FILED AND CLOSED THE SAME HOUR, and it is `#hostx`'s check earning its place on its first
run.** `scripts/check-deployed-hosts.mjs` (#1761) failed on **all three** databases: production missing
`www.lannacareforanimals.org` (the shelter's own address, serving the app and refusing every sign-in),
UAT missing both of its own, dev missing `www.test.lannacare.org`. **Four rows, added on his instruction,
proved twice.** Each environment's Lanna id **differs** and was read, not assumed.

**A HOST ROW CANNOT BE CONFIRMED BY LOOKING AT THE SITE** — recorded on `#hostx`. `shelterNames()` falls
back to `DEFAULT_SHELTER_NAMES`, whose `displayName` **is** *"Lanna Care for Animals"*, so on Lanna's own
addresses a missing row renders the page a working one does. **Only the check, a `resolve_shelter_site()`
read, or a real sign-in is honest.**

**Open and not planned:** `#uatsb`'s registry half (`SUPABASE_URL` is absent from
`scripts/lib/runtime-config.mjs`, so nothing validates it per environment — left out of #1765
deliberately because it ripples into `deploy.mjs`'s lists), `#drvtk` (Backlog manager's), `#tstsh` (a
`test123` shelter created on production through the console, inert, and **the console has no
remove-shelter control at all**), `#nxtqs`, `#stpbk`, `#aucbk`, `#pacon`, `#egq18` (needs a deploy, so
not a worktree job — **the one real gap against his ranked list**) and `#34a30` (blocked on it).
**41 open items on `main`.**

**`#plhbd`'s SAVING PROOF PASSED:** he signed in on `cooperjaidee.org/platform` at `aal2` and *"can click
on items and add things"*, and a shelter was created on production through the console. **So the designed
path for adding a shelter host — `product_admin_map_host()`, gated on product-admin plus `aal2` — now
works on production**, which matters because it is the only fully correct way to add one.

## PROCESS NOTES

- **The hard sequence was kept at all three setups:** sync, three `new`, three briefs, `streams`, then the
  list. **Nothing was cleared and no PR body was read before the list went out.**
- **The briefs were ASSEMBLED BY SCRIPT, not retyped**, from `brief-blocks.md`'s nine fenced blocks, with
  guards that throw if a block is missing, if a middle lacks `STEP ZERO`, or if `.port` disagrees with the
  band header's port. **Keep this.**
- **A `--force` refusal is not advice.** `worktree.mjs done` refused the duplicate `#uatsb` branch; its
  decision file held two points #1765 did not, **so they were filed on `#uatsb` BEFORE `--force`
  destroyed the commits.**
- **Backlog guards caught the planner twice more:** `check-backlog-titles` refused a title carrying the
  decision rather than what was open (358 characters against 320), and the pre-commit hook refused a
  `git commit -am` that would have swept a peer's edits in. **`BACKLOG_COMMIT_ALLOW_UNNAMED=1` was not
  used.** Two of the planner's own guards also fired on over-broad assertions — **write the narrow
  assertion.**
- **Transient `git fetch` failures hit `worktree.mjs new` twice and a `main` post-merge push once.** Both
  cleared on a plain retry. **Not faults to file; worth knowing before diagnosing one.**

## INTERRUPTIONS

**ONE, AND IT WAS A BRIEFING DEFECT:** Lutan had to ask why `drive-scope-read` had stopped. **Two
`AskUserQuestion` calls across nine streams**, one carrying batch 1 plus two decisions, one carrying the
missing rows. **The duplicated `#uatsb` branch cost real work and was a coordination gap**, recorded
against neither stream.
