# Waiting on you: what the backlog still needs from Lutan

**Snapshot, rewritten 2026-11-13 after Lutan corrected the first version and after a live check. It is not a tracker and it will go stale.** The backlog item is always the truth. Where a status could not be read live, it says *not established* and what would settle it.

Where a step is a command or a deploy, **no command is written here on purpose.** Ask for it in chat when you reach the step.

## What changed since the first version (2026-11-13)

Removed because they were wrong or are now answered:
- `#eh2dt` (Thai page texts): done, on your word.
- `#dxjz2` (production Worker deploy): shipped in 0.45.0.
- `#t1zyc` part A (accountant card): already given; only the accountant's login is left.
- `#d6wxo` (foster carer and adopter gate): answered. They sign in on the website page and see only the residents they adopted.
- `#y1dqu` (Thai read cadence): answered, weekly.
- The Director questions (`#99zuk`, `#hj1c5`, `#00e3u`, the shop's scope, `#5j6kj`): answered in chat; written up in `docs/decisions/2026-11-13-answers-receipts-shop-payments.md` for the planner. Products, prices, margin, supplier, who answers order questions and logo files are still open, but they are entered through the screens later and do not block the build.

## 1. Things only you can do

- **`#kxksr`: set up PromptPay** under Management, then Website, then the **Donate** tab. **Confirmed open 2026-11-13 on the live screen:** only DonorBox and PayPal exist. Add PromptPay with its id and account name and save; the QR upload only appears on the card once it exists. You need the shelter's PromptPay id and QR image, which you do not have yet. The shop's Thai checkout will also use it.
- **`#8dfud`: the shelter's LINE id**, if it has one (Management, then Website, then the **Contact** tab). **Confirmed 2026-11-13: none exists yet.** A LINE QR on the website waits for it.
- **`#t1zyc`: the accountant's login**, once you have their details: Settings, then Security, put it in the Accountant group.
- **`#aaqtl`: the machine login for Thai label proposals**, its card and its password secret. **Confirmed 2026-11-13 on the live Security screen: the login does not exist** (only two people's logins). Step 1 and the Worker deploy are done by 0.45.0. Ask the release session for the remaining steps when you are ready.
- **`#gvnrr`: buy the Pi battery** when the sale comes.
- **`#mzu7v`: book the Home Assistant walkthrough.**
- **`#rqv5c` and `#civwx`: the Drive move to the shelter's own Google account, then the backups' own identity.** You are working towards it; `#civwx` is guided, with you, after it. Do not chase before the end of November.
- **`#z04wr`: the self-hosted model runbook, steps 5 to 9**, once the model machine exists (**confirmed 2026-11-13: it does not exist yet**).

## 2. A decision of yours, with no date

- **`#pl7aq`: the public launch.** On 2026-11-13 `lannacareforanimals.org` still showed "under construction" to the public: `PUBLIC_SITE` is `locked` on production, and removing it is the launch, set aside on 2026-11-05 as a separate decision. Nothing to answer today. It is listed so it stops being implied. These wait on it: `#uao7r` (the Director adds the website to the shelter's Google Business Profile) and `#z7d6h` (Search Console: verify the domain, submit the sitemap, re-request indexing; also check the four dynamic page types on real rows). The earlier backlog read those as due on 6 November, which was the app cutover, not the launch.

## 3. People and conversations

- **`#s0jgi`: the phone day for the manual.** Two roles are being looked at (volunteer and bills management), one role at a time. The Thai manual (`#1o5tk`) waits on it.
- **`#u2bo6`: the two bilingual managers compare two models** on twenty real bios and twenty real vet notes.
- **`#hzmxi` / `#c7zjk` / `#y1dqu`: a Thai speaker reads the new strings**, weekly (cadence settled). A stream later flips the check to blocking.
- **The shop (`#cjxq0`)**: needs the Director for products, prices, margin, a supplier and print-quality logo files. None of it blocks building the shop.

## 4. Optional, and for a quiet machine

- **`#7bd5u`: four optional speed improvements.** One session with nothing else building. Nothing is broken.
- **`#9b0vq`: cash-flow forecast against actuals.** Waits on months of real data.

## 5. Always yours

- **Major versus minor on every release.** A major release mails the admin list (currently one person) and cannot be undone.
- **The production Worker deploy.** Yours by your instruction of 2026-10-02, every release.

## Not established in this snapshot

- Why the Pi rebooted on 2026-11-11 and 2026-11-12: at least one matches a deliberate power-pull drill. The rest were not matched to a drill and are not a finding.
