# Website page editor: read-only fields for a login without website.content

**Found:** #1136 added `canEdit` to `SitePageForm` but it gated only Save. The item's "one prop" was already
done; the style toolbar, body box and title box were still drawn live to a read-level login
(`website_photos` holds `website.content` at read).

**Decided (deliverable 2): read-only fields, not "no editor".** Title and body keep showing the current
wording (`readOnly={!canEdit}`), so a reader can still read the page; the style toolbar and its hint are not
drawn. No new string needed. The preview and both translation panels are reads and are unchanged. Gate is
`canEdit` = `can(perms,"website.content")` (`pages/[slug]/page.tsx:33`), the same activity `updateSitePage`
asks (`actions.ts`, asserted by the existing test). Default stays false.

## UnitsTable.tsx control list (the list part (b) owed)

All four controls ask one test: `canEditItemSettings(diet) || canEditItemSettings(medication)`
(`units/actions.ts` `refusal()`), which `units/page.tsx:18` applies to the whole page (others get `refuseFor`).
The table is only ever rendered to a login that passes it, so no per-control gate is needed.

| Control | Action | Activity asked |
|---|---|---|
| Edit | local state only | n/a (opens fields; Save is the write) |
| Save | `updateUnit` | `refusal()` as above |
| Cancel | local state only | n/a |
| Archive / Restore | `setUnitArchived` | `refusal()` as above |

(`createUnit` in `CreateUnitForm.tsx` asks the same.) **No gap.**

## Could and could not be driven
The editor loads only by typed address, which the browser pane does not hydrate (CLAUDE.md), so the read-only
state is established by reading the file and the test, not by driving.
