import type { ReactElement } from "react";
import { ROUTES, type RouteEntry } from "@/lib/permissions/routes";
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

/** One icon per page in the route registry (first entry wins for a shared path), drawn from the registry's own icon. */
export function iconCatalogue(t: Dictionary, routes: readonly RouteEntry[] = ROUTES): CatalogueIcon[] {
  const seen = new Set<string>();
  const out: CatalogueIcon[] = [];
  for (const r of routes) {
    if (seen.has(r.path)) continue;
    seen.add(r.path);
    out.push({ path: r.path, label: r.label(t), inner: iconInner(r.icon) });
  }
  return out;
}
