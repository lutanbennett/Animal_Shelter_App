// What the menu-coverage script is TOLD, because reachability is declared and not discovered
// (docs/decisions/2026-10-14-menu-coverage-is-declared.md). Every entry names the file that makes the link true and
// a string that file must contain; the script re-checks that on every run and IGNORES an entry whose proof is gone,
// so a link someone removed turns back into an orphan instead of staying "covered" on paper.

/** Always-present screens that are not the left menu: the header and the account menu. */
export const CHROME = [
  { page: "/home", file: "src/app/AppHeader.tsx", needle: 'href="/"', what: "the logo in the header" },
  { page: "/account/password", file: "src/app/AccountMenu.tsx", needle: 'href="/account/password"', what: "the account menu" },
  // Drawn only for a login that holds assistant.ask (AppHeader); the script applies that test.
  { page: "/assistant", file: "src/components/assistant/AssistantPanel.tsx", needle: 'href="/assistant"', what: "the Assistant button's slide-over", needs: "assistant.ask" },
];

/** Landing pages whose tiles are read out of their own source (every `href: "/x"`), so a tile added there counts. */
export const LANDINGS = ["/operations", "/management", "/admin"];

/** Pages reached by drilling in from a parent. `page` is a pattern, not a route; it is covered when `parent` is. */
export const DEEP = [
  { page: "/residents/[id]", parent: "/residents", file: "src/app/residents/ResidentsTable.tsx", needle: "/residents/" },
  { page: "/residents/new", parent: "/residents", file: "src/app/residents/page.tsx", needle: "/residents/new", needs: "resident.register" },
  { page: "/residents/[id]", parent: "/appointments", file: "src/app/appointments/page.tsx", needle: "/residents/" },
  { page: "/projects/[id]", parent: "/projects", file: "src/app/projects/FolderGrid.tsx", needle: "/projects/" },
  { page: "/outreach/new", parent: "/outreach", file: "src/app/outreach/page.tsx", needle: "/outreach/new", needs: "community.outings", level: "edit" },
  { page: "/outreach/[id]", parent: "/outreach", file: "src/app/outreach/page.tsx", needle: "/outreach/" },
  { page: "/clinics/[id]", parent: "/clinics", file: "src/app/clinics/page.tsx", needle: "/clinics/" },
  { page: "/contacts/[id]", parent: "/contacts", file: "src/app/contacts/page.tsx", needle: "/contacts/" },
  { page: "/enclosures/[id]", parent: "/enclosures", file: "src/app/enclosures/page.tsx", needle: "/enclosures/" },
];

/**
 * Orphans someone has looked at and accepted. EMPTY ON PURPOSE: the accepting is Lutan's, with a reason, in the PR
 * that removes the menu. Shape: { role: "2ic" | "*", page: "/manual", reason: "...", acceptedBy: "Lutan", date: "2026-10-.." }.
 * An entry with no reason or no acceptedBy is ignored.
 */
export const ACCEPTED = [];
