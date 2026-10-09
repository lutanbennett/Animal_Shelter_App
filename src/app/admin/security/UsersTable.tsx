"use client";

import { useConfirm } from "@/components/ConfirmProvider";
import { ACTION_ICONS } from "@/components/hub-icons";
import { ActionButton } from "@/components/ActionButton";
import { RowActionButton } from "@/components/RowAction";
import { Fragment, useState, useTransition } from "react";
import {
  allowTwoStepSetup,
  archiveUser,
  deleteUser,
  issueTemporaryPassword,
  resetTwoStep,
  restoreUser,
  setUserName,
  updateUserRole,
} from "./actions";
import { MAX_NAME_LENGTH } from "@/lib/auth/user-name";
import { DoctorLoginLink, type DoctorOption } from "./DoctorLoginLink";
import { TemporaryPasswordNotice } from "@/components/TemporaryPasswordNotice";
import type { ActionResult } from "@/lib/action-result";
import { formatDateTime as formatDate } from "@/lib/format";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { roleLabel } from "@/lib/i18n/enum-labels";

export type SecurityUser = {
  id: string;
  email: string;
  /** user_metadata.full_name (or Google's name); null when the login has none. */
  name: string | null;
  role: string | null;
  /** Set when they've left (0063): no access, kept for past work. */
  archivedAt: string | null;
  /** The doctor this login is linked to (0125); its clinics are the login's. */
  doctor: { id: string; name: string; clinics: string[] } | null;
  createdAt: string;
  lastSignInAt: string | null;
  /** On a temporary password — must choose their own at the next password sign-in. */
  mustChangePassword: boolean;
  /** Has an authenticator app set up for Settings → Security. */
  twoStep: boolean;
  /** Until when their first set-up is open; null when it isn't. */
  twoStepSetupUntil: string | null;
};

// Staff is retired (0173): never offered. A login that still holds it (an archived one) shows it, unchosen,
// and its select stays open so it can be given another role before Restore.
const ROLES = ["admin", "management", "doctor", "volunteer", "public_viewer"];
const RETIRED_ROLES = ["staff"];

export type ClinicOption = { id: string; label: string };

function UserRow({
  user,
  clinics,
  unlinkedDoctors,
  isSelf,
}: {
  user: SecurityUser;
  clinics: ClinicOption[];
  unlinkedDoctors: DoctorOption[];
  isSelf: boolean;
}) {
  const { t, locale } = useI18n();
  const confirm = useConfirm();
  const [role, setRole] = useState(user.role ?? "");
  const [name, setName] = useState(user.name ?? "");
  const [issuedPassword, setIssuedPassword] = useState<string | null>(null);
  const [message, setMessage] = useState<
    { type: "error" | "success"; text: string } | null
  >(null);
  const [isPending, startTransition] = useTransition();
  const archived = !!user.archivedAt;

  /**
   * Runs one of the row's actions and shows its refusal. The actions
   * return their errors (src/lib/action-result.ts); the catch is only for
   * the call itself failing — offline, or the server gone — where a thrown
   * message would read "#441", so it gets the row's own words instead.
   */
  function run<R extends object>(
    action: () => Promise<ActionResult<R>>,
    fallback: string,
    onOk?: (result: { ok: true } & R) => void,
    onError?: () => void,
  ) {
    setMessage(null);
    startTransition(async () => {
      let result: ActionResult<R>;
      try {
        result = await action();
      } catch {
        result = { ok: false, error: fallback };
      }
      if (result.ok) {
        onOk?.(result);
      } else {
        onError?.();
        setMessage({ type: "error", text: result.error });
      }
    });
  }

  function handleRoleChange(nextRole: string) {
    const previous = role;
    setRole(nextRole);
    run(
      () => updateUserRole(user.id, nextRole),
      t.admin.security.table.failedToUpdateRole,
      () => {
        setMessage({ type: "success", text: t.admin.security.table.roleUpdated });
      },
      () => setRole(previous),
    );
  }

  function handleSaveName() {
    run(
      () => setUserName(user.id, name),
      t.admin.security.table.failedToSaveName,
      () => setMessage({ type: "success", text: t.admin.security.table.nameSaved }),
    );
  }

  async function handleIssuePassword() {
    if (!await confirm({ body: t.admin.security.table.issueConfirm(user.email) })) return;
    setIssuedPassword(null);
    run(
      () => issueTemporaryPassword(user.id),
      t.admin.security.table.failedToResetPassword,
      (result) => setIssuedPassword(result.temporaryPassword),
    );
  }

  async function handleResetTwoStep() {
    const confirmText = isSelf
      ? t.admin.security.table.resetTwoStepSelfConfirm
      : t.admin.security.table.resetTwoStepConfirm(user.email);
    if (!await confirm({ body: confirmText })) return;
    run(
      () => resetTwoStep(user.id),
      t.admin.security.table.failedToResetTwoStep,
      () => setMessage({ type: "success", text: t.admin.security.table.twoStepReset }),
    );
  }

  /** An admin vouching for a first set-up (src/lib/auth/two-step.ts); no confirm, nothing is lost. */
  function handleAllowTwoStepSetup() {
    run(
      () => allowTwoStepSetup(user.id),
      t.admin.security.table.failedToAllowTwoStep,
      () => setMessage({ type: "success", text: t.admin.security.table.twoStepSetupAllowed }),
    );
  }

  async function handleArchive() {
    if (!await confirm({ body: t.admin.security.table.archiveConfirm(user.email) })) return;
    run(() => archiveUser(user.id), t.admin.security.table.failedToArchiveUser);
  }

  function handleRestore() {
    run(() => restoreUser(user.id), t.admin.security.table.failedToRestoreUser);
  }

  async function handleDelete() {
    if (!await confirm({ body: t.admin.security.table.deleteConfirm(user.email), confirmLabel: t.common.delete })) return;
    run(() => deleteUser(user.id), t.admin.security.table.failedToDeleteUser);
  }

  return (
    <Fragment>
      <tr className={`align-top hover:bg-surface-hover ${archived ? "text-muted" : ""}`}>
        <td className={`px-4 py-2 ${archived ? "text-muted" : "text-foreground"}`}>
          {user.email}
          {archived && (
            <span
              className="ml-2 rounded-full bg-surface-hover px-2 py-0.5 text-xs text-muted"
              title={formatDate(user.archivedAt, locale)}
            >
              {t.admin.security.table.archived}
            </span>
          )}
          {isSelf && (
            <span className="ml-2 text-xs text-muted">
              {t.admin.security.table.you}
            </span>
          )}
          {user.mustChangePassword && (
            <span className="ml-2 rounded-full bg-warning/15 px-2 py-0.5 text-xs text-foreground">
              {t.admin.security.table.temporaryPassword}
            </span>
          )}
        </td>
        <td className="px-4 py-2">
          <form
            onSubmit={(ev) => {
              ev.preventDefault();
              handleSaveName();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={name}
              onChange={(ev) => setName(ev.target.value)}
              maxLength={MAX_NAME_LENGTH}
              disabled={isPending}
              placeholder={t.admin.security.table.noName}
              aria-label={`${t.admin.security.table.name}: ${user.email}`}
              className="w-44 rounded border border-border bg-background px-2 py-1 text-sm text-foreground outline-none focus:border-primary disabled:opacity-50"
            />
            {name.trim() !== (user.name ?? "") && (
              <ActionButton compact type="submit" icon={ACTION_ICONS.save} disabled={isPending}>
                {t.admin.security.table.saveName}
              </ActionButton>
            )}
          </form>
        </td>
        <td className="px-4 py-2 text-muted">
          {formatDate(user.createdAt, locale)}
        </td>
        <td className="px-4 py-2 text-muted">
          {formatDate(user.lastSignInAt, locale)}
        </td>
        <td className="px-4 py-2">
          <select
            value={role}
            // An archived login that held a retired role can be given another, so Restore can bring it back.
            disabled={isPending || isSelf || (archived && !RETIRED_ROLES.includes(role))}
            onChange={(e) => handleRoleChange(e.target.value)}
            className="rounded border border-border bg-background px-2 py-1 text-sm text-foreground outline-none focus:border-primary disabled:opacity-50"
          >
            <option value="" disabled>
              {t.admin.security.table.noRole}
            </option>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {roleLabel(t, r)}
              </option>
            ))}
            {RETIRED_ROLES.includes(role) && (
              <option value={role} disabled>
                {roleLabel(t, role)}
              </option>
            )}
          </select>
          {role === "doctor" && (
            <DoctorLoginLink
              user={user}
              clinics={clinics}
              unlinkedDoctors={unlinkedDoctors}
              disabled={archived}
            />
          )}
        </td>
        <td className="px-4 py-2">
          {!isSelf && !archived && (
            <ActionButton compact icon={ACTION_ICONS.issuePassword} disabled={isPending} onClick={handleIssuePassword}>
              {t.admin.security.table.issueTemporaryPassword}
            </ActionButton>
          )}
        </td>
        <td className="px-4 py-2">
          {user.twoStep ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-foreground">{t.admin.security.table.twoStepOn}</span>
              <ActionButton compact icon={ACTION_ICONS.resetTwoStep} disabled={isPending} onClick={handleResetTwoStep}>
                {t.admin.security.table.resetTwoStep}
              </ActionButton>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              {/* An admin with no second factor is the row to notice. */}
              <span
                className={
                  user.role === "admin" && !archived
                    ? "rounded-full bg-warning/20 px-2 py-0.5 text-xs font-medium text-foreground"
                    : "text-xs text-muted"
                }
              >
                {t.admin.security.table.twoStepOff}
              </span>
              {user.twoStepSetupUntil && (
                <span className="text-xs text-muted">
                  {t.admin.security.table.twoStepSetupOpenUntil(formatDate(user.twoStepSetupUntil, locale))}
                </span>
              )}
              {user.role === "admin" && !isSelf && !archived && (
                <ActionButton compact icon={ACTION_ICONS.allowTwoStep} disabled={isPending} onClick={handleAllowTwoStepSetup}>
                  {user.twoStepSetupUntil
                    ? t.admin.security.table.renewTwoStepSetup
                    : t.admin.security.table.allowTwoStepSetup}
                </ActionButton>
              )}
            </div>
          )}
        </td>
        <td className="px-4 py-2">
          {!isSelf && (
            <div className="flex flex-wrap gap-2">
              {archived ? (
                <RowActionButton
                  disabled={isPending}
                  onClick={handleRestore}
                  label={t.admin.security.table.restore}
                  subject={user.email}
                  icon={ACTION_ICONS.restore}
                />
              ) : (
                <RowActionButton
                  disabled={isPending}
                  onClick={handleArchive}
                  label={t.admin.security.table.archive}
                  subject={user.email}
                  icon={ACTION_ICONS.archive}
                />
              )}
              <RowActionButton
                disabled={isPending}
                onClick={handleDelete}
                label={t.common.delete}
                subject={user.email}
                icon={ACTION_ICONS.delete}
                tone="danger"
              />
            </div>
          )}
        </td>
      </tr>
      {issuedPassword && (
        <tr>
          <td colSpan={8} className="px-4 pb-3">
            <TemporaryPasswordNotice email={user.email} password={issuedPassword} />
          </td>
        </tr>
      )}
      {message && (
        <tr>
          <td
            colSpan={8}
            className={`px-4 pb-2 text-xs ${
              message.type === "error" ? "text-danger" : "text-success"
            }`}
          >
            {message.text}
          </td>
        </tr>
      )}
    </Fragment>
  );
}

export function UsersTable({
  users,
  clinics,
  unlinkedDoctors,
  currentUserId,
}: {
  users: SecurityUser[];
  clinics: ClinicOption[];
  unlinkedDoctors: DoctorOption[];
  currentUserId: string;
}) {
  const { t } = useI18n();

  return (
    <div className="overflow-x-auto rounded border border-border">
      <table className="w-full text-left text-sm">
        <thead className="bg-surface text-muted">
          <tr>
            <th className="px-4 py-2 font-medium">
              {t.admin.security.table.email}
            </th>
            <th className="px-4 py-2 font-medium">
              {t.admin.security.table.name}
            </th>
            <th className="px-4 py-2 font-medium">
              {t.admin.security.table.created}
            </th>
            <th className="px-4 py-2 font-medium">
              {t.admin.security.table.lastSignIn}
            </th>
            <th className="px-4 py-2 font-medium">
              {t.admin.security.table.role}
            </th>
            <th className="px-4 py-2 font-medium">
              {t.admin.security.table.resetPassword}
            </th>
            <th className="px-4 py-2 font-medium">
              {t.admin.security.table.twoStep}
            </th>
            <th className="px-4 py-2 font-medium" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {users.map((user) => (
            <UserRow
              key={user.id}
              user={user}
              clinics={clinics}
              unlinkedDoctors={unlinkedDoctors}
              isSelf={user.id === currentUserId}
            />
          ))}
          {users.length === 0 && (
            <tr>
              <td colSpan={8} className="px-4 py-6 text-center text-muted">
                {t.admin.security.table.noUsers}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
