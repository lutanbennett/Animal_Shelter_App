# Feature test plan

## Header

| | |
|---|---|
| Feature | Each person chooses the app's colours: Dark (default), Light, High contrast or Magenta, saved to their login |
| Backlog item | `docs/backlog.md` → **User preferences: pick a colour theme** (ticked here) |
| Branch / worktree | `claude/user-colour-theme` @ `C:\Development\Animal_Shelter_user-colour-theme` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3009` |
| PR | to be opened from this commit |
| Tested by / date | Claude / 2026-10-10 |
| Carries a migration? | no — the choice lives in the person's own `user_metadata.theme` |
| Tested at SHA | `17a08dbe` (after sync with `origin/main`) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: a Colours choice in the account menu beside *Your name and password*, four themes as `[data-theme]` token blocks, saved per user so it follows them between devices, AA contrast checked for every theme, PDFs unthemed, and the dev marker kept visible under every theme
- [x] Files/areas touched listed: `src/app/globals.css` (three theme blocks, `--zone-dot-ring`, `.zone-chip`, default `--danger-foreground`); `src/app/layout.tsx` (renders `data-theme`); `src/app/AppHeader.tsx` (fixed-colour badge, dev strip, shared user lookup); `src/app/AccountMenu.tsx`, `src/app/ThemePicker.tsx`, `src/app/account/theme/actions.ts`; `src/lib/theme/themes.ts`, `src/lib/auth/current-user.ts`; `src/components/ZoneName.tsx` (ring token), `src/components/PlaceZoneChips.tsx` (light-theme edge), `src/app/admin/zones/ZoneColourPicker.tsx`; `src/lib/zones/palette.ts` (comment only); both dictionaries; the manual; `src/lib/releases.ts`; `scripts/lib/acceptance-matrix-entries.mjs`; new `scripts/check-theme-contrast.mjs` and `scripts/check-user-theme.mjs`; README; decision file
- [x] Roles affected identified: every signed-in role gets the picker and their own theme (admin, management, head of medical, doctor, head of maintenance, 2IC, volunteer). Signed-out public: nothing changes; the sign-in page and public site always show the default/public look
- [x] Anything explicitly out of scope written down: the default orange's closeness to the Orange zone (ΔE 5.0) and dev teal's to the Teal zone (4.5) are left for Lutan, and dev's two older near-miss pairs are left to retune; both are on the backlog branch. No `localStorage` cache, because the server renders the theme (decision file)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (brought in `0177_receipt_content_server_side.sql` and other merged work; no conflicts)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. The first run after sync was `lint=1`: the acceptance matrix check wanted a row for the new manual topic, which was added. The re-run:

```
=== gates: build exited 0 after 98s

gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration; the brief ruled `user_metadata` over a table
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration; an unknown or missing `user_metadata.theme` falls back to the default (scripted, below)
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — n/a: no migration, no constraint; the stored value is validated on read by `parseTheme`
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end: `scripts/check-user-theme.mjs` (output below) signs a throwaway Management login in, writes each theme through the person's own session exactly as `setOwnTheme` does, and the next page's first response carries `<html data-theme="…">` for light, contrast and magenta
- [x] Data persists — reload the page and the change is still there: the theme comes from the login on every request; a **second fresh sign-in** with an empty cookie jar (a second device / cleared storage) gets the saved theme on its first page
- [ ] Create / edit / delete all exercised — n/a: one setting with four values; set, changed and cleared back to the default are all exercised in the script
- [x] Empty state renders sensibly (no rows yet): a login that has never chosen gets no attribute and the default look
- [x] Invalid input is rejected with a readable message, not a crash: a hand-written `theme: "neon"` in the metadata renders the default; `setOwnTheme` refuses anything not in `THEMES` with the translated "Couldn't save your colours" message, and the picker then puts the previous theme back
- [x] Boundary cases checked: cleared (`null`) value → default; saving a theme leaves `full_name` untouched (the merge), checked in the script

### Role access matrix

The picker is in the header's account menu, which every signed-in role has; the saved value is the person's own metadata, written through their own session.

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | account menu → Colours | own theme only | not separately signed in: same component and same own-session write as management |
| management | account menu → Colours | own theme only | scripted: theme set, rendered, follows to a second sign-in |
| staff | — | retired role (2026-10-09), no logins | n/a |
| doctor | account menu → Colours | own theme only | same component; not separately signed in |
| volunteer | account menu → Colours | own theme only | same component; not separately signed in |
| signed out | sign-in page | always default | scripted: `/login` has no `data-theme` |

- [x] Every role above tested — as the table says: management by script, signed out by script; the others share the one component and the write is the user's own metadata, so there is no role-specific path to differ
- [ ] A role that should not have access is blocked server-side (hitting the URL directly fails) — n/a: nothing is restricted; a person can only write their own `user_metadata`, which Supabase enforces through their own session

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav entry; the picker is in the account menu
- [x] Manual updated (`src/lib/manual/en.ts`): new topic *Choosing the app's colours* under getting started; the script confirms `/manual` shows it, and it has its acceptance-matrix row
- [x] Translatable strings go through the translation path: the six new labels are in both `en.ts` and `th.ts` dictionaries (app chrome, not user text, so not on `/management/translations`)
- [x] Mobile viewport (375px) — the sign-in page under each theme and a mock zone-chip row were looked at in the browser pane at 375 × 812; the real account menu at 375 px is under **Left for manual verification**, because no browser sign-in was possible (below)
- [x] Browser console clean — the only error seen was a hydration warning caused by my own probe setting `data-theme` before the page finished hydrating; the real path sets it server-side, so server and client agree
- [x] Network clean — every scripted fetch returned 200 (pages, `/manual/pdf`)

## 6. Regression

- [x] The pages nearest the change still work: `/residents` (signed in, every theme), `/` public home (still the public look, `data-public-site` present), `/login`, `/manual`, `/manual/pdf`
- [x] Shared file touched (`globals.css`, `layout.tsx`, `AppHeader.tsx`, `manual/en.ts`, dictionaries) checked from a second, unrelated page by loading it: the public home `/` and `/manual/pdf` above
- [x] Nothing merged from `main` during `sync` was broken by this branch: gates green after the merge

### Contrast, every theme (WCAG AA), and the zone colours

`node scripts/check-theme-contrast.mjs` at `17a08dbe`, exit 0. It reads the colours out of `globals.css` and `palette.ts`, so these are the shipped values. Output unedited:

```

== dark
  ok   17.18:1  foreground / background  (#f5f5f5 on #121212)
  ok   15.61:1  foreground / surface  (#f5f5f5 on #1c1c1e)
  ok   13.84:1  foreground / surface-hover  (#f5f5f5 on #262629)
  ok    7.31:1  muted / background  (#a1a1aa on #121212)
  ok    6.64:1  muted / surface  (#a1a1aa on #1c1c1e)
  ok    5.89:1  muted / surface-hover  (#a1a1aa on #262629)
  ok    9.11:1  primary / background  (#ff9f0a on #121212)
  ok    8.28:1  primary / surface  (#ff9f0a on #1c1c1e)
  ok    9.09:1  primary-foreground / primary  (#1a1100 on #ff9f0a)
  ok   10.47:1  primary-foreground / primary-hover  (#1a1100 on #ffb340)
  ok   13.06:1  foreground / primary/10 on surface  (#f5f5f5 on #33291c)
  ok    5.50:1  danger / background  (#ff453a on #121212)
  ok    4.99:1  danger / surface  (#ff453a on #1c1c1e)
  ok    4.50:1  danger / danger/10 on surface  (#ff453a on #332021)
  ok    5.78:1  danger-foreground / danger  (#1a0503 on #ff453a)
  ok    9.27:1  success / background  (#30d158 on #121212)
  ok    8.42:1  success / surface  (#30d158 on #1c1c1e)
  ok    9.17:1  success-foreground / success  (#04170a on #30d158)
  ok   12.05:1  warning / surface  (#ffd60a on #1c1c1e)
  ok    8.33:1  warning / warning/15 on surface  (#ffd60a on #3e381b)
  ok    9.38:1  foreground / warning/20 on surface  (#f5f5f5 on #49411a)
  ok    4.66:1  info / surface  (#0a84ff on #1c1c1e)
  ok    2.40:1  focus ring primary/40 / background [graphic, info only]
  ok    8.42:1  status dot success / surface [graphic, 3:1]
  ok   12.05:1  status dot warning / surface [graphic, 3:1]
  ok    4.99:1  status dot danger / surface [graphic, 3:1]
  ok    4.68:1  chart series-food / surface [graphic, 3:1]
  ok    4.38:1  chart series-medication / surface [graphic, 3:1]
  ok    5.00:1  chart series-immunization / surface [graphic, 3:1]
  ok    5.54:1  chart series-clinic / surface [graphic, 3:1]
  ok    4.31:1  chart series-maintenance / surface [graphic, 3:1]
  ok    4.96:1  chart series-fixed / surface [graphic, 3:1]
  ok   zone dots: ring #121212 is 1.00:1 against the surfaces; weakest fill against its ring: brown 5.89:1; weakest fill against a surface: brown 4.74:1, blue 4.83:1
  KNWN zone chips: accent #ff9f0a is ΔE 5.0 from the nearest zone colour (orange)
  ok   zone chips: weakest edge brown 5.35:1 against the page [graphic, 3:1]

== dark (dev)
  ok   16.83:1  foreground / background  (#f5f5f5 on #0e1615)
  ok   14.96:1  foreground / surface  (#f5f5f5 on #172221)
  ok   13.10:1  foreground / surface-hover  (#f5f5f5 on #1f2d2c)
  ok    7.16:1  muted / background  (#a1a1aa on #0e1615)
  ok    6.37:1  muted / surface  (#a1a1aa on #172221)
  ok    5.57:1  muted / surface-hover  (#a1a1aa on #1f2d2c)
  ok    9.86:1  primary / background  (#2dd4bf on #0e1615)
  ok    8.76:1  primary / surface  (#2dd4bf on #172221)
  ok    8.73:1  primary-foreground / primary  (#032523 on #2dd4bf)
  ok   10.98:1  primary-foreground / primary-hover  (#032523 on #5eead4)
  ok   12.22:1  foreground / primary/10 on surface  (#f5f5f5 on #193431)
  ok    5.39:1  danger / background  (#ff453a on #0e1615)
  ok    4.79:1  danger / surface  (#ff453a on #172221)
  KNWN  4.34:1  danger / danger/10 on surface  (#ff453a on #2e2624)
  ok    5.78:1  danger-foreground / danger  (#1a0503 on #ff453a)
  ok    9.08:1  success / background  (#30d158 on #0e1615)
  ok    8.07:1  success / surface  (#30d158 on #172221)
  ok    9.17:1  success-foreground / success  (#04170a on #30d158)
  ok   11.56:1  warning / surface  (#ffd60a on #172221)
  ok    7.97:1  warning / warning/15 on surface  (#ffd60a on #3a3d1e)
  ok    8.98:1  foreground / warning/20 on surface  (#f5f5f5 on #45461c)
  KNWN  4.47:1  info / surface  (#0a84ff on #172221)
  ok    2.57:1  focus ring primary/40 / background [graphic, info only]
  ok    8.07:1  status dot success / surface [graphic, 3:1]
  ok   11.56:1  status dot warning / surface [graphic, 3:1]
  ok    4.79:1  status dot danger / surface [graphic, 3:1]
  ok    4.48:1  chart series-food / surface [graphic, 3:1]
  ok    4.20:1  chart series-medication / surface [graphic, 3:1]
  ok    4.79:1  chart series-immunization / surface [graphic, 3:1]
  ok    5.31:1  chart series-clinic / surface [graphic, 3:1]
  ok    4.14:1  chart series-maintenance / surface [graphic, 3:1]
  ok    4.76:1  chart series-fixed / surface [graphic, 3:1]
  ok   zone dots: ring #0e1615 is 1.00:1 against the surfaces; weakest fill against its ring: brown 5.77:1; weakest fill against a surface: brown 4.49:1, blue 4.57:1
  KNWN zone chips: accent #2dd4bf is ΔE 4.5 from the nearest zone colour (teal)
  ok   zone chips: weakest edge brown 5.13:1 against the page [graphic, 3:1]

== light
  ok   16.12:1  foreground / background  (#18181b on #f4f4f5)
  ok   17.72:1  foreground / surface  (#18181b on #ffffff)
  ok   14.62:1  foreground / surface-hover  (#18181b on #e9e9ec)
  ok    7.03:1  muted / background  (#52525b on #f4f4f5)
  ok    7.73:1  muted / surface  (#52525b on #ffffff)
  ok    6.38:1  muted / surface-hover  (#52525b on #e9e9ec)
  ok    5.24:1  primary / background  (#a84a07 on #f4f4f5)
  ok    5.76:1  primary / surface  (#a84a07 on #ffffff)
  ok    5.76:1  primary-foreground / primary  (#ffffff on #a84a07)
  ok    7.69:1  primary-foreground / primary-hover  (#ffffff on #8a3c05)
  ok   15.33:1  foreground / primary/10 on surface  (#18181b on #f6ede6)
  ok    5.41:1  danger / background  (#c0261a on #f4f4f5)
  ok    5.94:1  danger / surface  (#c0261a on #ffffff)
  ok    5.05:1  danger / danger/10 on surface  (#c0261a on #f9e9e8)
  ok    5.94:1  danger-foreground / danger  (#ffffff on #c0261a)
  ok    4.62:1  success / background  (#1a7f37 on #f4f4f5)
  ok    5.08:1  success / surface  (#1a7f37 on #ffffff)
  ok    5.08:1  success-foreground / success  (#ffffff on #1a7f37)
  ok    5.93:1  warning / surface  (#8a5a00 on #ffffff)
  ok    4.78:1  warning / warning/15 on surface  (#8a5a00 on #ede6d9)
  ok   13.29:1  foreground / warning/20 on surface  (#18181b on #e8decc)
  ok    6.13:1  info / surface  (#0a5ad4 on #ffffff)
  ok    1.82:1  focus ring primary/40 / background [graphic, info only]
  ok    5.08:1  status dot success / surface [graphic, 3:1]
  ok    5.93:1  status dot warning / surface [graphic, 3:1]
  ok    5.94:1  status dot danger / surface [graphic, 3:1]
  ok    3.64:1  chart series-food / surface [graphic, 3:1]
  ok    3.88:1  chart series-medication / surface [graphic, 3:1]
  ok    3.41:1  chart series-immunization / surface [graphic, 3:1]
  ok    3.07:1  chart series-clinic / surface [graphic, 3:1]
  ok    3.94:1  chart series-maintenance / surface [graphic, 3:1]
  ok    3.43:1  chart series-fixed / surface [graphic, 3:1]
  ok   zone dots: ring #3f3f46 is 8.62:1 against the surfaces; weakest fill against its ring: brown 3.28:1; weakest fill against a surface: white 1.02:1, yellow 1.17:1
  ok   zone chips: accent #a84a07 is ΔE 15.0 from the nearest zone colour (brown)
  ok   zone chips: weakest edge white 3.96:1 against the page [graphic, 3:1]

== contrast
  ok   21.00:1  foreground / background  (#ffffff on #000000)
  ok   19.80:1  foreground / surface  (#ffffff on #0a0a0a)
  ok   15.13:1  foreground / surface-hover  (#ffffff on #262626)
  ok   16.55:1  muted / background  (#e4e4e7 on #000000)
  ok   15.60:1  muted / surface  (#e4e4e7 on #0a0a0a)
  ok   11.93:1  muted / surface-hover  (#e4e4e7 on #262626)
  ok   17.24:1  primary / background  (#b3ff1a on #000000)
  ok   16.25:1  primary / surface  (#b3ff1a on #0a0a0a)
  ok   17.24:1  primary-foreground / primary  (#000000 on #b3ff1a)
  ok   18.06:1  primary-foreground / primary-hover  (#000000 on #ccff66)
  ok   16.25:1  foreground / primary/10 on surface  (#ffffff on #1b230c)
  ok    8.33:1  danger / background  (#ff7b72 on #000000)
  ok    7.85:1  danger / surface  (#ff7b72 on #0a0a0a)
  ok    7.01:1  danger / danger/10 on surface  (#ff7b72 on #231514)
  ok    8.33:1  danger-foreground / danger  (#000000 on #ff7b72)
  ok   13.16:1  success / background  (#5ee68a on #000000)
  ok   12.41:1  success / surface  (#5ee68a on #0a0a0a)
  ok   13.16:1  success-foreground / success  (#000000 on #5ee68a)
  ok   15.18:1  warning / surface  (#ffe066 on #0a0a0a)
  ok   10.99:1  warning / warning/15 on surface  (#ffe066 on #2f2a18)
  ok   12.27:1  foreground / warning/20 on surface  (#ffffff on #3b351c)
  ok    9.58:1  info / surface  (#7cb8ff on #0a0a0a)
  ok    3.18:1  focus ring primary/40 / background [graphic, info only]
  ok   12.41:1  status dot success / surface [graphic, 3:1]
  ok   15.18:1  status dot warning / surface [graphic, 3:1]
  ok    7.85:1  status dot danger / surface [graphic, 3:1]
  ok    5.44:1  chart series-food / surface [graphic, 3:1]
  ok    5.10:1  chart series-medication / surface [graphic, 3:1]
  ok    5.81:1  chart series-immunization / surface [graphic, 3:1]
  ok    6.45:1  chart series-clinic / surface [graphic, 3:1]
  ok    5.02:1  chart series-maintenance / surface [graphic, 3:1]
  ok    5.78:1  chart series-fixed / surface [graphic, 3:1]
  ok   zone dots: ring #000000 is 1.00:1 against the surfaces; weakest fill against its ring: brown 6.60:1; weakest fill against a surface: brown 4.76:1, blue 4.85:1
  ok   zone chips: accent #b3ff1a is ΔE 13.6 from the nearest zone colour (yellow)
  ok   zone chips: weakest edge brown 6.22:1 against the page [graphic, 3:1]

== magenta
  ok   17.18:1  foreground / background  (#f5f5f5 on #121212)
  ok   15.61:1  foreground / surface  (#f5f5f5 on #1c1c1e)
  ok   13.84:1  foreground / surface-hover  (#f5f5f5 on #262629)
  ok    7.31:1  muted / background  (#a1a1aa on #121212)
  ok    6.64:1  muted / surface  (#a1a1aa on #1c1c1e)
  ok    5.89:1  muted / surface-hover  (#a1a1aa on #262629)
  ok    5.43:1  primary / background  (#e033ff on #121212)
  ok    4.93:1  primary / surface  (#e033ff on #1c1c1e)
  ok    5.54:1  primary-foreground / primary  (#1f0326 on #e033ff)
  ok    7.51:1  primary-foreground / primary-hover  (#1f0326 on #ea70ff)
  ok   14.13:1  foreground / primary/10 on surface  (#f5f5f5 on #301e35)
  ok    5.50:1  danger / background  (#ff453a on #121212)
  ok    4.99:1  danger / surface  (#ff453a on #1c1c1e)
  ok    4.50:1  danger / danger/10 on surface  (#ff453a on #332021)
  ok    5.78:1  danger-foreground / danger  (#1a0503 on #ff453a)
  ok    9.27:1  success / background  (#30d158 on #121212)
  ok    8.42:1  success / surface  (#30d158 on #1c1c1e)
  ok    9.17:1  success-foreground / success  (#04170a on #30d158)
  ok   12.05:1  warning / surface  (#ffd60a on #1c1c1e)
  ok    8.33:1  warning / warning/15 on surface  (#ffd60a on #3e381b)
  ok    9.38:1  foreground / warning/20 on surface  (#f5f5f5 on #49411a)
  ok    4.66:1  info / surface  (#0a84ff on #1c1c1e)
  ok    1.76:1  focus ring primary/40 / background [graphic, info only]
  ok    8.42:1  status dot success / surface [graphic, 3:1]
  ok   12.05:1  status dot warning / surface [graphic, 3:1]
  ok    4.99:1  status dot danger / surface [graphic, 3:1]
  ok    4.68:1  chart series-food / surface [graphic, 3:1]
  ok    4.38:1  chart series-medication / surface [graphic, 3:1]
  ok    5.00:1  chart series-immunization / surface [graphic, 3:1]
  ok    5.54:1  chart series-clinic / surface [graphic, 3:1]
  ok    4.31:1  chart series-maintenance / surface [graphic, 3:1]
  ok    4.96:1  chart series-fixed / surface [graphic, 3:1]
  ok   zone dots: ring #121212 is 1.00:1 against the surfaces; weakest fill against its ring: brown 5.89:1; weakest fill against a surface: brown 4.74:1, blue 4.83:1
  ok   zone chips: accent #e033ff is ΔE 15.9 from the nearest zone colour (purple)
  ok   zone chips: weakest edge brown 5.35:1 against the page [graphic, 3:1]

Every pair meets WCAG AA.
```

`node scripts/check-user-theme.mjs` against the dev server on :3009, exit 0, output unedited:

```
  ok   globals.css defines 3 theme blocks
  ok   every theme block comes after the dev block
  ok   every theme block comes before the public-site mapping
  ok   /residents renders for the login (200)
  ok   no theme saved: no data-theme (got null)
  ok   dev: <html data-env="dev"> still set
  ok   dev: the header carries the striped env strip
  ok   dev: the badge uses its fixed teal, not bg-primary
  ok   light: first response is <html data-theme="light"> (got light)
  ok   light: dev strip and fixed badge still there
  ok   contrast: first response is <html data-theme="contrast"> (got contrast)
  ok   contrast: dev strip and fixed badge still there
  ok   magenta: first response is <html data-theme="magenta"> (got magenta)
  ok   magenta: dev strip and fixed badge still there
  ok   second device gets the saved theme on its first page (got magenta)
  ok   saving a theme left the person's name alone
  ok   / still renders the public site (data-public-site present)
  ok   /manual/pdf renders (200, application/pdf, 7977929 bytes)
  ok   manual PDF under Light is identical to the default's (7977929 vs 7977929 bytes, dates aside)
  ok   /manual has the Choosing the app's colours topic
  ok   unknown stored value: default, no attribute (got null)
  ok   cleared: default, no attribute
  ok   signed out (/login): always the default
  deleted the throwaway login

Every expectation held.
```

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch**, with what shipped and Lutan's env-marker answer. Sweep for `globals.css`, `data-theme`, `data-env`, `ZoneDot`, `palette.ts`, and the UAT marker: no other open item is closed by this work (the "header strip or badge" the item mentions exists only inside this item's own text; the UAT badge shipped earlier). Two follow-ups went to the `backlog` branch, not this PR
- [x] Non-obvious design choices added as a new file in `docs/decisions/`: `2026-10-10-user-colour-themes.md` (env-marker options and Lutan's answer, the theme set, server rendering instead of `localStorage`, zone dots, chips and accents, contrast method, PDFs)
- [x] `README.md` still accurate: the environments table and the paragraph under it now say the strip and badges are fixed colours no theme touches
- [x] **Release notes.** `unreleased` in `src/lib/releases.ts` gained a line written for a shelter user: choose how the app looks, including Light, and it follows you to every device
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** Every contrast ratio and ΔE in the decision file and commits comes from `check-theme-contrast.mjs` or the accent search behind it; "PDF unthemed" comes from a byte comparison of two real renders; "follows between devices" from a second sign-in

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: nothing here derives a date
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary** — n/a: no threshold or banding logic; the contrast thresholds are WCAG's and the checker prints the actual ratio for every pair
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.** Both script outputs above are pasted as printed
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — deferred: production release manager

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: production release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new secret or env var

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated, including what it does not cover: redeploy the previous SHA (`./scripts/pi/deploy-pi.sh --ref <sha>` on the Pi). No schema to revert. A theme someone saved stays in their `user_metadata`; the old build ignores the key, so it is harmless and they simply see the default

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | major | First alternative accent (violet `#b794ff`) was ΔE 1.9 from the Purple zone, so the active All zones chip looked like Purple chosen (found after Lutan's "don't clash with the zone chips") | fixed: magenta `#e033ff`, ΔE 15.9 |
| 2 | minor | High contrast's first accent (orange `#ffb340`) was ΔE ~9 from Orange, Yellow and Sand | fixed: lime `#b3ff1a`, ΔE 13.6 |
| 3 | major | Light theme: zone chip edges for white, yellow and sand at 1.0–1.5:1, chips read as floating text | fixed: edge darkened halfway to black in Light, worst 3.96:1 |
| 4 | major | First Magenta/violet set only the accent, so on dev it inherited dev's green surfaces, a combination never checked | fixed: every theme sets every dev-changed token; checker fails otherwise |
| 5 | minor | Default `--danger-foreground` white on `#ff453a` was 3.4:1 (offline banner) | fixed: dark text, 6+:1; public pages keep white on their darker red |
| 6 | minor | Dev only: danger on its tint 4.34:1, info 4.47:1 (pre-existing) | deferred to backlog |
| 7 | minor | Default orange ΔE 5.0 from Orange zone, dev teal 4.5 from Teal zone (pre-existing) | deferred to backlog, Lutan's call |

## Left for manual verification

No browser sign-in was possible: reading back the throwaway login's password was refused by the safety check, so nothing signed-in was looked at in a browser. Everything server-side was scripted instead (above). These need a person:

| # | What to check | Where |
|---|---|---|
| 1 | Look at every theme yourself: Dark, Light, High contrast, Magenta, on a few real pages (residents list, a resident, enclosures, maintenance board, cashflow forecast) | account menu → Colours, on Test |
| 2 | The picker: tapping a theme changes the screen at once, the tick moves, and it is still chosen after a reload and on your phone | account menu, desktop and phone |
| 3 | The account menu at 375 px and in Thai: the Colours list fits, nothing wider than before, labels not cut off | phone, ไทย |
| 4 | On Test, under Light and Magenta: the striped strip and DEV label are obvious enough that you'd never mistake it for live | `test.lannacare.org` after deploy |
| 5 | Zone dots and zone chips on Light: White and Sand zones clearly visible; All zones chip does not look like a zone; Magenta's All zones vs Purple zone | `/enclosures`, `/residents` on Light and Magenta |
| 6 | Keyboard: Tab into the Colours list shows a focus ring and arrow keys move between themes | desktop |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-10

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet; six items wait for Lutan

Manual verification by: pending: the six items under Left for manual verification

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it and summarises it
- [ ] Handed to the production release manager — n/a: handed over through the release's PR list

Result: pass

Release manager acknowledgement: n/a: not yet released
