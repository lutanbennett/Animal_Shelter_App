import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ROUTES, type RouteEntry } from "@/lib/permissions/routes";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { iconInner } from "./svg";
import type { CatalogueIcon } from "./catalogue-shared";

export type { CatalogueIcon };
export { iconFileStem } from "./catalogue-shared";

/** One icon per page in the route registry (first entry wins for a shared path), drawn from the registry's own icon. */
export function iconCatalogue(t: Dictionary, routes: readonly RouteEntry[] = ROUTES): CatalogueIcon[] {
  const seen = new Set<string>();
  const out: CatalogueIcon[] = [];
  for (const r of routes) {
    if (seen.has(r.path)) continue;
    seen.add(r.path);
    out.push({ path: r.path, label: r.label(t), inner: iconInner(renderToStaticMarkup(createElement(r.icon))) });
  }
  return out;
}
