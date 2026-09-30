# 2026-09-30 — Settings → Website: tabs, with an accordion inside Pages

- **Shipped the backlog's recommendation:** five tabs (Home page, Contact &
  settings, Pages, Gallery, Our work) and, inside Pages, one accordion row per
  information page. Accordion-only was not built as a second variant: with
  seven page editors plus the other sections it is the long page again once two
  rows are open. Lutan can still ask to see it; the accordion component is
  independent of the tabs.
- **Nothing is unmounted.** Inactive tabs are `hidden` and closed accordion rows
  stay in the DOM, so text typed in one place survives looking at another. That
  is why there is no "unsaved changes" prompt on switching tabs or rows, which
  the backlog item asked for: nothing is lost by switching, so there is nothing
  to warn about. Leaving the page still loses unsaved text, as it did before.
- **URL:** `?tab=<name>` is pushed to history when a tab is chosen; `#<slug>`
  (or `#page-<slug>`) selects Pages, opens that row and scrolls to it, on load
  and on `hashchange`. Opening a row rewrites the hash with `replaceState`.
- **Tab pattern:** built as `role="tablist"` with arrow-key navigation, as on
  the stocktake sheet, but a fresh small component (`WebsiteTabs`) because the
  stocktake tabs are wired to that sheet's own state.
- **Thai missing** means a translation row exists for the page's title or body
  and its text is blank. A page with no translation row shows no tag.
- `SitePageForm` lost its own border, heading and "View on site" link; the
  accordion row carries them.
