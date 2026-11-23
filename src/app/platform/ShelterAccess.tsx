"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { ActionButton } from "@/components/ActionButton";
import { ACTION_ICONS } from "@/components/hub-icons";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useWriteCall } from "@/lib/use-write-form";
import {
  shelterAccessAdd,
  shelterAccessList,
  shelterAccessRemove,
  shelterAccessSetRole,
  type AccessLogin,
  type AccessRole,
} from "./access-actions";

const input = "min-h-11 rounded border border-border bg-background px-3 md:min-h-9";

/**
 * A shelter's access, as a backup to its own Admin (#shsec). Says which shelter is being changed, lists its logins with the role each holds,
 * and offers three things: add an existing login to an existing role, change a login's role to another existing one, take a login out.
 * It offers no way to make or edit a role or to touch a card, and the actions behind it have none either. The controls are drawn when the
 * person is a product administrator at aal2 (canWrite), which is exactly what each action and database function asks.
 */
export function ShelterAccess({ shelterId, shelterName, canWrite }: { shelterId: string; shelterName: string; canWrite: boolean }) {
  const { t } = useI18n();
  const a = t.admin.productAdmin.access;
  const [pending, startTransition] = useTransition();
  const addCall = useWriteCall();
  const roleCall = useWriteCall();
  const removeCall = useWriteCall();
  const [data, setData] = useState<{ roles: AccessRole[]; logins: AccessLogin[] } | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [email, setEmail] = useState("");
  const [roleKey, setRoleKey] = useState("");

  const load = useCallback(async () => {
    const r = await shelterAccessList(shelterId);
    if (r.ok) setData({ roles: r.roles, logins: r.logins });
    else setMsg({ ok: false, text: r.error ?? "" });
  }, [shelterId]);

  useEffect(() => {
    // Read once on opening the tab; every change below reads again.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const done = (ok: boolean, text: string) => {
    setMsg({ ok, text });
    if (ok) void load();
  };

  const add = () =>
    startTransition(async () => {
      const r = await addCall((id) => shelterAccessAdd(shelterId, email, roleKey || data?.roles[0]?.key || "", id));
      if (r.ok) setEmail("");
      done(r.ok, r.ok ? a.added : (r.error ?? ""));
    });
  const setRole = (l: AccessLogin, key: string) =>
    startTransition(async () => {
      const r = await roleCall((id) => shelterAccessSetRole(shelterId, l.userId, key, id));
      done(r.ok, r.ok ? a.changed : (r.error ?? ""));
    });
  const remove = (l: AccessLogin) => {
    if (!window.confirm(a.confirmRemove(l.email ?? "", shelterName))) return;
    startTransition(async () => {
      const r = await removeCall((id) => shelterAccessRemove(shelterId, l.userId, id));
      done(r.ok, r.ok ? a.removed : (r.error ?? ""));
    });
  };

  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-base font-semibold text-foreground">{a.title}</h3>
      <p className="w-fit rounded border border-warning px-2 py-1 text-sm font-semibold text-foreground">{a.changing(shelterName)}</p>
      <p className="max-w-prose text-xs text-muted">{a.backupNote}</p>
      <p className="max-w-prose text-xs text-muted">{a.cannotNote}</p>
      {!data ? (
        <p className="text-sm text-muted">{a.loading}</p>
      ) : data.logins.length === 0 ? (
        <p className="text-sm text-muted">{a.none}</p>
      ) : (
        <ul className="flex flex-col gap-2 text-sm">
          {data.logins.map((l) => (
            <li key={l.userId} className="flex flex-wrap items-center gap-2">
              <span className={l.archived ? "text-muted line-through" : "text-foreground"}>{l.email ?? l.userId}</span>
              {l.archived && <span className="text-xs text-muted">({a.takenOut})</span>}
              {canWrite && !l.archived ? (
                <>
                  <select
                    aria-label={`${a.setRole}: ${l.email ?? ""}`}
                    className={input}
                    value={l.roleKey}
                    disabled={pending}
                    onChange={(ev) => setRole(l, ev.target.value)}
                  >
                    {data.roles.map((r) => (
                      <option key={r.key} value={r.key}>
                        {r.name}
                        {r.isAdmin ? ` (${a.adminTag})` : ""}
                      </option>
                    ))}
                  </select>
                  <ActionButton icon={ACTION_ICONS.delete} variant="danger" compact disabled={pending} onClick={() => remove(l)}>
                    {a.remove}
                  </ActionButton>
                </>
              ) : (
                <span className="text-muted">{l.roleName}</span>
              )}
            </li>
          ))}
        </ul>
      )}
      {canWrite && data && data.roles.length > 0 && (
        <div className="flex flex-wrap items-end gap-2">
          <label className="flex flex-col gap-1 text-sm">
            {a.emailLabel}
            <input type="email" className={input} value={email} onChange={(ev) => setEmail(ev.target.value)} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            {a.roleLabel}
            <select className={input} value={roleKey || data.roles[0].key} onChange={(ev) => setRoleKey(ev.target.value)}>
              {data.roles.map((r) => (
                <option key={r.key} value={r.key}>
                  {r.name}
                  {r.isAdmin ? ` (${a.adminTag})` : ""}
                </option>
              ))}
            </select>
          </label>
          <ActionButton icon={ACTION_ICONS.add} variant="primary" compact disabled={pending || email.trim() === ""} onClick={add}>
            {a.add}
          </ActionButton>
        </div>
      )}
      {msg && (
        <p role="status" className={`text-sm ${msg.ok ? "text-success" : "text-danger"}`}>
          {msg.text}
        </p>
      )}
    </section>
  );
}
