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
import {
  APPROVED_FACTOR,
  SETUP_OPEN_UNTIL,
  hasTwoStep,
  isVerifiedTotp,
  setupWindowEnd,
  trustedTotpFactors,
} from "@/lib/auth/two-step";
import { MUST_CHANGE_PASSWORD } from "@/lib/auth/password-change";
import { generateTemporaryPassword } from "@/lib/auth/temp-password";
import { forgetWaitingAccessRequests } from "@/lib/status/access-requests";
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
  // Approving, creating or deleting a login changes who is waiting; the
  // status card and the admins' My tasks row shouldn't lag a minute behind.
  forgetWaitingAccessRequests();
  revalidatePath("/admin/security");
  refresh();
}

/**
 * Giving someone the admin role is an admin vouching for them, so it opens
 * their first authenticator set-up (src/lib/auth/two-step.ts): they can
 * enrol on their next visit to Security, and nobody holding only a password
 * can before then. Best effort — the role is already granted, and Allow
 * set-up does the same later.
 */
async function openSetupForNewAdmin(userId: string, role: string) {
  if (role !== "admin") return;
  const { error } = await createAdminClient().auth.admin.updateUserById(userId, {
    app_metadata: { [SETUP_OPEN_UNTIL]: setupWindowEnd() },
  });
  if (error) console.error("[security.openSetupForNewAdmin]", error);
}

type T = Awaited<ReturnType<typeof getT>>["t"];

const refuse = (error: string): ActionRefusal => ({ ok: false, error });

/**
 * Admin only, and only from a session that has passed the authenticator-app
 * step (src/lib/auth/two-step.ts). Every action here writes with the
 * service role, which bypasses RLS, so 0100's aal2 policies on user_roles
 * never see these writes — this check is the enforcement, not the page's
 * redirect: an action can be called without the page ever rendering.
 */
async function refuseUnlessAdmin(t: T): Promise<ActionRefusal | null> {
  if (!(await hasAdminRole())) return refuse(t.admin.security.errors.adminAccessRequired);
  if (!(await hasTwoStep())) return refuse(t.admin.security.errors.twoStepRequired);
  return null;
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
      app_metadata: {
        [MUST_CHANGE_PASSWORD]: true,
        ...(role === "admin" ? { [SETUP_OPEN_UNTIL]: setupWindowEnd() } : {}),
      },
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
    await openSetupForNewAdmin(userId, role);
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
    await openSetupForNewAdmin(userId, role);
    revalidateSecurity();
    return { ok: true };
  });
}

/**
 * Which clinic a vet account belongs to (user_roles.vet_id, 0102), or none.
 * The vet-visit forms offer that clinic only, and refuse a vet account with
 * none set (src/lib/vets/scope.ts). The database refuses a clinic on any
 * other role (user_roles_vet_id_only_for_vets), and the update is filtered
 * to vet rows so that refusal is never the answer an admin sees.
 */
export async function updateVetClinic(userId: string, vetId: string | null): Promise<ActionResult> {
  const { t } = await getT();
  const e = t.admin.security.errors;
  return runAction("security.updateVetClinic", t.common.somethingWentWrong, async () => {
    const denied = await refuseUnlessAdmin(t);
    if (denied) return denied;

    const admin = createAdminClient();
    if (vetId) {
      const { data: vet, error: vetError } = await admin
        .from("vets")
        .select("id")
        .eq("id", vetId)
        .maybeSingle();
      if (vetError) {
        return unexpectedFailure("security.updateVetClinic", vetError, t.common.somethingWentWrong);
      }
      if (!vet) return refuse(e.clinicNotFound);
    }

    const { data, error } = await admin
      .from("user_roles")
      .update({ vet_id: vetId })
      .eq("user_id", userId)
      .eq("role", "vet")
      .select("user_id");
    if (error) {
      return unexpectedFailure("security.updateVetClinic", error, t.common.somethingWentWrong);
    }
    if (!data?.length) return refuse(e.clinicOnlyForVets);
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

/**
 * Removes a login's authenticator app, for a lost or replaced phone: the
 * next time they open Security they set one up again. Done by another
 * admin who has passed 2-step — or by yourself, to move to a new phone
 * while the old one still works. The last resort, with no admin able to
 * pass 2-step, is `scripts/bootstrap-admin.mjs --reset-2step`
 * (docs/decisions.md, 2026-09-27). A session the person already has open
 * drops to aal1 at its next token refresh, within the hour.
 */
export async function resetTwoStep(userId: string): Promise<ActionResult> {
  const { t } = await getT();
  const e = t.admin.security.errors;
  return runAction("security.resetTwoStep", t.common.somethingWentWrong, async () => {
    const denied = await refuseUnlessAdmin(t);
    if (denied) return denied;

    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.mfa.listFactors({ userId });
    if (error) {
      if (isUserNotFound(error)) return refuse(e.userNotFound);
      return unexpectedFailure("security.resetTwoStep", error, t.common.somethingWentWrong);
    }
    const factors = data.factors.filter((f) => f.factor_type === "totp");
    if (!factors.some(isVerifiedTotp)) return refuse(e.noTwoStep);

    for (const factor of factors) {
      const { error: deleteError } = await admin.auth.admin.mfa.deleteFactor({
        id: factor.id,
        userId,
      });
      if (deleteError) {
        return unexpectedFailure("security.resetTwoStep", deleteError, t.common.somethingWentWrong);
      }
    }
    // The reset is the admin's say-so for the replacement: set-up opens.
    const { error: openError } = await admin.auth.admin.updateUserById(userId, {
      app_metadata: { [APPROVED_FACTOR]: null, [SETUP_OPEN_UNTIL]: setupWindowEnd() },
    });
    if (openError) return unexpectedFailure("security.resetTwoStep", openError, t.common.somethingWentWrong);
    revalidateSecurity();
    return { ok: true };
  });
}

/**
 * Opens a first authenticator set-up for a login that has none the app
 * trusts (src/lib/auth/two-step.ts): for the admin who was never prompted,
 * or whose set-up window ran out. Any app that is there but untrusted — a
 * half-finished set-up, or one enrolled around the app — is removed so the
 * person starts clean. A login that has a trusted app uses Reset instead.
 */
export async function allowTwoStepSetup(userId: string): Promise<ActionResult> {
  const { t } = await getT();
  const e = t.admin.security.errors;
  return runAction("security.allowTwoStepSetup", t.common.somethingWentWrong, async () => {
    const denied = await refuseUnlessAdmin(t);
    if (denied) return denied;

    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.getUserById(userId);
    if (error || !data.user) {
      if (!error || isUserNotFound(error)) return refuse(e.userNotFound);
      return unexpectedFailure("security.allowTwoStepSetup", error, t.common.somethingWentWrong);
    }
    if (trustedTotpFactors(data.user).length > 0) return refuse(e.alreadyHasTwoStep);

    for (const factor of data.user.factors ?? []) {
      const { error: deleteError } = await admin.auth.admin.mfa.deleteFactor({
        id: factor.id,
        userId,
      });
      if (deleteError) {
        return unexpectedFailure("security.allowTwoStepSetup", deleteError, t.common.somethingWentWrong);
      }
    }
    const { error: openError } = await admin.auth.admin.updateUserById(userId, {
      app_metadata: { [APPROVED_FACTOR]: null, [SETUP_OPEN_UNTIL]: setupWindowEnd() },
    });
    if (openError) {
      return unexpectedFailure("security.allowTwoStepSetup", openError, t.common.somethingWentWrong);
    }
    revalidateSecurity();
    return { ok: true };
  });
}
