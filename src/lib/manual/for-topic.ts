import { can, type Permissions } from "@/lib/permissions/can";
import type { LevelKey } from "@/lib/permissions/catalogue";
import { isForRole } from "./filter";
import type { ManualRole, ManualTopic } from "./types";

/**
 * Whether a topic is the reader's: a topic that names an activity asks can()
 * for it; one that does not falls back to its `roles` tag, and with neither
 * it is everyone's. No permissions at all (not signed in as an app user) keeps
 * isForRole's answer for no role: everything. Apart from filter.ts because
 * scripts/acceptance-matrix.mjs loads that file directly, without the `@/` alias.
 */
export function isForTopic(topic: ManualTopic, role: ManualRole | null, perms: Permissions | null | undefined): boolean {
  if (topic.activity && perms) return can(perms, topic.activity as LevelKey, topic.activityLevel);
  return isForRole(topic.roles, role);
}
