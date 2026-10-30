# Harness exit triage: which check scripts end with `process.exit`

2026-10-30, stream `harness-exit-helper`. Follows `2026-10-16-shared-exit-helper.md`.

## What was fixed

`check-map-markers.mjs` and `check-diets-servings-app.mjs` ended with `process.exit(n)` after a
`fetch`, which dies on Windows with exit 127 even when every assertion passed. Both now end with
`await exitWith(n)` from `scripts/lib/exit.mjs` (not changed). Both exit 0 now.

## Triage of the other scripts (not swept, on purpose)

`process.exit()` stops the script; `exitWith`/`process.exitCode` does not. A mechanical swap is only
right where nothing executes afterwards. The classification below is mechanical: a call is "safe" when
everything after it in the file is closing brackets, comments or blank lines. "Needs a guard" means
code follows the call (or sits after the enclosing block), so each call needs reading to see whether it
needs `else`/`return` before it is changed. Only a human read of each can confirm either column; it
was not done for the guard list. **No script in this table was edited.**
`check-phone-width.mjs`, `check-card-walkthrough.mjs` and `gen-card-walkthrough.mjs` are outside this
stream's boundary; their rows are information only.

Whether each safe script also makes a `fetch` matters (only those can hit the libuv crash): the crash
needs an open keep-alive socket, so the safe scripts that make no network call are not at risk at all.

| script | calls | verdict | first call with code after it | guard read, 2026-10-30 |
|---|---|---|---|---|
| check-acceptance-pdf.mjs | 2 | needs a guard | line 42, then `const { renderAcceptancePdf } = await import(pathT` | read, final exit swapped to `await exitWith`; line 42 left (inside the synchronous `pdfText`, no network) |
| check-access-requests-card.mjs | 1 | needs a guard | line 180, then `console.log("\nAll expectations held.");` | swapped, `else` added |
| check-actions-key.mjs | 1 | safe (nothing runs after) | - | - |
| check-activity-lists.mjs | 2 | needs a guard | line 17, then `const keySet = new Set(keys);` | left alone: no network call, so no libuv trap; a swap needs a rewrite for no gain |
| check-appeals-schema.mjs | 1 | needs a guard | line 151, then `const rows = JSON.parse(m[1]);` | swapped, rest wrapped in `else` |
| check-backlog-sections.mjs | 1 | needs a guard | line 107, then `const open = lines.slice(0, lines.findIndex((l) =>` | left alone: no network; its exit 3 is the pre-commit hook's refusal contract |
| check-backup-encryption.mjs | 1 | safe (nothing runs after) | - | - |
| check-backup-folder.mjs | 1 | safe (nothing runs after) | - | - |
| check-backup-prune.mjs | 1 | safe (nothing runs after) | - | - |
| check-can-see-drive-file.mjs | 1 | needs a guard | line 78, then `let bad = 0;` | swapped, rest wrapped in `else`; the final `process.exitCode` became `await exitWith` (exit 0 before and after) |
| check-card-walkthrough.mjs | 1 | safe (nothing runs after) | - | - |
| check-cards-count.mjs | 1 | safe (nothing runs after) | - | - |
| check-chip-scan.mjs | 1 | needs a guard | line 148, then `console.log("\nAll expectations held.");` | swapped, `else` added |
| check-community-dogs-schema.mjs | 1 | needs a guard | line 106, then `const rows = JSON.parse(m[1]);` | swapped, rest wrapped in `else` |
| check-confirm-outside-transition.mjs | 1 | needs a guard | line 51, then `console.log("ok: no await confirm( inside startTra` | left alone: no network call |
| check-contact-address-fields.mjs | 1 | needs a guard | line 165, then `console.log("\nAll expectations held.");` | swapped, `else` added |
| check-csp-report.mjs | 1 | needs a guard | line 83, then `console.log("all cases ok");` | left alone: no network call |
| check-csv.mjs | 1 | safe (nothing runs after) | - | - |
| check-dead-schema-drop.mjs | 2 | needs a guard | line 86, then `const got = Object.fromEntries(body.map((x) => [x.` | swapped (both), rest wrapped in `else` |
| check-deferred-notes.mjs | 1 | needs a guard | line 58, then `const since = opt("since") ?? lastCut();` | left alone: no network call |
| check-delivery-lines.mjs | 1 | safe (nothing runs after) | - | - |
| check-diets-app.mjs | 1 | needs a guard | line 76, then `const n = (k) => Number(get(k));` | swapped (the SKIPPED exit 0 was the one that mattered), rest wrapped in `else` |
| check-diets-forecast-functions.mjs | 1 | needs a guard | line 190, then `console.log("\nall ok");` | swapped, `else` added |
| check-donate-buttons.mjs | 1 | needs a guard | line 147, then `console.log("\nall expectations held");` | swapped, `else` added |
| check-donation-receipts-schema.mjs | 2 | needs a guard | line 83, then `const sql = `` | line 214 swapped, rest wrapped; line 83 left (error path, exit 1 either way, a SQL template follows) |
| check-drive-token.mjs | 1 | needs a guard | line 24, then `async function main() {` | MISCLASSIFIED: the match is a comment; the script already ends with `process.exitCode`. Nothing to do |
| check-env-leak.mjs | 1 | safe (nothing runs after) | - | - |
| check-file-signature.mjs | 1 | safe (nothing runs after) | - | - |
| check-hard-coded-security.mjs | 4 | needs a guard | line 54, then `const keepNewlines = (s) => s.split(NL).map(() => ` | left alone: no network call (4 calls) |
| check-hidden-public-pages-schema.mjs | 1 | needs a guard | line 132, then `console.log("\nall ok");` | swapped, `else` added |
| check-home-cards.mjs | 1 | needs a guard | line 124, then `console.log("\nall ok");` | swapped, `else` added (red before and after, exit 1) |
| check-home-screens-live.mjs | 2 | needs a guard | line 40, then `const failures = [];` | swapped (cleanup exit 0 and the failures exit), rest wrapped in `else` |
| check-map-rooms.mjs | 1 | needs a guard | line 212, then `const rows = JSON.parse(m[1]);` | swapped, rest wrapped in `else` |
| check-medical-jobs-app.mjs | 1 | needs a guard | line 247, then `console.log("\nAll expectations held.");` | swapped, `else` added (undiagnosed red, left as it is) |
| check-medication-list-due.mjs | 1 | safe (nothing runs after) | - | - |
| check-medication-pick.mjs | 1 | safe (nothing runs after) | - | - |
| check-migration-consumers.mjs | 1 | safe (nothing runs after) | - | - |
| check-migration-grants.mjs | 1 | needs a guard | line 439, then `console.log(`migration grants: ok (${files.length}` | left alone: no network call |
| check-migration-numbers.mjs | 8 | needs a guard | line 51, then `const TAG = "migration numbers";` | left alone: no network; its exit 3 is the pre-commit hook's refusal contract (8 calls) |
| check-multi-role-build.mjs | 1 | safe (nothing runs after) | - | - |
| check-new-policy-role-names.mjs | 4 | needs a guard | line 43, then `const TAG = "new policy role names";` | left alone: no network call, so no libuv trap; a swap needs a rewrite for no gain (exits 2/0/1 are usage and verdicts) |
| check-next-og.mjs | 1 | safe (nothing runs after) | - | - |
| check-next-path.mjs | 1 | safe (nothing runs after) | - | - |
| check-no-native-date-input.mjs | 1 | needs a guard | line 30, then `console.log("check-no-native-date-input: ok");` | left alone: no network call, so no libuv trap; a swap needs a rewrite for no gain (the only code after the exit is the closing "ok" line) |
| check-no-role-column-security.mjs | 2 | needs a guard | line 29, then `const COLUMNS = "scope_residents|scope_clinical|sc` | swapped: the final `process.exit` is the last statement after the fetch, now `await exitWith`; the exit-2 guard runs before any network call and stays (exit 0 before and after) |
| check-offsite-chip.mjs | 1 | needs a guard | line 160, then `console.log("\nAll expectations held.");` | swapped, `else` added (exit 0 before and after) |
| check-phone-width.mjs | 3 | needs a guard | line 253, then `if (args.includes("--clean")) {` | skipped on purpose: stream 7 (prescription-frequency-drop) edits it; still open for a later stream |
| check-place-order-roles.mjs | 1 | needs a guard | line 159, then `console.log("\nall held");` | swapped, `else` added (exit 0 before and after) |
| check-prerequisites.mjs | 1 | needs a guard | line 33, then `console.log("\nOK: the prerequisite rules refuse a` | left alone: no network call, so no libuv trap; a swap needs a rewrite for no gain |
| check-production.mjs | 3 | needs a guard | line 18, then `const wanted = args[0];` | left alone: no network call, so no libuv trap; a swap needs a rewrite for no gain (it already finishes through `process.exitCode`; the exit 2/0 calls are usage) |
| check-public-paths.mjs | 1 | safe (nothing runs after) | - | - |
| check-public-view-owner.mjs | 1 | safe (nothing runs after) | - | - |
| check-public-views.mjs | 1 | needs a guard | line 43, then `const headers = { apikey: key, Authorization: `Bea` | left alone: the one `process.exit(2)` is the missing-env guard before any network call; it already ends through `exitWith` |
| check-release-guards.mjs | 1 | safe (nothing runs after) | - | - |
| check-resident-id-search.mjs | 1 | needs a guard | line 105, then `console.log("\nAll expectations held.");` | swapped, `else` added (exit 0 before and after) |
| check-resident-sections.mjs | 1 | needs a guard | line 57, then `const root = process.cwd();` | left alone: the exit is the `--compare` branch, which only reads two files, and it must stop the capture code below |
| check-residents-export.mjs | 2 | needs a guard | line 44, then `if (args.includes("--clean")) {` | left alone: exits are the usage `bail` (nothing answering, no socket open) and `--clean`, which measured exit 0 on dev; it already ends through `exitWith` |
| check-residents-select-all.mjs | 2 | needs a guard | line 43, then `if (args.includes("--clean")) {` | left alone: same reason as check-residents-export; `--clean` measured exit 0 |
| check-residents-status-chips.mjs | 1 | needs a guard | line 194, then `console.log("\nAll expectations held.");` | swapped, `else` added (exit 0 before and after) |
| check-restated-columns.mjs | 1 | needs a guard | line 53, then `const rows = JSON.parse(m[1]);` | swapped, rest wrapped in `else`; the final `process.exitCode` became `await exitWith` (exit 0 before and after) |
| check-roles-columns.mjs | 2 | needs a guard | line 98, then `const re = new RegExp(`\\.from\\(\\s*["'\`]${table` | left alone: no network call, so no libuv trap; a swap needs a rewrite for no gain |
| check-runtime-config.mjs | 1 | needs a guard | line 32, then `console.log(`check-runtime-config: ${names.length}` | left alone: no network call, so no libuv trap; a swap needs a rewrite for no gain |
| check-schema-drift.mjs | 5 | needs a guard | line 36, then `if (againstRef && !/^[a-z0-9]{20}$/.test(againstRe` | swapped, `else` added; the early exit-2 argument guards run before any fetch and stay (exit 2 before and after with no production env file; the exit-1 path was not exercised) |
| check-script-integrity.mjs | 1 | needs a guard | line 93, then `console.log("script-integrity: ok");` | left alone: no network call, so no libuv trap; a swap needs a rewrite for no gain |
| check-security-role-picker.mjs | 2 | needs a guard | line 43, then `const base = (args.find((a) => /^https?:/.test(a))` | left alone: exit 2 follows a refused connection (no socket open) or runs before any network call; it already ends through `exitWith` |
| check-shelter-dates.mjs | 1 | needs a guard | line 163, then `console.log("\nAll checks passed.");` | skipped on purpose: stream 7 owns it by name; still open for a later stream |
| check-site-hosts.mjs | 1 | safe (nothing runs after) | - | - |
| check-site-links.mjs | 1 | needs a guard | line 46, then `console.log("all ok");` | left alone: no network call, so no libuv trap; a swap needs a rewrite for no gain |
| check-test-plan.mjs | 5 | needs a guard | line 123, then `let changed = [];` | left alone: no network call, so no libuv trap; a swap needs a rewrite for no gain (it runs in CI and the pre-commit path) |
| check-theme-contrast.mjs | 1 | safe (nothing runs after) | - | - |
| check-translate-worker.mjs | 1 | safe (nothing runs after) | - | - |
| check-units-schema.mjs | 1 | safe (nothing runs after) | - | - |
| check-units.mjs | 1 | safe (nothing runs after) | - | - |
| check-upcoming-visits-page.mjs | 1 | needs a guard | line 112, then `console.log("\nAll expectations held.");` | swapped, `else` added (exit 0 before and after) |
| check-worker-origin.mjs | 1 | needs a guard | line 219, then `console.log("all cases ok");` | left alone: no network call, so no libuv trap; a swap needs a rewrite for no gain (the exit-1 is its last statement) |
| check-worktree-done.mjs | 1 | safe (nothing runs after) | - | - |

## security-role-picker (app or harness?)

Measured with the dev server up and the harness's mobile emulation (375x812). The Thai-label checks
pass; the first create-form submit click times out, reported as the modal backdrop
(`fixed inset-0 z-40`, `src/app/admin/security/Modal.tsx`) intercepting pointer events. But the submit
button is inside the dialog, and `elementFromPoint` at its centre returns the button. What does differ
from a phone: the page is **631 px wide** (`scrollWidth` 631, 52 elements past x=380, all the per-person
role-select rows), so the emulated layout viewport is wider than 375. **Established:** the Security page
overflows a phone horizontally (an app fault, filed under Mobile). **Not established:** that this overflow
is why Playwright's click lands on the backdrop. Neither the page nor the harness was changed.

## who-does-what

- (3a) The fixture attachments were `Medical`, which `set_resident_profile_photo` correctly refuses, so the
  Admin control failed the `photos.resident_manage` edit probe. They are `Photos` now; Admin is allowed.
- (3b) `photos.resident_add` is proved shared with `photos.shelter_add` for three boxes, so they are listed
  under `databaseWider` (shown: false).
- (3c) `whoAndWhere` and `nameAndPhone` entries removed (every box obeyed); their ids stay in `FIXED_IDS`
  because the i18n dictionaries are keyed by them. **The brief expected `add_while_recording` to need
  adding; the check measured the opposite**: `management stock.delivery` and `management
  reference.add_while_recording` are both obeyed now, so they were taken out of `databaseWider`
  (`second_in_command stock.delivery` is still shared and stays).
- (3d) untouched. The check exits **1**: 17 `clinicRule: doctor <activity>` entries are over-listed only
  because the Doctor holds no cards while one card at a time is being tested. Correct, not unfinished.
