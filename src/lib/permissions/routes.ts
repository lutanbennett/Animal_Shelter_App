/**
 * The route registry: every page a person can open because they hold an
 * activity, once. Path, activity, level, icon, label, device. The page's own
 * guard (requirePermission) names the same activity, and
 * check-permission-catalogue.mjs fails when a page and its entry disagree.
 *
 * It is data, not only a guard list. The menu, the home screens, a hub's
 * buttons and the recurring-job "who can do this" rule read it, so a role's
 * page set is derived from its cells (`routesFor`) instead of written out
 * per role (§8). Adding a page is one entry here plus the guard on the page.
 *
 * Pure and client-safe. Only stock is registered so far; the sweeps add the
 * rest, and Settings and Management landing pages with their areas.
 */

import { Activity, Camera, ClipboardCheck, Coins, Globe, HeartHandshake, History, LayoutDashboard, Languages, Pill, Scale, ShoppingCart, Truck, Utensils, type LucideIcon } from "lucide-react";
import { CONTACT_ICONS, ENCLOSURE_ICONS, NAV_ICONS, SECTION_ICONS, VET_ICONS } from "@/components/hub-icons";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { can, type Permissions } from "./can";
import type { ActivityKey, Level, LevelKey } from "./catalogue";

export type RouteEntry = {
  /** The path as a person types it, no trailing slash. A page under it inherits nothing: list each page. */
  path: string;
  activity: ActivityKey;
  /** The level the page needs to open. Omit for a yes/no activity. */
  level?: Level;
  /**
   * The level a recurring job that links here needs, when it is higher than the one that opens the
   * page: the maintenance board opens at Read, but doing its work is Edit. Omit when they are the same.
   */
  jobLevel?: Level;
  icon: LucideIcon;
  /** The person's own words for it, from the dictionary. */
  label: (t: Dictionary) => string;
  /** "phone" and "desk" are two pages over one action (§8); "any" is one page for both. */
  device: "any" | "phone" | "desk";
  /** Listed in the sidebar. False is still guarded and reachable; a home tile may show it. */
  menu: boolean;
  /**
   * A scope the page also requires, beside the activity: shelter staff may hold the activity and
   * still be refused (a vet's appointments). canOpen() honours it, so routesFor() never offers a
   * tile the page would refuse. Only the clinical scope has a page gated by it today.
   */
  scope?: { clinical: "own_clinic" | "any" };
};

export const ROUTES: readonly RouteEntry[] = [
  {
    path: "/appointments",
    activity: "medical.visits",
    level: "read",
    icon: NAV_ICONS.appointments,
    label: (t) => t.nav.appointments,
    device: "any",
    menu: false,
    scope: { clinical: "own_clinic" },
  },
  {
    path: "/stocktake",
    activity: "stock.count",
    icon: ClipboardCheck,
    label: (t) => t.nav.stocktake,
    device: "any",
    menu: true,
  },
  {
    path: "/deliveries",
    activity: "stock.delivery",
    icon: Truck,
    label: (t) => t.deliveries.title,
    device: "any",
    menu: true,
  },
  {
    path: "/management/purchasing",
    activity: "stock.purchasing",
    icon: ShoppingCart,
    label: (t) => t.management.purchasing.title,
    // Steps on a phone, the table from md up: one page, two layouts (§13).
    device: "any",
    menu: false,
  },
  {
    path: "/maintenance",
    activity: "maintenance.jobs",
    level: "read",
    jobLevel: "edit",
    icon: NAV_ICONS.maintenance,
    label: (t) => t.nav.maintenance,
    device: "any",
    menu: true,
  },
  {
    path: "/projects",
    activity: "projects.folders",
    level: "read",
    icon: NAV_ICONS.projects,
    label: (t) => t.nav.projects,
    device: "any",
    menu: true,
  },
  {
    path: "/contacts",
    activity: "contacts.directory",
    level: "read",
    icon: NAV_ICONS.contacts,
    label: (t) => t.nav.contacts,
    device: "any",
    menu: true,
  },
  {
    path: "/vets",
    activity: "clinics.list",
    level: "read",
    icon: NAV_ICONS.vets,
    label: (t) => t.nav.vets,
    device: "any",
    menu: true,
  },
  {
    path: "/enclosures",
    activity: "facility.enclosures",
    level: "read",
    icon: NAV_ICONS.enclosures,
    label: (t) => t.nav.enclosures,
    device: "any",
    menu: true,
  },
  {
    path: "/management/dashboard",
    activity: "reports.dashboard",
    icon: LayoutDashboard,
    label: (t) => t.nav.dashboard,
    device: "any",
    menu: false,
  },
  {
    path: "/management/contacts",
    activity: "contacts.directory",
    icon: CONTACT_ICONS.contact,
    label: (t) => t.nav.contacts,
    device: "any",
    menu: false,
  },
  {
    path: "/management/shelter-friends",
    activity: "friends.manage",
    icon: HeartHandshake,
    label: (t) => t.nav.shelterFriends,
    device: "any",
    menu: false,
  },
  {
    path: "/management/vets",
    activity: "clinics.list",
    icon: VET_ICONS.vet,
    label: (t) => t.nav.vets,
    device: "any",
    menu: false,
  },
  {
    path: "/management/medication-list",
    activity: "medical.prescriptions",
    level: "read",
    icon: Pill,
    label: (t) => t.nav.medicationList,
    device: "any",
    menu: false,
    // A vet holds the cell but reads only its own clinic's residents, which the list's views do
    // not carry (sees_all_clinical(), 0136): the page would open empty, so it is not offered.
    scope: { clinical: "any" },
  },
  {
    path: "/medical/weight",
    activity: "medical.weight",
    icon: Scale,
    label: (t) => t.appHome.jobs.recordWeight,
    device: "any",
    menu: false,
    // A phone page for the Head of Medical, who cannot open /residents/...: it reads who-and-where.
    // A vet holds the cell but would find an empty picker (sees_all_clinical(), 0135).
    scope: { clinical: "any" },
  },
  {
    path: "/medical/photos",
    activity: "photos.resident_add",
    icon: Camera,
    label: (t) => t.appHome.jobs.addMedicalPhotos,
    device: "any",
    menu: false,
    // Reads who-and-where and medical_photo_residents, both for a login that sees every clinic.
    scope: { clinical: "any" },
  },
  {
    path: "/medical/diets",
    activity: "medical.diet",
    level: "read",
    icon: Utensils,
    label: (t) => t.appHome.jobs.feedSpecialDiets,
    device: "any",
    menu: false,
    // special_diet_list rows are for a login that sees every clinic (sees_all_clinical(), 0140).
    scope: { clinical: "any" },
  },
  {
    path: "/management/medications",
    activity: "stock.medications",
    icon: SECTION_ICONS.prescriptions,
    label: (t) => t.nav.medications,
    device: "any",
    menu: false,
  },
  {
    path: "/management/diets",
    activity: "stock.diets",
    icon: SECTION_ICONS.diet,
    label: (t) => t.nav.diets,
    device: "any",
    menu: false,
  },
  {
    path: "/management/recurring-jobs",
    activity: "recurring.manage",
    icon: NAV_ICONS.recurringJobs,
    label: (t) => t.nav.recurringJobs,
    device: "any",
    menu: false,
  },
  {
    path: "/management/stock-usage",
    activity: "stock.usage",
    icon: Scale,
    label: (t) => t.nav.stockUsage,
    device: "any",
    menu: false,
  },
  {
    path: "/management/cashflow",
    activity: "reports.cashflow",
    icon: Coins,
    label: (t) => t.nav.cashflow,
    device: "any",
    menu: false,
  },
  {
    path: "/management/translations",
    activity: "translations.manage",
    icon: Languages,
    label: (t) => t.nav.translations,
    device: "any",
    menu: false,
  },
  {
    path: "/admin/website",
    activity: "website.content",
    icon: Globe,
    label: (t) => t.nav.website,
    device: "any",
    menu: false,
  },
  {
    path: "/admin/enclosures",
    activity: "facility.enclosures",
    icon: ENCLOSURE_ICONS.enclosure,
    label: (t) => t.nav.enclosures,
    device: "any",
    menu: false,
  },
  {
    path: "/admin/zones",
    activity: "facility.enclosures",
    icon: ENCLOSURE_ICONS.zone,
    label: (t) => t.nav.zones,
    device: "any",
    menu: false,
  },
  {
    path: "/admin/facility-map",
    activity: "facility.enclosures",
    icon: ENCLOSURE_ICONS.map,
    label: (t) => t.nav.facilityMap,
    device: "any",
    menu: false,
  },
  {
    path: "/admin/immunization-types",
    activity: "reference.types",
    icon: SECTION_ICONS.immunizations,
    label: (t) => t.nav.immunizationTypes,
    device: "any",
    menu: false,
  },
  {
    path: "/admin/procedure-types",
    activity: "reference.types",
    icon: SECTION_ICONS.procedures,
    label: (t) => t.nav.procedureTypes,
    device: "any",
    menu: false,
  },
  {
    path: "/admin/blood-test-types",
    activity: "reference.types",
    icon: SECTION_ICONS["blood-tests"],
    label: (t) => t.nav.bloodTestTypes,
    device: "any",
    menu: false,
  },
  {
    path: "/admin/frequencies",
    activity: "reference.types",
    icon: SECTION_ICONS.prescriptions,
    label: (t) => t.nav.frequencies,
    device: "any",
    menu: false,
  },
  {
    path: "/admin/recent-changes",
    activity: "audit.view",
    icon: History,
    label: (t) => t.nav.recentChanges,
    device: "any",
    menu: false,
  },
  {
    path: "/admin/status",
    activity: "system.status",
    icon: Activity,
    label: (t) => t.nav.systemStatus,
    device: "any",
    menu: false,
  },
];

/** Whether `perms` opens this entry. */
export function canOpen(perms: Permissions | null | undefined, route: RouteEntry): boolean {
  if (route.scope && perms?.scopes.clinical !== route.scope.clinical) return false;
  return can(perms, route.activity as LevelKey, route.level);
}

/** The entries this person may open, in registry order; the caller groups and sorts. */
export function routesFor(perms: Permissions | null | undefined): readonly RouteEntry[] {
  return ROUTES.filter((r) => canOpen(perms, r));
}

/** The entry for a path (exact), or undefined. */
export function routeFor(path: string): RouteEntry | undefined {
  return ROUTES.find((r) => r.path === path);
}
