# Eight harnesses that tested a removed mechanism are deleted (2026-10-28)

Batch 6 (`2026-10-27-harness-sweep-batch-6.md`, verdicts 2 and 3) left these for "the next stream".
Each was **run on dev first** (the expiry rule); **all eight were still red**, so none was spared.

| Harness | Run today | Outcome | Why |
|---|---|---|---|
| `check-perm-convert-people` | 25 of 410 failed | deleted | fixed cell matrix for `management`/`vet` |
| `check-perm-convert-work` | 10 of 149 failed | deleted | same; its `project_folders` insert fixture also errored |
| `check-perm-convert-settings` | 19 of 256 failed | deleted | same |
| `check-perm-convert-orphans` | 1 of 518 failed | deleted | its tables are listed per role (`admin`, `management`, `staff`, `c_stock`); a role is now only its cards. The lone failure (`stock_receipts` delete as `c_stock`) is a role-cell expectation, not a finding. |
| `check-2ic-role` | 38 of 261 failed | deleted | asserts the 2IC's fixed slice; its forecast-equality half compared empty dev forecasts ("proves little", its own note) |
| `check-bills-roles` | 10 of 86 failed | deleted | role-by-role bill/photo matrix |
| `check-donation-channels-schema` | 15 failed | deleted | "mgmt reads table" and similar fixed-role reads |
| `check-perm-convert-residents` | 1 of 134 failed | deleted | fails on `sees_all_residents()`, which reads a role column; making it green would add hidden security |

**None was cut down.** Every assertion left in them is either a role's cells or a structural sweep
that `check-hard-coded-security.mjs` and `check-policy-role-names` already cover. Nothing was edited to
assert a role's cells.

## Recorded, not acted on
`check-perm-convert-residents` named two policies that may over-grant. That is a question for the card
system; it stays one. It was never this stream's to change.

## Docs pass
`docs/decisions/` and `docs/test-plans/` (records) untouched. No CI workflow, `package.json` script or
other script invoked any of the eight. Three comments that pointed at them were reworded:
`check-bill-photos-listed.mjs`, `check-permission-parity.mjs`, `scripts/lib/permission-probes.mjs`.
`docs/roles-and-permissions.md` lists the conversion streams as history and is left as that history.

## Left alone (not this stream)
`check-features-schema` (28 vs 33 cards, a data decision), `check-role-can`, `check-permission-tables`,
`check-doctors`, the 16 doctor-scope harnesses, and `check-who-does-what` / `check-menu-coverage`
(red on purpose).

## Job 2: cloudflared self-update in `scripts/pi/setup.sh`
Step 2a copies the live Pi's files: `52unattended-upgrades-cloudflared`, `cloudflared-restart.service`
and `cloudflared-restart.path` (enabled). Written with `tee` and a `daemon-reload`, so a re-run is safe.
`docs/pi-hosting.md` gained a line. **Not run on a Pi**: only `bash -n` was checked.
