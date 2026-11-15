# Waiting on you: the jobs only your hands (or someone at the shelter) can do

**A dated snapshot, rewritten 2026-11-15 (replaces the 2026-11-13 version; it is the same list, not a second one).** It is not a tracker and it goes stale. The backlog item is always the truth. Each row says how and when it was checked, and where something could not be read it says *not established* and what would settle it. Reasons and history are in the decision files named, not here.

**The one job that unblocks the most: `#pl7aq`, the public launch date.** It is a decision of yours, not work. Four other jobs wait on it (`#uao7r`, `#z7d6h`, and the visibility of `#kxksr` and `#8dfud`). Nothing else here unblocks more than one thing.

**Rule kept from the first version: no runnable command is written for a step you have not reached.** Steps below are screens and sentences. Ask in chat for the exact command when you reach one.

## 1. Your own hands, ready now (shortest first)

| Job | Ready? | Blocked by | About | First step | Verified |
|---|---|---|---|---|---|
| `#8t3rk` Stop a script flooding the public "report an animal" form | **Not yours: closed, answered not built** | nothing | none | None. The zone's one free rate rule is already spent on sign-in; see `docs/decisions/2026-11-15-worker-rate-limit-binding.md`. | Decision file, 2026-11-15. |
| `#mzu7v` Home Assistant monitoring: book the guided walkthrough (Uptime Kuma, Glances, dashboard) | **Ready** | nothing; you asked for it to be booked | a session | Name a day in chat and the planner books it. | Item tail read 2026-11-15: last confirmed unmoved 2026-11-10. Not re-asked. |
| `#gvnrr` Buy the Pi's battery so a power cut does not take the app down | **Ready, timed on price** | waiting for a Lazada sale (your choice) | one purchase | Buy when the sale comes. Which unit was chosen is **not recorded** in the item. | Item tail read 2026-11-15. Nothing left to decide. |

## 2. Your own hands, blocked

| Job | Blocked by | About | First step when unblocked | Verified |
|---|---|---|---|---|
| `#kxksr` PromptPay on production | You do not have the shelter's PromptPay id and QR image yet (Director has them) | 10 min | Management, Website, **Donate** tab: add PromptPay with its id and account name, save, then upload the QR on that card. The shop's Thai checkout uses it. | Item read 2026-11-15. Last read on the live screen 2026-11-13 (only DonorBox and PayPal). **Not re-read live since.** |
| `#aaqtl` Thai label proposals: the machine login, its card and its password secret | Nobody needs it urgently; it is a release-time job | with the release session | Ask the release session for the remaining steps. Step 1 (apply `0296`) and the Worker deploy are done (0.45.0). | Read live with you 2026-11-13: no machine login on production. **Not re-read since.** |
| `#w2knt` Production is behind on migrations (one re-owns 90 database objects) | The `0.47.0` deploy, which is yours and the release manager's | the deploy | At the deploy: run the check named in `docs/release-procedure.md` after the apply. | **Not established live.** The status script needs production credentials that only the main checkout holds, and it refused from this worktree. By the repo: the figure of four is **probably stale, there are now five** (`0380` was added after it) and `0.47.0` is cut with **no release record yet, so the deploy has not been recorded**. A production read settles it. |
| `#rqv5c` Move production's Drive to the shelter's own Google account | **In hand, your own timetable** (you said 2026-11-09, next week or two) | your time | Nothing to ask. Do not chase before the end of November. | Item read 2026-11-15. UAT's half is done. |
| `#civwx` Backups get their own Google identity | Comes **after** `#rqv5c` | guided, with you | Guided walkthrough once `#rqv5c` is done. Steps in `docs/pi-hosting.md` "Backups on this Pi". | Item read 2026-11-15. |
| `#pl7aq` **Decide the public launch** | Your decision; no date set | a decision | Name a date, or a list of what must be true first. | `wrangler.jsonc` read 2026-11-15: production `PUBLIC_SITE` is still `"locked"` (lines 110 and 144). Last seen live 2026-11-13. |
| `#z7d6h` At go-live: verify the domain in Search Console, submit the sitemap | `#pl7aq` | 30 min | At launch. Also check the four live page types (`/adopt/<id>`, `/our-work/<id>`, `/events/<id>`, `/campaigns/<id>`) on real rows. | Item read 2026-11-15. |
| `#z04wr` Self-hosted assistant model, runbook steps 5 to 9 | The model machine does not exist | an evening | `docs/self-hosted-model-runbook.md`, "Step 5" onward, once the machine exists. | Last confirmed 2026-11-13 (you, asked directly). **Not re-asked, by design.** |
| `#s0jgi` Review the manual against real use | You arranging a day with a shelter worker and a volunteer | a day | Pick the day and the two people. The Thai manual (`#1o5tk`) waits on this. | Item read 2026-11-15. |
| `#y1dqu` The weekly Thai read of new strings | A Thai speaker for the first read | weekly | Find the reader. Routine is in `docs/thai-read-routine.md`. Cadence settled, do not re-ask. | Item read 2026-11-15. |

## 3. Someone else's hands at the shelter (you can only ask)

| Job | Whose | Blocked by | First step | Verified |
|---|---|---|---|---|
| `#8dfud` A LINE QR code on the public site | the Director | she has not given a LINE id, and none exists; the QR is invisible until `#pl7aq` anyway | Nothing. **Do not chase her** (the item says so). | Item read 2026-11-15; last confirmed 2026-11-13. |
| `#uao7r` Add the website to the shelter's Google Business Profile | the Director | `#pl7aq` (go-live day) | On launch day ask her to sign in to the profile and add the site. Separate and doable now: paste the Maps link into Management, Website, **Map link** (the item holds the link). | Item read 2026-11-15. |
| `#u2bo6` Compare two machine-translation models on 20 real bios and 20 real vet notes | the two bilingual managers | arranging them | Ask both managers for the time. | Item read 2026-11-15. **Production not read** for the translation state; dev only. |

## 4. Found: no longer yours (the planner to file)

- **`#99zuk` (donation receipts and the Thai tax path) is answered, and no longer waits on the Director.** `docs/decisions/2026-11-13-answers-receipts-shop-payments.md` records: the foundation **is** a public charitable organisation, the app prepares the list for the accountant, donor IDs are kept 7 years. The item's own title still says *"with the Director in Chiang Mai"*. It is now **buildable** (schema first). Caveat for whoever builds it: those answers are your account of hers, not from her in writing, and what the accountant needs from shop income was **not captured**.
- **`#t1zyc` is closed** (2026-11-13, your word: the accountant's login is an operational task). If it is still undone it is one Settings, Security step, not a backlog item.

## 5. Always yours

- **Major versus minor on every release** (a major release mails the admin list; it cannot be undone).
- **The production Worker deploy** (yours since 2026-10-02).

## Notes

- **A. `#8t3rk` is no longer a job for you.** The free zone rule is already used (`Sign-in attempts`, 1/1), so its steps cannot be followed. The Workers binding's plan is not established, so nothing was built; the risk stays accepted. Shop checkout (`submitOrder`) has no volume bound either: for the planner to file.
- **Not on this list, by design:** `#7bd5u`, `#dqgy8`, `#lkxwu`, `#00e3u`, `#ykefa`, `#el9zw`, `#9b0vq`, `#1o5tk`, `#vkswg` (held on their own conditions, live streams, or yours to raise).
- **Not established:** why the Pi rebooted on 2026-11-11 and 2026-11-12 (one matches a deliberate power-pull drill).
