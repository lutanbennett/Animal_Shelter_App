# The resident record page is one renderer per section

2026-10-12, stream `resident-page-split` (architecture review C5).

`src/app/residents/[id]/[section]/page.tsx` was 1,465 lines: a `switch` over ten tabs in one
server component. It is now the guard, the shared loads, the header and a map from section
name to renderer (about 210 lines); each tab lives in
`src/app/residents/[id]/[section]/sections/<section>.tsx`.

The benefit is mostly for merges. Two streams that each add or change a tab used to edit the
same 1,465-line file and conflict; now they edit different files.

## The renderer signature

```ts
render<Section>Section(ctx: SectionContext): Promise<React.ReactNode>
```

`SectionContext` (`sections/types.ts`) is what the page already had in hand: `id`, the loaded
`resident` and `residentState`, `isDeceased`, `perms`, the dictionary `t` and `locale`, the
`supabase` client, `showArchived`, and the archive helpers (`photoSelect`, `contactEmbed`,
`canArchive`, `archivedCount`, `archivedToggle`, `archivedList`). A renderer destructures only
what it uses.

## Where the guard lives

In `page.tsx`, once: the unknown-section 404, `requireFullResident(SECTION_READS[section])`,
the resident lookup and its 404. No section file checks who may open the tab; the per-row
`can(perms, …)` tests that decide which buttons show moved with the markup they gate.

## What was deliberately not touched

- **Loading.** The resident, state and permissions are loaded once by the page and handed down.
  Each section still runs exactly the queries it ran before, in the same order; none was
  merged, tidied or added.
- **Markup, props, names.** Section bodies were moved line for line (dedented), not edited.
  `Placeholder` and `RecordList` moved to `sections/shared.tsx` unchanged.
- **No abstraction over the renderers.** The map is a plain object.
- The unused `kind` parameter of `canArchive` was already there and is left alone (a lint
  warning that predates this change).

## Proof

`scripts/check-resident-sections.mjs` captures every tab as each of eight roles for five
residents (a rich record, a deceased one, an adopted one, a fostered one, one with empty
sections), plus `?archived=1` on the four tabs with an archive and one non-existent section,
on the old page and on the new, and compares them. The numbers are in the test plan.

The first version of the probe captured only `<main>`, which is the "Loading…" shell, and
reported 0 differences on pages that had not been read at all. It now keeps the whole body.
Worth knowing before reusing it: these tabs stream, so anything that compares only `<main>`
compares nothing.
