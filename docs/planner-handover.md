# Planner handover — edition `748`, 2026-11-14

**This is a DELTA against `747`.** It says what changed, corrects its predecessor, and reports what each of
`747`'s owed items did. Figures, batch composition and ports live in `.plan-day.md`.

**It outranks nothing.** One chat reads it, one plan replaces it, and a wrong line is corrected by its
successor rather than by a reviewer.

**WHY THIS EDITION EXISTS AT ALL, since `747` merged two hours ago.** Lutan asked directly: *"Are we
finished with this round of batches and ready for a new lot ? if so can you write the handover and merge
it"*. **The round is finished — all six streams merged** — and `747` was written at batch 2's *setup*, so it
carries none of batch 2's results. **This edition is the first to report a plan's COMPLETE set from the same
chat that planned it**, and that is only possible because both its batches merged within the hour.

---

## THE LEAD: FOUR STREAMS IN A ROW CAME IN UNDER BAND, AND IT IS ONE BRIEFING FAULT, NOT FOUR LUCKY STREAMS

| PR | slug | tokens | band | verdict |
|---|---|---|---|---|
| #1580 | `tenancy-reown` | 175,428 | 220–280k | **UNDER by 44,572** |
| #1585 | `donations-read-level` | 149,643 | 230–285k | **UNDER by 80,357** |
| #1586 | `tenancy-lint-holes` | 153,819 | 160–205k | **UNDER by 6,181** |
| #1588 | `merch-currency` | 172,353 | 200–250k | **UNDER by 27,647** |

**Every one is a sound figure** — dials matching, no compaction, no rescope — so none can be waved away.
**And the cause is the same in each: I priced the BIGGEST branch of an open question the brief then handed to
the stream, and the stream chose the smaller branch, correctly.**

`donations-read-level` is the clearest case. Its brief offered three outcomes — level the activity, add a
separate one, or leave it — and said *"left as it is, and here is why" is a legitimate outcome*. **It left it
as it is**, after measuring that **about 30 files and ten migrations** ask `donation.receipt` and that
`src/app/api/documents/[fileId]/route.ts`, through `can_see_drive_file()`, is where a wrong level leaks a
receipt. **The band had priced the rewrite.** That is a brief doing its job and a band measuring the wrong
thing.

**THE RULE, AND IT IS NEW: when a brief's deliverable is "decide between a large change and no change", the
band must say WHICH OUTCOME IT PRICES**, and the planner should band the outcome step zero makes most
likely. *"Band by what the stream must FIND OUT"* is still right — **but finding out that nothing should
change is cheap, and four readings now say so.**

---

## WHAT IN `747` IS SUPERSEDED — AND ITS HEADLINE CLAIM NEEDS NARROWING

- **`747` said "the floor is a constant of the harness, not of the brief". The second half holds; the first
  is too strong, and today's six readings show it.** Two streams starting at the same minute returned
  **89,505** to the token — that part is real and remains the best evidence that **the brief does not move
  the floor.** But across the day the floor ranged **86,037 to 89,659**:

  | floor | stream |
  |---|---|
  | 86,037 | `tenancy-lint-holes` |
  | 86,731 | `card-boxes-triage` |
  | 87,050 | `donations-read-level` |
  | 89,505 | `card-checks-report` **and** `tenancy-reown` (same minute) |
  | 89,659 | `merch-currency` |

  **So the floor is a property of WHEN a session starts, not of what its brief says.** Streams started
  together share it; streams started hours apart do not. **Re-derive it per plan, never carry it forward,
  and do not quote `747`'s "constant" without this correction.**
- **`747`'s owed item 1 is DONE** and this edition carries all six of batch 1 and batch 2.
- **`747`'s owed item 2 (a) is ANSWERED and the guard HELD.** The pre-written migration tiebreak — *the
  lower PR number keeps the number* — went into both carriers' briefs. **Neither needed a planner.**
  `merch-currency` took `0379` cleanly after `0378` merged, and `check-migration-numbers` stayed green. **The
  fix for batch 1's clash worked on its first outing.**
- **`747`'s owed item 2 (b) is ANSWERED: `donation.receipt` STAYS YES/NO** (#1585,
  `docs/decisions/2026-11-14-donations-read-level.md`), with no migration, no card change and no caller
  touched. **A separate totals activity can be added later without disturbing a single working caller**, and
  no shelter need for "totals without receipts" is on record. **Do not re-brief this.**
- **`747`'s owed item 2 (c) is ANSWERED and the answer is no.** `tenancy-lint-holes` established that the
  policy rule needs `pg_policy` through the Management API, so **it cannot run in CI either** and lives in
  the same script. **It declined to add a secret, which was right** — that question is now `#x5tbv`, below.
- **`747`'s owed item 4 (the dictionary overlap) HELD A SECOND TIME.** Batch 2 again had streams touching
  `en.ts`/`th.ts` at once; each named the keys it owned and synced before its PR, and **nothing conflicted.**
  **Two batches for, none against. Treat it as workable rather than settled**, and keep naming the keys.
- **`747`'s owed item 6 is spent, and it is the big one:** **the product name is decided.** See below.

---

## THE PRODUCT NAME IS DECIDED AND THE DOMAIN IS REGISTERED

**Lutan, 2026-11-14: *"ok we will use cooperjaidee as the system name"*, then *"I will buy the domain
tonight"*, then *"ok cooperjaidee.org is now mine and available for use on cloudflare"* and *"I bought 2
years"*.** RDAP confirms **registered 2026-11-14, expires 2028-11-14**. `.com` and `.net` were free and he
took neither; asked which should be canonical, the recommendation was `.org` and he agreed by buying it.

**Full reasoning in `docs/decisions/2026-11-14-product-name.md`.** What it unblocks: `#ykefa`'s **build**
half — `shelter_id`, the restrictive per-shelter policies, `current_shelter_id()`/`is_trusted_caller()`,
per-shelter Drive, roles a shelter adds at setup, and **the permanent canary diff**, which could not be built
at all while there was no shelter concept to plant a second shelter into.

**THREE THINGS IT DOES NOT UNBLOCK, and each is a wrong turn a one-line summary would invite:** the domain
**points at nothing** — no DNS record, no Worker route, no Pages project — so nothing deploys to it and no
stream may assume it resolves; **nothing in this repository is renamed**, because a rename of code,
infrastructure or branding has not been asked for; and **`#ykefa` is still ≈50 hours**, with the re-own
having measured its object counts **40% larger** than the spike priced. **It is a programme to sequence
across days, not a stream to brief in one go.**

**And the domain has its own item now, on his instruction: `#j4m8w`**, filed beside `#ykefa`. **It leads with
why the domain is tenancy work rather than go-live work** — the spike resolves an anonymous visitor's shelter
from the **host**, so the hostname shape decides the mapping's shape. Its first question is what a hostname
means (a subdomain per shelter, shelters keeping their own domains, or `cooperjaidee.org` as the platform's
front door only), and it flags a certificate limit to **verify rather than trust**: Cloudflare's free
Universal SSL is understood to cover the apex plus one wildcard level, so `lanna.cooperjaidee.org` would be
covered and a deeper name would need a paid certificate, which breaks the zero-ongoing-cost rule.

---

## WHAT BATCH 2 SHIPPED, IN ONE LINE EACH

- **#1585 `donations-read-level`** — a **decision, not a change**: `donation.receipt` stays yes/no. `#v3qlt`
  ticked with its reason.
- **#1586 `tenancy-lint-holes`** — both holes of `#h8rvk` closed. A third rule in
  `check-tenancy-catalogue.mjs` asserting **every RLS table has its `definer_all` policy** (**120 of 120
  today, 0 false positives, ~3 seconds**), proved by planting an RLS table without the policy in a
  rolled-back harness with a clean control; two new unit tests; and the strict lint given a named place in
  **`docs/release-procedure.md` §5** with what to do on exit 1 and exit 2.
- **#1588 `merch-currency`** — staff can add and remove a shop currency, `0379`, **no new card** (it gates on
  `merch.manage` at edit, as the brief said it should). Add and **hard delete**, no deactivate column,
  because orders store the currency as text with their own rate and have no foreign key. Driven in the
  browser with a `run_merch_shop`-only login: CAD added, `XQZ` refused, CAD reached the public checkout,
  Remove took it off.

---

## FOR YOUR FIRST TURN

Read `.plan-day.md` first. **It stands at 6 of 6 and this edition resets the counter, so you are planning
FROM SCRATCH.**

**Read the system date and compare it with the date at the top of this file.** **Two plans ran on
2026-11-14**; a third on the same date is a normal thing to be. **Never derive today's date from a
document.**

**Tell him at the start that the sync plus the `worktree.mjs new` runs plus the briefs is about half an
hour.** Six editions have recorded that as the fix for an interruption.

**WHAT IS OWED:**

1. **PRODUCTION IS FOUR MIGRATIONS BEHIND, AND THIS IS THE MOST CONSEQUENTIAL LINE IN THIS FILE.** Measured
   today with `--status --env production`: `0375`, `0377`, `0378`, `0379` are all pending. **`0375` re-owns 90
   objects to `rls_definer`**, and re-owning wrongly does not leak — **it makes views read 0 rows, so the
   failure mode is a blank public website.** Filed as **`#w2knt`** with the strict-lint step that goes with
   it. **The deploy and the apply are Lutan's and the release manager's (his instruction, 2026-10-02); never
   brief a feature stream to do it.**
2. **MEASURE NOTHING AT YOUR FIRST BATCH — it is already done.** All six of this plan are in this edition
   and in `.plan-day.md`. **Your measurement slot is the next day's, on the streams you set up.**
3. **`#x5tbv` IS A DECISION OF HIS AND HAS NOW BEEN DEFERRED THREE TIMES** (#1573, #1580, #1586): should CI
   hold `SUPABASE_ACCESS_TOKEN` so the catalogue lint runs per PR instead of once per release? **The repo is
   public on purpose**, which is the live half of the trade. **Put it to him once, with the middle option
   (a scheduled run against dev), and do not let it drift to a fourth deferral.**
4. **`#r9pzq` IS THE TENTH PROBE FAULT AND IT SITS ON THE RISKIEST ACTIVITY.** The `donation.receipt` **read**
   probe has no fixture row, so `check-who-does-what` cannot test that box — indistinguishable from a pass.
   **Fold it into the next card-check pass rather than giving it a stream.**
5. **THE BAND RULE FROM THE LEAD, APPLIED:** when you write an open question into a brief as *"decide X or
   leave it"*, **say in the banding note which outcome the band prices.** Four unders in a row came from not
   doing this.
6. **`#j4m8w` BEFORE ANY TENANCY HOSTNAME WORK**, and its first question (what a hostname means) is a design
   decision to record in `docs/decisions/` **before a DNS record exists, not after.**

**Do NOT re-ask him about:** the product name or which TLD (both settled today, in writing); the anonymous
photo upload (*"Yes, build it properly"*, 2026-11-14); whether staff may add a currency (#1588 shipped it);
`donation.receipt`'s shape (#1585 settled it as yes/no); the adopter-portal exception; `test-plan` being
advisory; merging a green PR; the Thai read's cadence or folding its three items; or anything on `747`'s,
`746`'s and `745`'s do-not-re-ask lists.
