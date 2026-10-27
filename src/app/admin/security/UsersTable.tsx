"use client";

import { useConfirm } from "@/components/ConfirmProvider";
import { ACTION_ICONS } from "@/components/hub-icons";
import { ActionButton } from "@/components/ActionButton";
import { OptionalDateInput } from "@/components/OptionalDateInput";
import { useMemo, useState, useTransition } from "react";
import { Plus, X } from "lucide-react";
import {
  addExtraRole,
  allowTwoStepSetup,
  archiveUser,
  deleteUser,
  issueTemporaryPassword,
  resetTwoStep,
  removeExtraRole,
  restoreUser,
  setUserName,
  updateUserRole,
} from "./actions";
import { MAX_NAME_LENGTH } from "@/lib/auth/user-name";
import { CreateUserForm } from "./CreateUserForm";
import { DoctorLoginLink, type DoctorOption } from "./DoctorLoginLink";
import { Modal } from "./Modal";
import { RowMenu, type RowMenuItem } from "./RowMenu";
import { TemporaryPasswordNotice } from "@/components/TemporaryPasswordNotice";
import type { ActionResult } from "@/lib/action-result";
import { formatDate as formatDay, formatDateTime as formatDate } from "@/lib/format";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { roleOptionLabel, type RoleOption } from "./role-options";

/** An additional role (a cover, 0196): in force until `endsOn` inclusive; null = no end. */
export type ExtraRole = { role: string; startsOn: string | null; endsOn: string | null };

export type SecurityUser = {
  id: string;
  email: string;
  /** user_metadata.full_name (or Google's name); null when the login has none. */
  name: string | null;
  /** The role's key (roles.key, through user_roles.role_id). */
  role: string | null;
  /** Set when they've left (0063): no access, kept for past work. */
  archivedAt: string | null;
  /** Roles held besides the main one, soonest end first. */
  extraRoles: ExtraRole[];
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

export type ClinicOption = { id: string; label: string };

type ModalKind = "main" | "add" | "name" | "doctor" | null;

/**
 * One person: who they are on the left, every role they hold as a chip in the middle, the 2-step state and the
 * "…" menu on the right. Everything here is Admin's (the page is `requireAdminUser`), and every server action
 * behind a control checks Admin again, so a control is drawn exactly when its action would accept it.
 */
function UserRow({
  user,
  roles,
  clinics,
  unlinkedDoctors,
  isSelf,
}: {
  user: SecurityUser;
  roles: RoleOption[];
  clinics: ClinicOption[];
  unlinkedDoctors: DoctorOption[];
  isSelf: boolean;
}) {
  const { t, locale } = useI18n();
  const confirm = useConfirm();
  const l = t.admin.security.table.list;
  const w = t.admin.security.table.cover;
  const [role, setRole] = useState(user.role ?? "");
  const [name, setName] = useState(user.name ?? "");
  const [modal, setModal] = useState<ModalKind>(null);
  const [pickKey, setPickKey] = useState("");
  const [extraEnds, setExtraEnds] = useState("");
  const [issuedPassword, setIssuedPassword] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const archived = !!user.archivedAt;
  // Admin is read from the role's own flag (roles.is_admin), never from its key or name.
  const roleIsAdmin = roles.find((r) => r.key === role)?.isAdmin ?? false;
  const labelOf = (key: string) =>
    roleOptionLabel(t, locale, roles.find((r) => r.key === key) ?? { key, name: key, nameTh: null, isAdmin: false });
  const display = user.name || user.email;

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

  function closeModal() {
    setModal(null);
    setPickKey("");
    setExtraEnds("");
  }

  function handleRoleChange(nextRole: string) {
    const previous = role;
    setRole(nextRole);
    setModal(null);
    run(
      () => updateUserRole(user.id, nextRole),
      t.admin.security.table.failedToUpdateRole,
      () => setMessage({ type: "success", text: t.admin.security.table.roleUpdated }),
      () => setRole(previous),
    );
  }

  // A role can be added besides the main one unless Admin or the public viewer (never additional), the one already
  // held, or one already added. The database refuses Admin whatever this list says.
  const heldKeys = new Set([role, ...user.extraRoles.map((x) => x.role)]);
  const addable = roles.filter((r) => !r.isAdmin && r.key !== "public_viewer" && !heldKeys.has(r.key));
  const canEditRoles = !archived && !isSelf;
  const canAddRole = canEditRoles && !!role && !roleIsAdmin && addable.length > 0;

  function handleAddExtra() {
    run(
      () => addExtraRole(user.id, pickKey, extraEnds || null),
      w.failedToAdd,
      () => {
        closeModal();
        setMessage({ type: "success", text: w.added });
      },
    );
  }

  async function handleRemoveExtra(key: string) {
    if (!(await confirm({ body: w.removeConfirm(labelOf(key), user.email) }))) return;
    run(
      () => removeExtraRole(user.id, key),
      w.failedToRemove,
      () => setMessage({ type: "success", text: w.removed }),
    );
  }

  function handleSaveName() {
    run(
      () => setUserName(user.id, name),
      t.admin.security.table.failedToSaveName,
      () => {
        closeModal();
        setMessage({ type: "success", text: t.admin.security.table.nameSaved });
      },
    );
  }

  async function handleIssuePassword() {
    if (!(await confirm({ body: t.admin.security.table.issueConfirm(user.email) }))) return;
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
    if (!(await confirm({ body: confirmText }))) return;
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
    if (!(await confirm({ body: t.admin.security.table.archiveConfirm(user.email) }))) return;
    run(() => archiveUser(user.id), t.admin.security.table.failedToArchiveUser);
  }

  function handleRestore() {
    run(() => restoreUser(user.id), t.admin.security.table.failedToRestoreUser);
  }

  async function handleDelete() {
    if (!(await confirm({ body: t.admin.security.table.deleteConfirm(user.email), confirmLabel: t.common.delete }))) return;
    run(() => deleteUser(user.id), t.admin.security.table.failedToDeleteUser);
  }

  const icon = (Icon: (typeof ACTION_ICONS)[keyof typeof ACTION_ICONS]) => <Icon size={16} aria-hidden="true" />;
  const items: RowMenuItem[] = [
    { key: "name", label: l.editName, icon: icon(ACTION_ICONS.edit), onSelect: () => setModal("name") },
    // Offered on every login: which role is "the doctor role" is the shelter's to say, not this screen's.
    ...(!archived
      ? [{ key: "doctor", label: l.linkDoctor, icon: icon(ACTION_ICONS.link), onSelect: () => setModal("doctor") }]
      : []),
    ...(!isSelf && !archived
      ? [
          {
            key: "password",
            label: t.admin.security.table.issueTemporaryPassword,
            icon: icon(ACTION_ICONS.issuePassword),
            onSelect: handleIssuePassword,
          },
        ]
      : []),
    ...(user.twoStep
      ? [
          {
            key: "reset2",
            label: l.resetTwoStep,
            icon: icon(ACTION_ICONS.resetTwoStep),
            onSelect: handleResetTwoStep,
          },
        ]
      : roleIsAdmin && !isSelf && !archived
        ? [
            {
              key: "allow2",
              label: user.twoStepSetupUntil
                ? l.renewTwoStep
                : l.allowTwoStep,
              icon: icon(ACTION_ICONS.allowTwoStep),
              onSelect: handleAllowTwoStepSetup,
            },
          ]
        : []),
    ...(!isSelf
      ? [
          archived
            ? { key: "restore", label: t.admin.security.table.restore, icon: icon(ACTION_ICONS.restore), onSelect: handleRestore }
            : { key: "archive", label: t.admin.security.table.archive, icon: icon(ACTION_ICONS.archive), onSelect: handleArchive },
          {
            key: "delete",
            label: t.common.delete,
            icon: icon(ACTION_ICONS.delete),
            onSelect: handleDelete,
            tone: "danger" as const,
          },
        ]
      : []),
  ];

  const chip = "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs";

  return (
    <li className={`flex flex-col gap-2 p-4 ${archived ? "text-muted" : ""}`}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start">
        {/* Who */}
        <div className="min-w-0 lg:w-72 lg:shrink-0">
          <p className={`truncate font-medium ${archived ? "text-muted" : "text-foreground"}`}>
            {display}
            {isSelf && <span className="ml-2 text-xs font-normal text-muted">{t.admin.security.table.you}</span>}
          </p>
          {user.name && <p className="truncate text-sm text-muted">{user.email}</p>}
          <p className="text-xs text-muted">
            {user.lastSignInAt ? l.lastSignIn(formatDate(user.lastSignInAt, locale)) : l.neverSignedIn}
          </p>
          {user.mustChangePassword && (
            <span className="mt-1 inline-block rounded-full bg-warning/15 px-2 py-0.5 text-xs text-foreground">
              {t.admin.security.table.temporaryPassword}
            </span>
          )}
        </div>

        {/* Roles held: the point of the page. */}
        <ul className="flex min-w-0 flex-1 flex-wrap items-center gap-2" aria-label={l.rolesHeld}>
          {role ? (
            <li>
              {canEditRoles ? (
                <button
                  type="button"
                  onClick={() => setModal("main")}
                  disabled={isPending}
                  title={l.changeMain}
                  className={`${chip} border-primary bg-primary/10 font-medium text-foreground hover:bg-primary/20 disabled:opacity-50`}
                >
                  {labelOf(role)}
                  <span className="font-normal text-muted">· {l.main}</span>
                </button>
              ) : (
                <span className={`${chip} border-primary bg-primary/10 font-medium text-foreground`}>
                  {labelOf(role)}
                  <span className="font-normal text-muted">· {l.main}</span>
                </span>
              )}
            </li>
          ) : (
            <li className={`${chip} border-border text-muted`}>{t.admin.security.table.noRole}</li>
          )}
          {user.extraRoles.map((x) => (
            <li key={x.role} className={`${chip} border-border bg-surface text-foreground`}>
              {labelOf(x.role)}
              <span className="text-muted">· {x.endsOn ? w.until(formatDay(x.endsOn, locale)) : w.noEnd}</span>
              {canEditRoles && (
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleRemoveExtra(x.role)}
                  aria-label={`${w.remove}: ${user.email} — ${labelOf(x.role)}`}
                  title={w.remove}
                  className="-mr-1 rounded-full p-0.5 text-muted hover:bg-danger/15 hover:text-danger disabled:opacity-50"
                >
                  <X size={12} aria-hidden="true" />
                </button>
              )}
            </li>
          ))}
          {canAddRole && (
            <li>
              <button
                type="button"
                onClick={() => setModal("add")}
                disabled={isPending}
                className={`${chip} border-dashed border-border text-muted hover:border-primary hover:text-foreground disabled:opacity-50`}
              >
                <Plus size={12} aria-hidden="true" />
                {w.addRole}
              </button>
            </li>
          )}
        </ul>

        {/* Two-step state and the less-used actions */}
        <div className="flex items-center justify-between gap-3 lg:justify-end">
          <span
            className={
              user.twoStep
                ? "text-xs text-foreground"
                : roleIsAdmin && !archived
                  ? "rounded-full bg-warning/20 px-2 py-0.5 text-xs font-medium text-foreground"
                  : "text-xs text-muted"
            }
          >
            {user.twoStep ? l.twoStepOn : l.twoStepOff}
            {!user.twoStep && user.twoStepSetupUntil && (
              <span className="ml-1 font-normal text-muted">
                · {t.admin.security.table.twoStepSetupOpenUntil(formatDate(user.twoStepSetupUntil, locale))}
              </span>
            )}
          </span>
          <RowMenu items={items} label={display} disabled={isPending} />
        </div>
      </div>

      {user.doctor && (
        <p className="text-xs text-muted">
          {t.admin.security.table.vetDoctor.label}: <span className="text-foreground">{user.doctor.name}</span>
        </p>
      )}
      {issuedPassword && <TemporaryPasswordNotice email={user.email} password={issuedPassword} />}
      {message && (
        <p className={`text-xs ${message.type === "error" ? "text-danger" : "text-success"}`} role="status">
          {message.text}
        </p>
      )}

      {modal === "main" && (
        <Modal title={l.mainTitle(display)} onClose={closeModal}>
          <p className="text-sm text-muted">{l.mainHint}</p>
          <ul className="flex flex-col gap-1">
            {roles.map((r) => (
              <li key={r.key}>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => (r.key === role ? closeModal() : handleRoleChange(r.key))}
                  className={`flex w-full items-center justify-between rounded border px-3 py-2 text-left text-sm hover:bg-surface-hover ${
                    r.key === role ? "border-primary bg-primary/10 text-foreground" : "border-border text-foreground"
                  }`}
                >
                  {roleOptionLabel(t, locale, r)}
                  {r.key === role && <span className="text-xs text-muted">{l.main}</span>}
                </button>
              </li>
            ))}
          </ul>
        </Modal>
      )}

      {modal === "add" && (
        <Modal title={l.addTitle(display)} onClose={closeModal}>
          <form
            onSubmit={(ev) => {
              ev.preventDefault();
              handleAddExtra();
            }}
            className="flex flex-col gap-4"
          >
            <fieldset className="flex flex-col gap-1">
              <legend className="mb-1 text-sm font-medium text-muted">{w.roleLabel}</legend>
              {addable.map((r) => (
                <label
                  key={r.key}
                  className={`flex cursor-pointer items-center gap-2 rounded border px-3 py-2 text-sm text-foreground hover:bg-surface-hover ${
                    pickKey === r.key ? "border-primary bg-primary/10" : "border-border"
                  }`}
                >
                  <input
                    type="radio"
                    name={`extra-${user.id}`}
                    value={r.key}
                    checked={pickKey === r.key}
                    onChange={() => setPickKey(r.key)}
                    disabled={isPending}
                  />
                  {roleOptionLabel(t, locale, r)}
                </label>
              ))}
            </fieldset>
            <label className="flex flex-col gap-1 text-sm text-muted">
              {w.endsLabel}
              <OptionalDateInput
                value={extraEnds}
                onValueChange={setExtraEnds}
                label={w.endsLabel}
                disabled={isPending}
                className="rounded border border-border bg-background px-2 py-1 text-sm text-foreground outline-none focus:border-primary"
              />
              <span className="text-xs">{w.endsHint}</span>
            </label>
            {message?.type === "error" && <p className="text-sm text-danger">{message.text}</p>}
            <div className="flex gap-2">
              <ActionButton type="submit" variant="primary" icon={ACTION_ICONS.save} disabled={isPending || !pickKey}>
                {w.add}
              </ActionButton>
              <ActionButton type="button" icon={ACTION_ICONS.clear} disabled={isPending} onClick={closeModal}>
                {t.common.cancel}
              </ActionButton>
            </div>
          </form>
        </Modal>
      )}

      {modal === "name" && (
        <Modal title={l.nameTitle(user.email)} onClose={closeModal}>
          <form
            onSubmit={(ev) => {
              ev.preventDefault();
              handleSaveName();
            }}
            className="flex flex-col gap-4"
          >
            <input
              type="text"
              value={name}
              onChange={(ev) => setName(ev.target.value)}
              maxLength={MAX_NAME_LENGTH}
              disabled={isPending}
              placeholder={t.admin.security.table.noName}
              aria-label={`${t.admin.security.table.name}: ${user.email}`}
              autoFocus
              className="rounded border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
            />
            {message?.type === "error" && <p className="text-sm text-danger">{message.text}</p>}
            <div className="flex gap-2">
              <ActionButton type="submit" variant="primary" icon={ACTION_ICONS.save} disabled={isPending}>
                {t.admin.security.table.saveName}
              </ActionButton>
              <ActionButton type="button" icon={ACTION_ICONS.clear} disabled={isPending} onClick={closeModal}>
                {t.common.cancel}
              </ActionButton>
            </div>
          </form>
        </Modal>
      )}

      {modal === "doctor" && (
        <Modal title={l.linkDoctor} onClose={closeModal}>
          <DoctorLoginLink user={user} clinics={clinics} unlinkedDoctors={unlinkedDoctors} disabled={archived} />
        </Modal>
      )}
    </li>
  );
}

export function UsersTable({
  users,
  roles,
  clinics,
  unlinkedDoctors,
  currentUserId,
}: {
  users: SecurityUser[];
  /** Every role, in picker order (role-options.ts). */
  roles: RoleOption[];
  clinics: ClinicOption[];
  unlinkedDoctors: DoctorOption[];
  currentUserId: string;
}) {
  const { t } = useI18n();
  const l = t.admin.security.table.list;
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(false);

  const { current, left } = useMemo(() => {
    const q = query.trim().toLowerCase();
    const shown = q
      ? users.filter((u) => u.email.toLowerCase().includes(q) || (u.name ?? "").toLowerCase().includes(q))
      : users;
    return { current: shown.filter((u) => !u.archivedAt), left: shown.filter((u) => !!u.archivedAt) };
  }, [users, query]);

  const rows = (list: SecurityUser[]) =>
    list.map((user) => (
      <UserRow
        key={user.id}
        user={user}
        roles={roles}
        clinics={clinics}
        unlinkedDoctors={unlinkedDoctors}
        isSelf={user.id === currentUserId}
      />
    ));

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={l.search}
          aria-label={l.search}
          className="min-w-0 flex-1 rounded border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary sm:max-w-sm"
        />
        <ActionButton variant="primary" icon={ACTION_ICONS.add} onClick={() => setAdding(true)}>
          {l.addPerson}
        </ActionButton>
      </div>

      <ul className="divide-y divide-border rounded border border-border">
        {rows(current)}
        {current.length === 0 && (
          <li className="px-4 py-6 text-center text-muted">
            {users.length === 0 ? t.admin.security.table.noUsers : l.noMatch}
          </li>
        )}
      </ul>

      {left.length > 0 && (
        <details className="rounded border border-border" open={query.trim() !== ""}>
          <summary className="cursor-pointer px-4 py-2 text-sm font-medium text-muted">{l.left(left.length)}</summary>
          <ul className="divide-y divide-border border-t border-border">{rows(left)}</ul>
        </details>
      )}

      {adding && (
        <Modal title={l.addPersonTitle} onClose={() => setAdding(false)}>
          <CreateUserForm roles={roles} />
        </Modal>
      )}
    </section>
  );
}
