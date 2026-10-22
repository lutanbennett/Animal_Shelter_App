import type { ReactElement } from "react";
import { ROUTES, routeFor, routesFor, type RouteEntry } from "@/lib/permissions/routes";
import { CARDS, type CardKey } from "@/lib/permissions/cards";
import type { Permissions } from "@/lib/permissions/can";
import { OUTSIDE_REGISTRY, cardTile } from "@/lib/home/tiles";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import type { CatalogueIcon } from "./catalogue-shared";

export type { CatalogueIcon };
export { iconFileStem } from "./catalogue-shared";

type El = { type: unknown; props?: Record<string, unknown> };

const attrName = (k: string) => k.replace(/[A-Z]/g, (c) => "-" + c.toLowerCase());
const esc = (v: unknown) => String(v).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

/** The drawing inside a lucide icon's <svg>: its shapes, as markup. react-dom/server is not allowed in a page, so the element tree is walked directly. */
function shapes(node: unknown): string {
  if (Array.isArray(node)) return node.map(shapes).join("");
  const el = node as El | null;
  if (!el || typeof el !== "object" || typeof el.type !== "string") return "";
  const { children, ...attrs } = el.props ?? {};
  const a = Object.entries(attrs)
    .filter(([k, v]) => k !== "key" && v != null)
    .map(([k, v]) => ` ${attrName(k)}="${esc(v)}"`)
    .join("");
  return `<${el.type}${a}/>` + shapes(children);
}

/** Calls a lucide forwardRef icon for its element. This lucide version hands its shapes over as props.icon.node ([tag, attrs] pairs). */
function iconInner(icon: RouteEntry["icon"]): string {
  const render = (icon as unknown as { render?: (p: object, r: null) => ReactElement }).render;
  const root = (render ? render({}, null) : (icon as unknown as (p: object) => ReactElement)({})) as unknown as El;
  const node = (root.props as { icon?: { node?: [string, Record<string, unknown>][] } } | undefined)?.icon?.node;
  if (node) return node.map(([tag, attrs]) => shapes({ type: tag, props: attrs })).join("");
  return shapes((root.props as { children?: unknown } | undefined)?.children);
}

type Page = { path: string; label: string; icon: RouteEntry["icon"] };

function toIcons(pages: Iterable<Page>): CatalogueIcon[] {
  const seen = new Set<string>();
  const out: CatalogueIcon[] = [];
  for (const p of pages) {
    if (seen.has(p.path)) continue;
    seen.add(p.path);
    out.push({ path: p.path, label: p.label, inner: iconInner(p.icon) });
  }
  return out;
}

/** Every page a card opens, with the card's own label and the icon its tile uses (outside-registry pages included). */
function cardPages(t: Dictionary): Page[] {
  return Object.values(CARDS).flatMap((card) =>
    [card.opens, card.opensAny ?? card.opens].flatMap((path) => {
      const icon = (OUTSIDE_REGISTRY as Partial<typeof OUTSIDE_REGISTRY>)[path]?.icon ?? routeFor(path)?.icon;
      return icon ? [{ path, label: card.label(t), icon }] : [];
    }),
  );
}

/**
 * One icon per page: the route registry first (first entry wins for a shared path, so file names already in the
 * shared Drive folder stay put), then every page a card opens that the registry does not hold (Bills, Residents,
 * Assistant, My tasks), so every tile on a home has an icon. Pass a viewer's permissions to keep only the pages
 * they can open; pass none for the full set (the Drive sync).
 */
export function iconCatalogue(t: Dictionary, perms?: Permissions): CatalogueIcon[] {
  const registry: Page[] = (perms ? routesFor(perms) : ROUTES).map((r) => ({ path: r.path, label: r.label(t), icon: r.icon }));
  const cards = perms ? Object.keys(CARDS).flatMap((key) => cardTile(key as CardKey, perms, t) ?? []).map((x) => ({ path: x.href, label: x.label, icon: x.icon })) : cardPages(t);
  return toIcons([...registry, ...cards]);
}
