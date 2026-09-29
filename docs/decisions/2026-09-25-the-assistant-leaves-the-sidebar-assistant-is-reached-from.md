# 2026-09-25 — The Assistant leaves the sidebar; `/assistant` is reached from the slide-over

- **The route stays, and the header panel links to it.** The sidebar entry
  duplicated the header's Assistant button, but it was also the only link to
  the full page. Lutan chose to keep the page and add an "Open full page" link
  under the panel's title, over two alternatives. One was to leave it as a
  URL-only deep link, which is cheap, but a page nobody can find stops being
  checked. The other was to retire the route. That is the cleanest option, but
  `src/app/assistant/` also holds the server actions the panel calls
  (`actions.ts`, `lookups.ts`), and nobody had checked whether the page does
  anything the panel cannot. So a later retirement has to keep that folder's
  actions, not just delete it.
- **The link is text, not an icon.** It is the only way to the page now, and a
  bare expand icon beside the close button is easy to miss. It is hidden on
  `/assistant` itself, where it would lead nowhere. It also closes the panel:
  the header is in the layout, so the panel does not unmount on navigation and
  would otherwise stay open over the page it just opened.
- **Access is unchanged, because the link lives inside the panel.** The header
  renders the panel only when `canUseAssistant(role)`, so the link cannot show
  for a role without the assistant. The page does its own `canUseAssistant`
  check on the server. Contrary to the backlog item, the old sidebar entry was
  *not* gated: every signed-in role saw it, including vet, who got the page's
  "can't use the assistant" message. Removing it removes that dead end too.
- **`t.nav.assistant` and `NAV_ICONS.assistant` are gone.** Nothing else used
  them. The panel keeps its own `t.assistant.panel.*` strings and imports
  `MessagesSquare` directly.
