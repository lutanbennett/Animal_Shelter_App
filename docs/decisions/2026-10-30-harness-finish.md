# Harness finish: the last guard reads, one diagnosis, three durations

2026-10-30, stream `harness-finish`. Follows `2026-10-30-harness-guard-reads.md` (#1103) and
`2026-10-30-harness-exit-triage.md`. No migration, nothing under `src/`, `scripts/lib/` untouched.

## 1. `check-medical-jobs-app`: diagnosed, a harness fault, fixed

Red with exit 1, one failure: `she inserts a weight (duplicate key value violates unique constraint
"weight_one_per_day")`. The check inserts a 12.34 kg weight dated 400 days ago for the first live
resident it finds. Dev already held that exact row (resident `Loader Test Alpha`, 2025-09-25, 12.34 kg):
**left behind by an earlier run that was killed before its cleanup** (the cleanup deletes only ids
recorded after a successful insert). Every run after that collided. Not an application fault; nothing
goes in `docs/card-access-faults.md`.

Fix: before the insert the check deletes the one row matching its own marker (that resident, that day,
exactly 12.34 kg). No assertion changed. Exit 1 before, 0 after, and 0 on a second run.

## 2. The 26 guard reads

Counted 26 rows with an empty last column (24 plain rows, `check-no-role-column-security`, whose cell
holds a `|` and breaks a naive column parse, and `check-can-see-drive-file`). That agrees with #1103's 26;
the planner's "about 24 plus drive-file" missed the pipe row. Verdicts are in the table, last column.

- **Swapped to `await exitWith(n)`, with `else` around what followed (9):** `check-offsite-chip`,
  `check-place-order-roles`, `check-resident-id-search`, `check-residents-status-chips`,
  `check-upcoming-visits-page`, `check-restated-columns`, `check-schema-drift`,
  `check-can-see-drive-file`, `check-no-role-column-security`. The last two and `restated-columns`
  ended through `process.exitCode`/`process.exit` right after a fetch.
- **Left alone with a reason (15):** ten make no network call (`new-policy-role-names`,
  `no-native-date-input`, `prerequisites`, `production`, `roles-columns`, `runtime-config`,
  `script-integrity`, `site-links`, `test-plan`, `worker-origin`); `public-views` and
  `security-role-picker` exit 2 before any network call or after a refused connection (no socket open) and
  already end through `exitWith`; `residents-export` and `residents-select-all` the same, plus a
  `--clean` path measured exit 0 on dev; `resident-sections` exits inside `--compare`, which only reads two
  files and must stop the capture code.
- **Skipped on purpose (2):** `check-phone-width` and `check-shelter-dates`, which stream 7 owns. They stay
  in the table for a later stream.

Exit codes before and after, identical on every edited script: the eight dev checks above, 0 and 0.
`check-schema-drift` needs a second project's env and answered exit 2 ("env file missing") both before and
after; **its exit-1 path was not exercised**, and its edit has the same shape as the proven ones.

## 3. The three durations

Environment: Windows 11, Git Bash, `next dev` on port 3002 (cold, a neighbour stream also running a dev
server and writing to the shared dev database), run one at a time.

| check | wall clock | exit |
|---|---|---|
| `check-access-requests-card` | 162 s | 0 |
| `check-public-views` | 66 s | 0 |
| `check-residents-sort` | 94 s | 0 |

All three pass under a 400 s timeout; none was changed. The first matches #1103's ~150 s.

## What the triage table got wrong

- Its mechanical parse missed `check-no-role-column-security`, whose first-call cell contains `|`. The
  true count of open rows was 26, not 25.
- The four "red" checks the item named were already green (#1102, #1104).
