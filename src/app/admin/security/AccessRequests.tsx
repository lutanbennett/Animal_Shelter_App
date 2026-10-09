"use client";

import { useConfirm } from "@/components/ConfirmProvider";
import { ACTION_ICONS } from "@/components/hub-icons";
import { ActionButton } from "@/components/ActionButton";
import { useState, useTransition } from "react";
import { approveAccessRequest, dismissAccessRequest } from "./actions";
import type { ActionResult } from "@/lib/action-result";
import { formatDateTime } from "@/lib/format";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { roleLabel } from "@/lib/i18n/enum-labels";

export type AccessRequest = {
  id: string;
  email: string;
  /** Google's display name, when they signed in with Google. */
  name: string | null;
  /** "google" or "email" — how the account came to exist. */
  provider: string;
  createdAt: string;
  lastSignInAt: string | null;
};

const ROLES = ["volunteer", "doctor", "management", "admin", "public_viewer"] as const;

function RequestRow({ request }: { request: AccessRequest }) {
  const { t, locale } = useI18n();
  const confirm = useConfirm();
  const r = t.admin.security.requests;
  const [role, setRole] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function approve() {
    if (!role) {
      setError(r.chooseRole);
      return;
    }
    run(() => approveAccessRequest(request.id, role), t.admin.security.table.failedToUpdateRole);
  }

  async function deny() {
    if (!await confirm({ body: r.denyConfirm(request.email) })) return;
    run(() => dismissAccessRequest(request.id), t.admin.security.table.failedToDeleteUser);
  }

  /**
   * The actions return their refusals (src/lib/action-result.ts); the
   * catch is only for the call itself failing, whose thrown message would
   * read "#441".
   */
  function run(action: () => Promise<ActionResult>, fallback: string) {
    setError(null);
    startTransition(async () => {
      try {
        const result = await action();
        if (!result.ok) setError(result.error);
      } catch {
        setError(fallback);
      }
    });
  }

  return (
    <li className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col">
          <span className="font-medium text-foreground">{request.name ?? request.email}</span>
          {request.name && <span className="text-sm text-muted">{request.email}</span>}
          <span className="text-xs text-muted">
            {request.provider === "google" ? r.viaGoogle : r.viaEmail}
            {" · "}
            {r.firstSeen(formatDateTime(request.createdAt, locale))}
            {request.lastSignInAt && ` · ${r.lastAttempt(formatDateTime(request.lastSignInAt, locale))}`}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={role}
            disabled={isPending}
            onChange={(e) => setRole(e.target.value)}
            aria-label={t.admin.security.table.role}
            className="rounded border border-border bg-background px-2 py-1 text-sm text-foreground outline-none focus:border-primary disabled:opacity-50"
          >
            <option value="">{r.chooseRole}</option>
            {ROLES.map((value) => (
              <option key={value} value={value}>
                {roleLabel(t, value)}
              </option>
            ))}
          </select>
          <ActionButton variant="primary" icon={ACTION_ICONS.approve} disabled={isPending} onClick={approve}>
            {isPending ? r.approving : r.approve}
          </ActionButton>
          <ActionButton variant="danger" icon={ACTION_ICONS.deny} disabled={isPending} onClick={deny}>
            {r.deny}
          </ActionButton>
        </div>
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
    </li>
  );
}

/**
 * Accounts that exist but have no role: someone who signed in with Google
 * and was turned away with "hasn't been given access yet" (the callback
 * keeps their auth.users row), or a login an admin created whose role
 * insert failed. Listed above the users table so they're seen, not found.
 * Approve assigns the role and they can sign in again; Deny removes the
 * account, and a stranger's Google account is gone with it.
 */
export function AccessRequests({ requests }: { requests: AccessRequest[] }) {
  const { t } = useI18n();
  const r = t.admin.security.requests;

  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
          {r.heading}
          {requests.length > 0 && (
            <span className="rounded-full bg-warning/20 px-2 py-0.5 text-xs font-medium text-foreground">
              {requests.length}
            </span>
          )}
        </h2>
        <p className="text-sm text-muted">{r.subtitle}</p>
      </div>
      {requests.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {requests.map((request) => (
            <RequestRow key={request.id} request={request} />
          ))}
        </ul>
      ) : (
        <p className="rounded border border-dashed border-border px-4 py-4 text-center text-sm text-muted">
          {r.none}
        </p>
      )}
    </section>
  );
}
