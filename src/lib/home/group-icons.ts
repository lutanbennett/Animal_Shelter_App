import { BriefcaseBusiness, ClipboardList, FolderOpen, HeartPulse, Home, PawPrint, Users, Wrench, type LucideIcon } from "lucide-react";

/**
 * The icons a group on a role's home may wear (role_groups.icon, 0241). The table stores a key, never an icon name
 * from the library, so this list is the whole choice Admin is offered on Who does what. Operations and Management are
 * the icons the left menu gives those two sections, so a seeded group looks like the section it stands for.
 * A key this list does not know (a row written by hand) draws the folder rather than nothing.
 */
export const GROUP_ICONS = {
  operations: ClipboardList,
  management: BriefcaseBusiness,
  folder: FolderOpen,
  animals: PawPrint,
  medical: HeartPulse,
  people: Users,
  repairs: Wrench,
  shelter: Home,
} as const satisfies Record<string, LucideIcon>;

export type GroupIconKey = keyof typeof GROUP_ICONS;

export const GROUP_ICON_KEYS = Object.keys(GROUP_ICONS) as GroupIconKey[];

export const isGroupIconKey = (k: unknown): k is GroupIconKey => typeof k === "string" && k in GROUP_ICONS;

export const groupIcon = (k: string): LucideIcon => (isGroupIconKey(k) ? GROUP_ICONS[k] : FolderOpen);
