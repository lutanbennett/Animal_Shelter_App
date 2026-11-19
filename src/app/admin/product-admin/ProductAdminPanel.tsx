"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { ActionButton } from "@/components/ActionButton";
import { ACTION_ICONS } from "@/components/hub-icons";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useWriteCall } from "@/lib/use-write-form";
import { addProductAdmin, createShelter, createShelterAdminRole, linkShelterAdmin, mapShelterHost, removeProductAdmin, unmapShelterHost } from "./actions";

export type ShelterRow = { id: string; key: string; name: string; created_at: string; hosts: string[] | null };
export type PadminRow = { userId: string; createdAt: string };

/**
 * The shelters and the product administrators (#shmgt). Add and Remove are drawn only when the database
 * would accept them: the writes need aal2 (0411), so at aal1 the person is sent to the step-up instead of
 * being offered a button that is refused. The gate is is_product_admin() plus aal2, not a card: PADMIN sits
 * outside the card system (Lutan, 2026-11-18).
 */
export function ProductAdminPanel({
  shelters,
  admins,
  selfId,
  selfEmail,
  canWrite,
  stepUpPath,
}: {
  shelters: ShelterRow[];
  admins: PadminRow[];
  selfId: string;
  selfEmail: string | null;
  canWrite: boolean;
  stepUpPath: string;
}) {
  const { t } = useI18n();
  const p = t.admin.productAdmin;
  const addCall = useWriteCall();
  const removeCall = useWriteCall();
  const createCall = useWriteCall();
  const mapCall = useWriteCall();
  const unmapCall = useWriteCall();
  const roleCall = useWriteCall();
  const linkCall = useWriteCall();
  const [linkDrafts, setLinkDrafts] = useState<Record<string, string>>({});
  const [shelterKey, setShelterKey] = useState("");
  const [shelterName, setShelterName] = useState("");
  const [hostDrafts, setHostDrafts] = useState<Record<string, string>>({});
  const [shelterMsg, setShelterMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [accountId, setAccountId] = useState("");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-foreground">{p.sheltersTitle}</h2>
        {shelters.length === 0 ? (
          <p className="text-sm text-muted">{p.noShelters}</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface text-muted">
                <tr>
                  <th className="px-3 py-2">{p.shelterKey}</th>
                  <th className="px-3 py-2">{p.shelterName}</th>
                  <th className="px-3 py-2">{p.shelterCreated}</th>
                  <th className="px-3 py-2">{p.shelterHosts}</th>
                </tr>
              </thead>
              <tbody>
                {shelters.map((s) => (
                  <tr key={s.id} className="border-t border-border">
                    <td className="px-3 py-2 font-mono">{s.key}</td>
                    <td className="px-3 py-2">{s.name}</td>
                    <td className="px-3 py-2">{s.created_at.slice(0, 10)}</td>
                    <td className="px-3 py-2 break-all">
                      {s.hosts && s.hosts.length > 0 ? (
                        <ul className="flex flex-col gap-1">
                          {s.hosts.map((h) => (
                            <li key={h} className="flex flex-wrap items-center gap-2">
                              <span>{h}</span>
                              {canWrite && (
                                <ActionButton
                                  icon={ACTION_ICONS.delete}
                                  variant="danger"
                                  compact
                                  disabled={pending}
                                  onClick={() => {
                                    if (!window.confirm(p.unmapConfirm(h))) return;
                                    startTransition(async () => {
                                      const r = await unmapCall((id) => unmapShelterHost(h, id));
                                      setShelterMsg(r.ok ? { ok: true, text: p.unmapped } : { ok: false, text: r.error ?? "" });
                                    });
                                  }}
                                >
                                  {p.unmapHost}
                                </ActionButton>
                              )}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        p.noHosts
                      )}
                      {canWrite && (
                        <div className="flex flex-col gap-2 pt-3">
                          <span className="font-medium text-foreground">{p.adminRoleTitle}</span>
                          <div>
                            <ActionButton
                              icon={ACTION_ICONS.add}
                              variant="primary"
                              compact
                              disabled={pending}
                              onClick={() =>
                                startTransition(async () => {
                                  const r = await roleCall((id) => createShelterAdminRole(s.id, id));
                                  setShelterMsg(r.ok ? { ok: true, text: p.adminRoleGiven } : { ok: false, text: r.error ?? "" });
                                })
                              }
                            >
                              {p.giveAdminRole}
                            </ActionButton>
                          </div>
                          <form
                            className="flex flex-wrap items-center gap-2"
                            onSubmit={(ev) => {
                              ev.preventDefault();
                              startTransition(async () => {
                                const r = await linkCall((id) => linkShelterAdmin(s.id, linkDrafts[s.id] ?? "", id));
                                setShelterMsg(r.ok ? { ok: true, text: p.adminLinked } : { ok: false, text: r.error ?? "" });
                                if (r.ok) setLinkDrafts((d) => ({ ...d, [s.id]: "" }));
                              });
                            }}
                          >
                            <input
                              aria-label={p.linkAccountId}
                              placeholder={p.linkAccountId}
                              value={linkDrafts[s.id] ?? ""}
                              onChange={(e) => setLinkDrafts((d) => ({ ...d, [s.id]: e.target.value }))}
                              className="min-h-11 rounded border border-border bg-background px-3 font-mono md:min-h-9"
                              autoComplete="off"
                              spellCheck={false}
                            />
                            <ActionButton icon={ACTION_ICONS.add} variant="primary" compact type="submit" disabled={pending || (linkDrafts[s.id] ?? "").trim() === ""}>
                              {p.linkAdmin}
                            </ActionButton>
                          </form>
                        </div>
                      )}
                      {canWrite && (
                        <form
                          className="flex flex-wrap items-center gap-2 pt-2"
                          onSubmit={(ev) => {
                            ev.preventDefault();
                            startTransition(async () => {
                              const r = await mapCall((id) => mapShelterHost(s.id, hostDrafts[s.id] ?? "", id));
                              setShelterMsg(r.ok ? { ok: true, text: p.mapped } : { ok: false, text: r.error ?? "" });
                              if (r.ok) setHostDrafts((d) => ({ ...d, [s.id]: "" }));
                            });
                          }}
                        >
                          <input
                            aria-label={p.host}
                            placeholder={p.host}
                            value={hostDrafts[s.id] ?? ""}
                            onChange={(e) => setHostDrafts((d) => ({ ...d, [s.id]: e.target.value }))}
                            className="min-h-11 rounded border border-border bg-background px-3 font-mono md:min-h-9"
                            autoComplete="off"
                            spellCheck={false}
                          />
                          <ActionButton icon={ACTION_ICONS.add} variant="primary" compact type="submit" disabled={pending || (hostDrafts[s.id] ?? "").trim() === ""}>
                            {p.mapHost}
                          </ActionButton>
                        </form>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="text-xs text-muted">{p.shelterNote}</p>
        {canWrite && <p className="max-w-prose text-xs text-muted">{p.mapHelp}</p>}
        {canWrite && <p className="max-w-prose text-xs text-muted">{p.linkHelp}</p>}
        {shelterMsg && (
          <p role="status" className={`text-sm ${shelterMsg.ok ? "text-success" : "text-danger"}`}>
            {shelterMsg.text}
          </p>
        )}
        {!canWrite && (
          <p className="max-w-prose rounded-lg border border-border bg-surface p-3 text-sm text-foreground">
            {p.stepUp}{" "}
            <Link href={stepUpPath} className="font-medium underline">
              {p.stepUpLink}
            </Link>
          </p>
        )}
        {canWrite && (
          <form
            className="flex max-w-xl flex-col gap-2 pt-2"
            onSubmit={(ev) => {
              ev.preventDefault();
              startTransition(async () => {
                const r = await createCall((id) => createShelter(shelterKey, shelterName, id));
                setShelterMsg(r.ok ? { ok: true, text: p.created(r.created) } : { ok: false, text: r.error ?? "" });
                if (r.ok) {
                  setShelterKey("");
                  setShelterName("");
                }
              });
            }}
          >
            <h3 className="text-base font-semibold text-foreground">{p.createTitle}</h3>
            <p className="text-sm text-muted">{p.createHelp}</p>
            <label className="flex flex-col gap-1 text-sm">
              {p.createKey}
              <input
                value={shelterKey}
                onChange={(e) => setShelterKey(e.target.value)}
                className="min-h-11 rounded border border-border bg-background px-3 font-mono md:min-h-9"
                autoComplete="off"
                spellCheck={false}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              {p.createName}
              <input
                value={shelterName}
                onChange={(e) => setShelterName(e.target.value)}
                className="min-h-11 rounded border border-border bg-background px-3 md:min-h-9"
                autoComplete="off"
              />
            </label>
            <div>
              <ActionButton icon={ACTION_ICONS.add} variant="primary" type="submit" disabled={pending || shelterKey.trim() === "" || shelterName.trim() === ""}>
                {p.create}
              </ActionButton>
            </div>
          </form>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-foreground">{p.adminsTitle}</h2>
        {!canWrite && (
          <p className="max-w-prose rounded-lg border border-border bg-surface p-3 text-sm text-foreground">
            {p.stepUp}{" "}
            <Link href={stepUpPath} className="font-medium underline">
              {p.stepUpLink}
            </Link>
          </p>
        )}
        {message && (
          <p role="status" className={`text-sm ${message.ok ? "text-success" : "text-danger"}`}>
            {message.text}
          </p>
        )}
        <ul className="flex flex-col divide-y divide-border rounded-lg border border-border">
          {admins.map((a) => (
            <li key={a.userId} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm">
              <span className="break-all">
                <span className="font-mono">{a.userId}</span>
                {a.userId === selfId && (
                  <span className="text-muted">
                    {" "}
                    ({p.you}
                    {selfEmail ? `: ${selfEmail}` : ""})
                  </span>
                )}
              </span>
              {canWrite && a.userId !== selfId && (
                <ActionButton
                  icon={ACTION_ICONS.delete}
                  variant="danger"
                  compact
                  disabled={pending}
                  onClick={() => {
                    if (!window.confirm(p.removeConfirm)) return;
                    startTransition(async () => {
                      const r = await removeCall((id) => removeProductAdmin(a.userId, id));
                      setMessage(r.ok ? { ok: true, text: p.removed } : { ok: false, text: r.error ?? "" });
                    });
                  }}
                >
                  {p.remove}
                </ActionButton>
              )}
            </li>
          ))}
        </ul>
        {admins.length <= 1 && <p className="text-sm text-muted">{p.noAdmins}</p>}

        {canWrite && (
          <form
            className="flex max-w-xl flex-col gap-2 pt-2"
            onSubmit={(ev) => {
              ev.preventDefault();
              startTransition(async () => {
                const r = await addCall((id) => addProductAdmin(accountId, id));
                setMessage(r.ok ? { ok: true, text: p.added } : { ok: false, text: r.error ?? "" });
                if (r.ok) setAccountId("");
              });
            }}
          >
            <h3 className="text-base font-semibold text-foreground">{p.addTitle}</h3>
            <p className="text-sm text-muted">{p.addHelp}</p>
            <label className="flex flex-col gap-1 text-sm">
              {p.accountId}
              <input
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="min-h-11 rounded border border-border bg-background px-3 font-mono md:min-h-9"
                autoComplete="off"
                spellCheck={false}
              />
            </label>
            <div>
              <ActionButton icon={ACTION_ICONS.add} variant="primary" type="submit" disabled={pending || accountId.trim() === ""}>
                {p.add}
              </ActionButton>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
