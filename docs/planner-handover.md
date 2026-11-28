# Planner handover — edition `775`, 2026-11-28

**This is a DELTA against `774`.** It says what changed, corrects its predecessor, and reports what `774`
left owed. Figures, batch composition and ports live in `.plan-day.md`.

**It outranks nothing.** One chat reads it, one plan replaces it, and a wrong line is corrected by its
successor rather than by a reviewer.

**IT COVERS TWENTY-FIVE STREAMS, ACROSS TWO DAYS AND TWO PLANS. TWENTY-TWO HAVE FIGURES; THREE ARE READ
NEXT MORNING.** With figures: `dev-migration-0422` (#1896), `website-lock-order` (#1897),
`wrangler-error-cause` (#1898), `host-attach-trial` (#1899), `deployed-hosts-google-client` (#1901),
`host-attach-deploy` (#1902), `shelter-hosts-attach-flag` (#1903), `deploy-reasserts-hosts` (#1904),
`console-host-attach-schema` (#1907), `release-prs-default-sha` (#1908), `host-attach-console` (#1909),
`reset-error-wording` (#1910), `shelter-hosts-nullability` (#1911), `cooperjaidee-purge-zone` (#1912),
`th-platform-chrome` (#1913), `consumer-header-contract` (#1914), `console-website-truth` (#1915),
`deploy-dns-retry` (#1916), `shelter-sender-name` (#1917), `host-attach-readback` (#1918),
`intake-duplicate-name` (#1919), `product-test-uat` (#1920). **Read next morning, because measurement is
once a day and these merged after it:** `dns-retry-window` (#1923), `release-runbook-fixes` (#1924),
`platform-front-door-signin` (#1925). **A missing figure here is not a lost one** — each sits on its own
merged PR and `gh pr view <n> --json comments` still reads it.

**Why sixteen overdue: he was offered this edition twice and said "Not now" and "Still not now", both
times mid-batch.** On the third offer — made when the buildable backlog had just emptied, which is the
natural moment rather than a round number — he said yes. **His judgement cost nothing again**, for the
same reason as last time: every figure survives on its PR. The counter resets to 0 when this PR merges.

## FOR YOUR FIRST TURN

1. **Read `.plan-day.md` first.** Gitignored, the thirty-third plan. **Its three streams all merged**, and
   one more, `near-names-gaps` (port 3001), was set up afterwards and is live.
2. **`gh pr list --state open` BEFORE you believe anything here.** On 2026-11-27 thirteen streams merged
   in one day.
3. **THE BUILDABLE BACKLOG IS ESSENTIALLY EMPTY, AND THAT IS THE HEADLINE FOR WHOEVER PLANS NEXT.** Of 31
   open items, three read `buildable` and only one was real work: `#dupnx`, which `near-names-gaps` is
   building. **Everything else is his, the Director's, waiting on an event, or parked by his own
   decision.** **Do not pad a plan to nine out of this.** The honest plan on 2026-11-28 was three streams
   and then one; both were presented as such and he agreed to both.
4. **ONE WORKTREE IS STILL HELD and `done` refused it twice:** `console-host-attach-schema`. Windows will
   not release it and the script could find no session in it; **the holder is a session titled "new
   project: thai typing coach" whose `cwd` is that folder** — unrelated to the stream, whose PR (#1907)
   merged two days ago. **`--force` is not the fix and the script says so. Ask; do not force.**
5. **`0.50.0` SHIPPED**, and `check-release-handover.mjs` now reads current — **`774`'s "release handover
   is STALE" is settled.**

## THE BAND FINDING OF THESE TWO DAYS: A CLEAN SET, AND A HYPOTHESIS THAT STILL WILL NOT FIRE

**2026-11-27's thirteen streams gave the first complete set with NO EXCLUSIONS AT ALL.** Every one
reported `compacted=no rescoped=no finished=yes`, and every `model=`/`effort=` matched its brief's `band=`
dials, so there was no "band does not apply" case and nothing to mark. **Twelve of thirteen landed inside
band.** The one miss is `host-attach-readback` (#1918) at **2.7k over** a 150–185k band — 1.5%, on a
stream that drove a live console readback, which is the same *live interaction does not discount* lesson
#1899 and #1904 taught from opposite directions. **One 1.5% overrun is not a reason to widen a row.**

**`774`'S HYPOTHESIS HAS NOW FAILED TO FIRE TWICE, AND THIS IS THE SECOND COMPLETE SET AGAINST IT.** `774`
recorded, from 2026-11-25's nine: *a band whose paragraph NAMES an open design question carries +10–15k.*
**Several of 2026-11-27's thirteen briefs named open design questions explicitly — `shelter-sender-name`
named two unknowns in its own banding note — none carried the premium, and all of them landed inside.**
Had the premium been applied, most of that set would read as under-run instead.

**So: the hypothesis is not supported by twenty-two readings across two sets. Do not apply it. Do not
build it into the table.** It was written honestly from eight overs and it has not survived contact; **one
more complete set and it should be retired by name rather than left to be rediscovered.** The reason to
say that out loud is that the underlying instinct — *naming an unknown is not pricing it* — is still
right, and is already in the skill as a question to ask. **What failed is the numeric premium, not the
instinct.**

### The floor — thirteen readings, 88.4k to 91.5k

**The tightest spread yet measured**, and inside both prior readings (88.3–91.6k on 11-27, 87.2–91.6k on
11-21, 87.8–92.6k in `774`). **Repeats again in one set** — `88,450` (#1914, #1915, #1920) and `88,385`
(#1909, #1919). **The repeat phenomenon is now recorded across four editions. Record it; offer no cause.**
Re-derive from the next complete set. **Do not shift the scale rows to match the floor** — the `774`,
`773` and `772` warning stands, and the arithmetic reason is in the skill.

## WHAT `774` LEFT OWED — AND TWO OF ITS SIX LINES WERE WRONG BY THE TIME THEY WERE READ

1. **Clearing merged worktrees — DONE, beyond what `774` asked.** Its three are gone and so are seven
   more. **Every one was checked for its `stream-usage:` comment before the folder was removed**, which is
   the step that makes clearing safe. One remains, held (above).
2. **`#rqv5c`'s production path for the Drive move script — `774` CALLED IT BUILDABLE AND IT IS NOT HIS
   ITEM AT ALL.** The script refusal is real and unchanged: `scripts/drive-move-to-shelter-account.mjs:92`
   still throws on `--env production` with no override. **But Lutan corrected the ownership on 2026-11-27:
   the Drive press is the DIRECTOR'S, not his**, and the item is retagged `waiting:director`. **It was the
   second item in one day tagged to him that belonged to her** (`#drvcl` was the first). **The rule that
   came out of it, and it is in the item: before offering him an item whose action happens inside a Google
   account or on a shelter's own Drive, ask whose account it is.** He can read a screen the Director must
   act on, and those are not the same ownership.
3. **`#plsso`'s UAT rehearsal — still open, and it has gained a second blocker nobody had checked.**
   Neither test nor UAT has a product administrator who is a real person: `add-product-admin.mjs --env
   test --list` returns three throwaway `dev-signin-*@example.invalid` logins, and `--env uat --list` says
   the list is **empty**, so nobody can open Settings → Product admin on UAT at all. **Adding anyone is a
   privilege grant and is his.** The rehearsal is `#plsso`'s last clause and **first on his Customer
   priorities list**, so it is worth raising once he is not mid-anything.
4. **`#rlprg`'s drivable proofs — the item now reads TICKED.** Its stream, `reels-multi-upload`, **never
   started**: the worktree carried a brief, had **no PR ever**, and was cleared on his word. **Read the
   item rather than the stream before concluding anything was lost.**
5. **The release handover — CURRENT.** Names `0.50.0`.
6. **His unanswered question of 2026-11-25** (whether he wants to use a shelter as ordinary staff would)
   — **still unanswered, and `shelter-membership-console` (#1893) has merged since.** Read what it built
   before putting it to him again. **Not raised on 2026-11-28, deliberately: he was mid-plan twice.**

## THE TWO BIG THINGS THAT HAPPENED OUTSIDE ANY PLAN

- **`#gidty` IS CLOSED: production's Google sign-in now runs on the platform's own OAuth client**
  (`559913308840-topvkto4ac…`, CooperJaidee's project), and he proved it by signing in. **All three
  environments are on it.** **The method is worth copying and is written into the item:** the redirect URI
  was verified **before** the write with a control probe — a deliberately bogus URI returned
  `redirect_uri_mismatch`, the real ones returned none — because `external_google_secret` reads back as a
  **64-character digest, never the secret**, so a bad write to production's Google provider is a
  shelter-wide lockout with no undo.
- **HE NOW HAS A PASSWORD ON HIS PRODUCTION ACCOUNT — the first non-Google way into the app.** That is
  what made the Google switch survivable. **It has a live consequence for code:**
  `src/app/login/actions.ts` is now a real sign-in path, not a theoretical one, so a change to the
  sign-in refusal that only touches `auth/callback/route.ts` is half a change. `#fdsgn` was briefed on
  exactly that and found three sites, not one.

## THE SHAPE OF 2026-11-28, AND ITS ONE LINE WORTH NOT LOSING

**`#fdsgn` was found in a guided session, briefed, built and merged the same day** — the platform front
door could not be signed in on, because the checklist seeds a front-door row with a null `shelter_id` and
every sign-in path reads "no shelter" as "this site is not set up".

**AND THE DANGEROUS HALF IS THE PART THAT STILL STANDS: production's product sign-in works ONLY because
`0390` stamped its front-door rows with a shelter, which `0448`'s own header calls damage it deliberately
did not undo.** **A migration that sets `cooperjaidee.org` and `www.cooperjaidee.org` back to null breaks
sign-in on the live product site, and it would look exactly like a correction.** The brief made that a
prohibition rather than a footnote, and whoever plans near `shelter_hosts` should do the same.

## THREE LESSONS EARNED

- **A TICKED ITEM IS A PLACE FINDINGS GO TO DIE.** `#1919` reported three gaps it had honestly not built;
  they were written onto `#dupnm`, which is ticked. **Nobody re-reads a ticked item**, so they were filed
  as `#dupnx` the next morning and are now being built. **Read every merged PR body for findings outside
  its deliverable list — a stream can report, only the planner can file** — and when a stream writes its
  findings onto the item it just closed, move them.
- **A CLOSED HALF STILL TAGGED `buildable` GETS RE-PLANNED AS A STREAM.** `#dnsgp`'s window shipped and
  the item still read buildable with a title demanding the widening. **Retag and retitle in the same turn
  you read the PR**, or the next plan spends a stream proving the work is done.
- **MEASURE THE CARD CATALOGUE BEFORE PRICING A PERMISSIONS GAP.** `#dupnx`'s third part needed a
  security-definer function for a login holding `resident.register` without `resident.record`. **One grep
  of `cards.ts` showed the only card granting register `includes: ["view_residents"]`, so that login
  cannot be assembled** — a schema half removed from the plan by one command. **Card-shaped, so it stays
  true after the assignments are rebuilt.**

## STILL OWED

1. **Clearing `console-host-attach-schema`**, on his word, once its holding session is closed.
2. **`#plsso`'s rehearsal**, and the product-administrator lists on test and UAT that block it.
3. **`#cjpzn`'s two values** — production's purge token widened to the `cooperjaidee.org` zone, and
   `CLOUDFLARE_ZONE_ID_COOPERJAIDEE` in `.env.deploy.production`. **Until then every release ends with a
   manual purge he pays by hand.**
4. **`#dnsgp`'s cause** — one look and one toggle (NordVPN off, or a DNS server on the NordLynx
   interface). Two streams read the interface and correctly refused to change the machine other streams
   were working on.
5. **UAT and production `shelter_hosts.shelter_id` nullability**, still unread: the ad-hoc Management API
   read of production is refused by the permission classifier, and **a bare allow rule would fix it.**
6. **`#shfil`'s proof is not established either way** — the Pi answered over the mesh but
   `/opt/lanna-care*/` listed nothing from this session, so it is named as his with its proof quoted and
   **never reported as checked.**
7. **`#pimir`** — `drive-mirror.service` read live as `failed` on both 11-27 and 11-28, sixteen failures,
   the first on 11-13. He is home from **29 November** with the decrypt key.
