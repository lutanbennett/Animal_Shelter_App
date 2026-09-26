"use server";

import { refresh, revalidatePath } from "next/cache";
import type { AuthError } from "@supabase/supabase-js";
import {
  runAction,
  unexpectedFailure,
  type ActionRefusal,
  type ActionResult,
} from "@/lib/action-result";
import { hasAdminRole } from "@/lib/auth/require-admin";
import { MUST_CHANGE_PASSWORD } from "@/lib/auth/password-change";
import { generateTemporaryPassword } from "@/lib/auth/temp-password";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";

/*
 * Every action here returns an ActionResult rather than throwing: a throw
 * from a server action reaches the browser as "Minified React error #441"
 * in production, which is what the Security page showed for a refused
 * delete (src/lib/action-result.ts). Known refusals get their own words;
 * anything else is logged with a reference and reported as such.
 */

/**
 * A server action called from a button doesn't refresh the client router
 * on its own (a <form action> does); refresh() re-renders the page the
 * admin is on so the row shows the change at once.
 */
function revalidateSecurity() {
  revalidatePath("/admin/security");
  refresh();
}

type T = Awaited<ReturnType<typeof getT>>["t"];

const refuse = (error: string): ActionRefusal => ({ ok: false, error });

/** Admin only — the same check assertAdminRole() makes, returned instead of thrown. */
async function refuseUnlessAdmin(t: T): Promise<ActionRefusal | null> {
  return (await hasAdminRole()) ? null : refuse(t.admin.security.errors.adminAccessRequired);
}

async function isCurrentUser(userId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id === userId;
}

/** GoTrue's answer for a login that has already gone. */
function isUserNotFound(error: AuthError) {
  return error.code === "user_not_found" || error.status === 404;
}

export type CreateUserState =
  | ActionResult<{ success: string; temporaryPassword: string; email: string }>
  | undefined;

/** The staff roles, plus public_viewer: a login that sees only the public website (0085). */
const VALID_ROLES = ["admin", "management", "staff", "vet", "volunteer", "public_viewer"] as const;

const isValidRole = (role: string | null) =>
  !!role && VALID_ROLES.includes(role as (typeof VALID_ROLES)[number]);

/**
 * Creates a login with a generated temporary password and the
 * must-change flag set (src/lib/auth/password-change.ts). The password is
 * returned once, for the admin to pass on; it is never stored in clear or
 * shown again — issuing a new one is the only recovery. A Google-only
 * user simply never uses it.
 */
export async function createUser(
  _state: CreateUserState,
  formData: FormData,
): Promise<CreateUserState> {
  const { t } = await getT();
  const e = t.admin.security.errors;
  return runAction("security.createUser", t.common.somethingWentWrong, async () => {
    const denied = await refuseUnlessAdmin(t);
    if (denied) return denied;

    const email = (formData.get("email") as string | null)?.trim();
    const role = formData.get("role") as string | null;

    if (!email) return refuse(e.emailRequired);
    if (!isValidRole(role)) return refuse(e.selectValidRole);

    const temporaryPassword = generateTemporaryPassword();
    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: temporaryPassword,
      email_confirm: true,
      app_metadata: { [MUST_CHANGE_PASSWORD]: true },
    });

    if (error) {
      if (error.code === "email_exists") return refuse(e.emailTaken);
      if (error.code === "email_address_invalid" || error.code === "validation_failed") {
        return refuse(e.emailInvalid);
      }
      return unexpectedFailure("security.createUser", error, t.common.somethingWentWrong);
    }

    const { error: roleError } = await admin
      .from("user_roles")
      .insert({ user_id: data.user.id, role });

    if (roleError) {
      // Don't leave an orphaned login with no role if this half fails.
      await admin.auth.admin.deleteUser(data.user.id);
      return unexpectedFailure("security.createUser", roleError, t.common.somethingWentWrong);
    }

    revalidatePath("/admin/security");
    return {
      ok: true,
      success: t.admin.security.createdUser(email, role!),
      temporaryPassword,
      email,
    };
  });
}

/**
 * Grants a role to an account that has none — the "approve" on the access
 * request queue. Same write as changing a role; kept separate so the
 * queue reads as what it is. The person signs in again and gets through.
 */
export async function approveAccessRequest(userId: string, role: string): Promise<ActionResult> {
  const { t } = await getT();
  return runAction("security.approveAccessRequest", t.common.somethingWentWrong, async () => {
    const denied = await refuseUnlessAdmin(t);
    if (denied) return denied;
    if (!isValidRole(role)) return refuse(t.admin.security.errors.invalidRole);

    const admin = createAdminClient();
    const { error } = await admin.from("user_roles").upsert({ user_id: userId, role });
    if (error) {
      return unexpectedFailure("security.approveAccessRequest", error, t.common.somethingWentWrong);
    }
    revalidateSecurity();
    return { ok: true };
  });
}

export async function updateUserRole(userId: string, role: string): Promise<ActionResult> {
  const { t } = await getT();
  return runAction("security.updateUserRole", t.common.somethingWentWrong, async () => {
    const denied = await refuseUnlessAdmin(t);
    if (denied) return denied;
    if (!isValidRole(role)) return refuse(t.admin.security.errors.invalidRole);
    if (await isCurrentUser(userId)) return refuse(t.admin.security.errors.cantChangeOwnRole);

    const admin = createAdminClient();
    const { error } = await admin.from("user_roles").upsert({ user_id: userId, role });
    if (error) {
      return unexpectedFailure("security.updateUserRole", error, t.common.somethingWentWrong);
    }
    revalidateSecurity();
    return { ok: true };
  });
}

/**
 * The admin's "reset password": a fresh temporary password, returned once,
 * and the must-change flag set again so the person picks their own at the
 * next sign-in. An admin can't issue one for themselves — they change
 * their own password at /account/password like anyone else.
 */
export async function issueTemporaryPassword(
  userId: string,
): Promise<ActionResult<{ temporaryPassword: string }>> {
  const { t } = await getT();
  const e = t.admin.security.errors;
  return runAction("security.issueTemporaryPassword", t.common.somethingWentWrong, async () => {
    const denied = await refuseUnlessAdmin(t);
    if (denied) return denied;
    if (await isCurrentUser(userId)) return refuse(e.cantResetOwnPassword);

    const temporaryPassword = generateTemporaryPassword();
    const admin = createAdminClient();
    const { data: existing, error: lookupError } = await admin.auth.admin.getUserById(userId);
    if (lookupError) {
      if (isUserNotFound(lookupError)) return refuse(e.userNotFound);
      return unexpectedFailure("security.issueTemporaryPassword", lookupError, t.common.somethingWentWrong);
    }

    const { error } = await admin.auth.admin.updateUserById(userId, {
      password: temporaryPassword,
      app_metadata: { ...existing.user.app_metadata, [MUST_CHANGE_PASSWORD]: true },
    });
    if (error) {
      return unexpectedFailure("security.issueTemporaryPassword", error, t.common.somethingWentWrong);
    }

    revalidateSecurity();
    return { ok: true, temporaryPassword };
  });
}

/**
 * Marks a login as having left (0063): they keep their row, their role
 * and their name on past maintenance jobs, but current_user_role()
 * returns null for them so nothing lets them in, and the assignee picker
 * stops offering them. Reversible with restoreUser().
 */
export async function archiveUser(userId: string): Promise<ActionResult> {
  const { t } = await getT();
  return runAction("security.archiveUser", t.common.somethingWentWrong, async () => {
    const denied = await refuseUnlessAdmin(t);
    if (denied) return denied;
    if (await isCurrentUser(userId)) return refuse(t.admin.security.errors.cantArchiveOwnAccount);

    const admin = createAdminClient();
    const { error } = await admin
      .from("user_roles")
      .update({ archived_at: new Date().toISOString() })
      .eq("user_id", userId);
    if (error) {
      return unexpectedFailure("security.archiveUser", error, t.common.somethingWentWrong);
    }
    revalidateSecurity();
    return { ok: true };
  });
}

export async function restoreUser(userId: string): Promise<ActionResult> {
  const { t } = await getT();
  return runAction("security.restoreUser", t.common.somethingWentWrong, async () => {
    const denied = await refuseUnlessAdmin(t);
    if (denied) return denied;

    const admin = createAdminClient();
    const { error } = await admin
      .from("user_roles")
      .update({ archived_at: null })
      .eq("user_id", userId);
    if (error) {
      return unexpectedFailure("security.restoreUser", error, t.common.somethingWentWrong);
    }
    revalidateSecurity();
    return { ok: true };
  });
}

/**
 * Removes a login outright. Meant for accounts with no history — a typo,
 * a test login, a stranger on the access request queue. Someone who
 * recorded anything can't go: about twenty foreign keys to auth.users
 * (created_by, uploaded_by, updated_by, …) have no delete rule, on
 * purpose, because who recorded what is the history. The database refuses
 * and GoTrue reports it only as "Database error deleting user", which is
 * what that answer means here; the refusal points to Archive instead
 * (docs/decisions.md, 2026-09-26).
 */
export async function deleteUser(userId: string): Promise<ActionResult> {
  const { t } = await getT();
  const e = t.admin.security.errors;
  return runAction("security.deleteUser", t.common.somethingWentWrong, async () => {
    const denied = await refuseUnlessAdmin(t);
    if (denied) return denied;
    if (await isCurrentUser(userId)) return refuse(e.cantDeleteOwnAccount);

    const admin = createAdminClient();
    const { error } = await admin.auth.admin.deleteUser(userId);
    if (error) {
      if (isUserNotFound(error)) return refuse(e.userNotFound);
      if (/database error deleting user/i.test(error.message)) {
        // Still logged: the raw cause is worth having if it ever isn't a
        // foreign key.
        console.error("[security.deleteUser] refused by the database:", error);
        return refuse(e.hasRecords);
      }
      return unexpectedFailure("security.deleteUser", error, t.common.somethingWentWrong);
    }
    revalidateSecurity();
    return { ok: true };
  });
}
