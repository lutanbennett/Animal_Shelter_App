import { can, type Permissions } from "@/lib/permissions/can";

/**
 * What an invoice is for. The CATALOGUE of kinds is data (bill_kinds, 0305): a kind is added in Bills settings
 * without a deploy. What a kind ASKS FOR on the form is code, keyed by `bill_kinds.key`, and is the table below.
 * A kind the table does not know (one added in settings) gets the plain form and is filed as a general bill:
 * the unrecognised value is widened to the plain case, never narrowed to a named kind (docs/decisions/2026-11-03-bills-interface-half.md).
 * Pure and client-safe.
 */
export type BillKind = { id: string; key: string; label: string; parentId: string | null; sort: number; archived: boolean };

/** Where a card of this kind is filed. Each route is one activity, the one its own action and the database ask. */
export type KindRoute = "visit" | "delivery" | "job" | "utility" | "general";

export type KindTailoring = { route: KindRoute; premises: boolean; account: boolean };

/** Every field a kind implies is optional (Answer B): Other, and anything unknown, is the plain form. */
const PLAIN: KindTailoring = { route: "general", premises: false, account: false };

const KNOWN: Record<string, KindTailoring> = {
  vet_appointment: { route: "visit", premises: false, account: false },
  food: { route: "delivery", premises: false, account: false },
  medicine: { route: "delivery", premises: false, account: false },
  maintenance: { route: "job", premises: true, account: true },
  materials: { route: "general", premises: true, account: true },
  cleaning_products: { route: "general", premises: true, account: true },
  utilities: { route: "utility", premises: true, account: true },
  other: PLAIN,
};

/** The tailoring of a kind: its own key's, else its nearest known ancestor's (a utility type under Utilities), else plain. */
export function tailoringOf(kind: BillKind, all: readonly BillKind[]): KindTailoring {
  let k: BillKind | undefined = kind;
  for (let i = 0; k && i < 5; i++) {
    const known = KNOWN[k.key];
    if (known) return known;
    const parent: string | null = k.parentId;
    k = parent ? all.find((x) => x.id === parent) : undefined;
  }
  return PLAIN;
}

/** Whether this login may file a card of this route: the question the route's own action asks. */
export function mayFileRoute(perms: Permissions | null | undefined, route: KindRoute): boolean {
  switch (route) {
    case "visit":
      return can(perms, "medical.visits", "edit");
    case "delivery":
      return can(perms, "stock.delivery");
    case "job":
      return can(perms, "maintenance.bills");
    case "utility":
      return can(perms, "bills.utilities");
    case "general":
      return can(perms, "bills.general");
  }
}

/**
 * The kinds this login may choose, derived from its cards like photoCategoriesFor(): a kind is offered only when the
 * login holds the activity of the place that kind is filed. Archived kinds are not offered.
 */
export function kindsFor(perms: Permissions | null | undefined, all: readonly BillKind[]): BillKind[] {
  return all.filter((k) => !k.archived && mayFileRoute(perms, tailoringOf(k, all).route));
}

/** A kind's key is made once, from its first label, and never changes: the form it asks for is code keyed by it. */
export function keyFromLabel(label: string): string {
  const slug = label
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  if (!slug) return "kind";
  return /^[a-z]/.test(slug) ? slug.slice(0, 40) : `kind_${slug.slice(0, 35)}`;
}
