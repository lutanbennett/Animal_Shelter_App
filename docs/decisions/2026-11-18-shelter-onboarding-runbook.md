# 2026-11-18 — The shelter onboarding runbook (`#onbrb`), first half

**Asked for by Lutan, 2026-11-18:** *"runbook for onboarding a new shelter - a runbook is needed with all step by step instructions including screenshots to enable me to setup a shelter without you if necessary"*.

## How the last clause shaped the document

*"Without you if necessary"* means the document must work with no Claude session. So `docs/shelter-onboarding-runbook.md` never says "ask Claude to run", gives each command in full with its folder, marks who can do each step (**[LUTAN ONLY]**, **[ADMIN SCREEN]**, **[TERMINAL]**), and where a step needs a developer it says so and names the item rather than inventing keystrokes. It is written for Lutan: short, plain, which button to press. Every script step is "run without `--apply`, read, then run with it".

## In, and deferred with its blocker

- **In:** Cloudflare host (one host at a time; `#v0302`'s answer that a wildcard is a zone route, never a `custom_domain`), the shelter's Google account, the Drive and calendar connect scripts, repository secrets (never through a terminal), roles and cards (Settings → Who does what), the lookup-list screens that exist, deploy, a check, and a shelter leaving (`shelter-export.mjs`).
- **Deferred, marked NOT YET POSSIBLE in the document:** creating the `shelters` and `shelter_hosts` rows (`0382` revokes them from every login; `#shmgt`), setting a shelter's names (`0400`) and receipt series (`0395`) (no screen or script; `#shmgt`), the bill-kinds / frequencies / group-origins lookup screens (none exist), removing a shelter after export (no script), and **every screenshot** (they wait on `#shmgt`'s screen; the mechanism is `scripts/manual-screenshots.mjs`, captured in the same pass as the manual's own re-run, never pasted).

## The Drive-step correction (for the planner to file)

`#onbrb` said the Drive step must wait for `#cn7gk` because nothing writes a `shelter_drive_credentials` row. **That is out of date:** `scripts/connect-shelter-drive.mjs` shipped on 2026-11-18 (`2026-11-18-shelter-drive-connect.md`) and was proved on dev. The step is documented. What `#cn7gk` still lacks is narrower: two shelters uploading to two **different** Google accounts, which needs Lutan's second Google account. The runbook says so in one paragraph that is deleted when that is proved.

## Rehearsal

Cheap, nothing written. Ran the connect script with missing inputs (refuses, naming the four missing values, as documented), `shelter-export.mjs` with no arguments and with `--out` inside the repo (both refuse, as documented), and read `google-oauth-setup.mjs`. **Found wrong in the first draft:** I had said one refresh token serves both Drive and calendar; the oauth script mints them separately (`--calendar`, calendar.events only). Fixed. **Not rehearsed:** every step that writes (connect `--apply`, the export, deploy, Cloudflare, Google), by design.

## Findings for the planner (not fixed; scripts are not mine)

- README's "Exporting one shelter" command shows `C:Temp<shelter>-export`: the backslashes were lost, so it cannot be typed as written.
- `google-oauth-setup.mjs`'s header still says "Drive access" and only the `--calendar` flag is documented in its body, not its header.

## Keeping it current

A runbook nobody updates is worse than none. The document ends with the rule: change the matching step in the same PR as any script flag change, and delete each NOT YET POSSIBLE note when its item closes. When `#shmgt` lands, its PR (or the next stream) replaces steps 1 and 6 with the screen and adds the screenshots through `manual-screenshots.mjs`.
