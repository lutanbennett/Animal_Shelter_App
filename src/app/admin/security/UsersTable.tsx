"use client";

import { Fragment, useState, useTransition } from "react";
import { deleteUser, resetUserPassword, updateUserRole } from "./actions";
import { formatDateTime as formatDate } from "@/lib/format";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { roleLabel } from "@/lib/i18n/enum-labels";

export type SecurityUser = {
  id: string;
  email: string;
  role: string | null;
  createdAt: string;
  lastSignInAt: string | null;
};

const ROLES = ["admin", "management", "staff", "vet", "volunteer"];

function UserRow({
  user,
  isSelf,
}: {
  user: SecurityUser;
  isSelf: boolean;
}) {
  const { t, locale } = useI18n();
  const [role, setRole] = useState(user.role ?? "");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState<
    { type: "error" | "success"; text: string } | null
  >(null);
  const [isPending, startTransition] = useTransition();

  function handleRoleChange(nextRole: string) {
    const previous = role;
    setRole(nextRole);
    setMessage(null);
    startTransition(async () => {
      try {
        await updateUserRole(user.id, nextRole);
        setMessage({ type: "success", text: t.admin.security.table.roleUpdated });
      } catch (err) {
        setRole(previous);
        setMessage({
          type: "error",
          text:
            err instanceof Error
              ? err.message
              : t.admin.security.table.failedToUpdateRole,
        });
      }
    });
  }

  function handleResetPassword() {
    if (newPassword.length < 8) {
      setMessage({
        type: "error",
        text: t.admin.security.table.passwordTooShort,
      });
      return;
    }
    setMessage(null);
    startTransition(async () => {
      try {
        await resetUserPassword(user.id, newPassword);
        setNewPassword("");
        setMessage({ type: "success", text: t.admin.security.table.passwordUpdated });
      } catch (err) {
        setMessage({
          type: "error",
          text:
            err instanceof Error
              ? err.message
              : t.admin.security.table.failedToResetPassword,
        });
      }
    });
  }

  function handleDelete() {
    if (!window.confirm(t.admin.security.table.deleteConfirm(user.email))) return;
    setMessage(null);
    startTransition(async () => {
      try {
        await deleteUser(user.id);
      } catch (err) {
        setMessage({
          type: "error",
          text:
            err instanceof Error
              ? err.message
              : t.admin.security.table.failedToDeleteUser,
        });
      }
    });
  }

  return (
    <Fragment>
      <tr className="align-top hover:bg-surface-hover">
        <td className="px-4 py-2 text-foreground">
          {user.email}
          {isSelf && (
            <span className="ml-2 text-xs text-muted">
              {t.admin.security.table.you}
            </span>
          )}
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
            disabled={isPending || isSelf}
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
          </select>
        </td>
        <td className="px-4 py-2">
          <div className="flex items-center gap-2">
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder={t.admin.security.table.newPasswordPlaceholder}
              className="w-36 rounded border border-border bg-background px-2 py-1 text-sm text-foreground outline-none focus:border-primary"
            />
            <button
              type="button"
              disabled={isPending}
              onClick={handleResetPassword}
              className="rounded border border-border px-2 py-1 text-xs font-medium text-muted hover:bg-surface-hover hover:text-foreground disabled:opacity-50"
            >
              {t.admin.security.table.reset}
            </button>
          </div>
        </td>
        <td className="px-4 py-2">
          {!isSelf && (
            <button
              type="button"
              disabled={isPending}
              onClick={handleDelete}
              className="rounded border border-danger/40 px-2 py-1 text-xs font-medium text-danger hover:bg-danger/10 disabled:opacity-50"
            >
              {t.common.delete}
            </button>
          )}
        </td>
      </tr>
      {message && (
        <tr>
          <td
            colSpan={6}
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
  currentUserId,
}: {
  users: SecurityUser[];
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
            <th className="px-4 py-2 font-medium" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {users.map((user) => (
            <UserRow
              key={user.id}
              user={user}
              isSelf={user.id === currentUserId}
            />
          ))}
          {users.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-6 text-center text-muted">
                {t.admin.security.table.noUsers}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
