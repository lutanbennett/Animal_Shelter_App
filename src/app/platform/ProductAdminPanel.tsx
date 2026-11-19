"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { ActionButton } from "@/components/ActionButton";
import { ACTION_ICONS } from "@/components/hub-icons";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useWriteCall } from "@/lib/use-write-form";
import {
  addProductAdmin,
  createShelter,
  createShelterAdminRole,
  linkShelterAdmin,
  loginExists,
  mapShelterHost,
  removeProductAdmin,
  seedShelterDefaults,
  unmapShelterHost,
} from "./actions";

type Status = "not_started" | "incomplete" | "connected" | "dead";
export type ShelterRow = {
  id: string;
  key: string;
  name: string;
  created_at: string;
  hosts: string[] | null;
  has_host: boolean;
  has_admin_role: boolean;
  has_admin_login: boolean;
  has_receipts: boolean;
  has_defaults: boolean;
  has_site_content: boolean;
  drive_status: Status;
  calendar_status: Status;
};
export type PersonRow = { kind: string; shelterId: string | null; userId: string; email: string | null };

type StepKey = "host" | "role" | "login" | "receipts" | "defaults";

/**
 * The shelters and the product administrators (#shmgt, #padui), on the platform front door (#pltfd).
 * Every shelter shows which setup steps are done and which is next, as a read, so it is drawn at aal1 too.
 * Controls that act are drawn only when the database would accept them (aal2, 0411): at aal1 one notice at the
 * top sends the person to the step-up. The gate is is_product_admin() plus aal2, not a card (Lutan, 2026-11-18).
 */
export function ProductAdminPanel({
  shelters,
  people,
  selfId,
  canWrite,
  stepUpPath,
}: {
  shelters: ShelterRow[];
  people: PersonRow[];
  selfId: string;
  canWrite: boolean;
  stepUpPath: string;
}) {
  const { t } = useI18n();
  const p = t.admin.productAdmin;
  const call = useWriteCall();
  const [pending, startTransition] = useTransition();
  const [shelterKey, setShelterKey] = useState("");
  const [shelterName, setShelterName] = useState("");
  const [hostDrafts, setHostDrafts] = useState<Record<string, string>>({});
  const [emailDrafts, setEmailDrafts] = useState<Record<string, string>>({});
  const [found, setFound] = useState<Record<string, boolean | null>>({});
  const [adminEmail, setAdminEmail] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const say = (ok: boolean, text: string) => setMsg({ ok, text });
  const admins = people.filter((x) => x.kind === "product_admin");
  const emailOf = (shelterId: string) => people.find((x) => x.kind === "shelter_admin" && x.shelterId === shelterId)?.email ?? p.noEmail;

  const lookup = (shelterId: string) => {
    const v = (emailDrafts[shelterId] ?? "").trim();
    if (!v) return setFound((f) => ({ ...f, [shelterId]: null }));
    startTransition(async () => {
      const r = await loginExists(v);
      setFound((f) => ({ ...f, [shelterId]: r.ok ? (r.exists ?? false) : null }));
      if (!r.ok) say(false, r.error ?? "");
    });
  };

  const statusLine = (kind: "drive" | "cal", s: Status) => {
    const text = {
      drive: { not_started: p.driveNotStarted, incomplete: p.driveIncomplete, connected: p.driveConnected, dead: p.driveDead },
      cal: { not_started: p.calNotStarted, incomplete: p.calIncomplete, connected: p.calConnected, dead: p.calDead },
    }[kind][s];
    const tone = s === "connected" ? "text-success" : s === "dead" ? "text-danger" : s === "incomplete" ? "text-warning" : "text-muted";
    return (
      <li key={kind} className={`text-sm ${tone}`}>
        {text}
      </li>
    );
  };

  const stepUpNotice = (
    <p className="max-w-prose rounded-lg border border-border bg-surface p-3 text-sm text-foreground">
      {p.readOnlyTop} {p.stepUp}{" "}
      <Link href={stepUpPath} className="font-medium underline">
        {p.stepUpLink}
      </Link>
    </p>
  );

  return (
    <div className="flex flex-col gap-8">
      {!canWrite && stepUpNotice}
      {msg && (
        <p role="status" className={`text-sm ${msg.ok ? "text-success" : "text-danger"}`}>
          {msg.text}
        </p>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-foreground">{p.sheltersTitle}</h2>
        {shelters.length === 0 && <p className="text-sm text-muted">{p.noShelters}</p>}
        {shelters.map((s) => {
          const steps: { key: StepKey; done: boolean; label: string }[] = [
            { key: "host", done: s.has_host, label: p.stepHost },
            { key: "role", done: s.has_admin_role, label: p.stepAdminRole },
            { key: "login", done: s.has_admin_login, label: p.stepAdminLogin },
            { key: "receipts", done: s.has_receipts, label: p.stepReceipts },
            { key: "defaults", done: s.has_defaults, label: p.stepDefaults },
          ];
          const next = steps.find((x) => !x.done)?.key ?? null;
          const draft = emailDrafts[s.id] ?? "";
          return (
            <article key={s.id} className="flex flex-col gap-3 rounded-lg border border-border p-4">
              <header>
                <h3 className="text-base font-semibold text-foreground">{s.name}</h3>
                <p className="text-xs text-muted">
                  <span className="font-mono">{s.key}</span> · {p.shelterCreated} {s.created_at.slice(0, 10)}
                </p>
              </header>

              <ol className="flex flex-col gap-2">
                {steps.map((st) => (
                  <li key={st.key} className="flex flex-col gap-1">
                    <span className={`text-sm ${st.done ? "text-success" : st.key === next ? "font-semibold text-foreground" : "text-muted"}`}>
                      {st.done ? "✓ " : st.key === next ? `→ ${p.nextStep}: ` : "○ "}
                      {st.label}
                      {st.key === "login" && st.done ? ` (${emailOf(s.id)})` : ""}
                    </span>
                    {st.key === "role" && !st.done && canWrite && st.key === next && (
                      <div>
                        <ActionButton
                          icon={ACTION_ICONS.add}
                          variant="primary"
                          compact
                          disabled={pending}
                          onClick={() =>
                            startTransition(async () => {
                              const r = await call((id) => createShelterAdminRole(s.id, id));
                              say(r.ok, r.ok ? p.adminRoleGiven : (r.error ?? ""));
                            })
                          }
                        >
                          {p.giveAdminRole}
                        </ActionButton>
                      </div>
                    )}
                    {st.key === "login" && !st.done && canWrite && st.key === next && (
                      <form
                        className="flex flex-col gap-1"
                        onSubmit={(ev) => {
                          ev.preventDefault();
                          startTransition(async () => {
                            const r = await call((id) => linkShelterAdmin(s.id, draft, id));
                            say(r.ok, r.ok ? p.adminLinked : (r.error ?? ""));
                            if (r.ok) setEmailDrafts((d) => ({ ...d, [s.id]: "" }));
                          });
                        }}
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <input
                            type="email"
                            aria-label={p.linkAccountId}
                            placeholder={p.linkAccountId}
                            value={draft}
                            onChange={(e) => {
                              setEmailDrafts((d) => ({ ...d, [s.id]: e.target.value }));
                              setFound((f) => ({ ...f, [s.id]: null }));
                            }}
                            onBlur={() => lookup(s.id)}
                            className="min-h-11 rounded border border-border bg-background px-3 md:min-h-9"
                            autoComplete="off"
                            spellCheck={false}
                          />
                          <ActionButton icon={ACTION_ICONS.add} variant="primary" compact type="submit" disabled={pending || draft.trim() === "" || found[s.id] === false}>
                            {p.linkAdmin}
                          </ActionButton>
                        </div>
                        {found[s.id] === false && <span className="text-sm text-danger">{p.errors.noLoginForAddress}</span>}
                        <span className="max-w-prose text-xs text-muted">{p.linkHelp}</span>
                      </form>
                    )}
                    {st.key === "receipts" && !st.done && st.key === next && <span className="max-w-prose text-xs text-muted">{p.receiptsNote}</span>}
                    {st.key === "defaults" && !st.done && canWrite && (
                      <div>
                        <ActionButton
                          icon={ACTION_ICONS.add}
                          variant="primary"
                          compact
                          disabled={pending}
                          onClick={() =>
                            startTransition(async () => {
                              const r = await call((id) => seedShelterDefaults(s.id, id));
                              say(r.ok, r.ok ? p.seeded : (r.error ?? ""));
                            })
                          }
                        >
                          {p.seedDefaults}
                        </ActionButton>
                      </div>
                    )}
                  </li>
                ))}
              </ol>

              {!s.has_site_content && (
                <div className="flex flex-wrap items-center gap-2 text-sm text-warning">
                  <span>{p.siteContentMissing}</span>
                  {canWrite && (
                    <ActionButton
                      icon={ACTION_ICONS.add}
                      variant="primary"
                      compact
                      disabled={pending}
                      onClick={() =>
                        startTransition(async () => {
                          const r = await call((id) => seedShelterDefaults(s.id, id));
                          say(r.ok, r.ok ? p.seeded : (r.error ?? ""));
                        })
                      }
                    >
                      {p.seedDefaults}
                    </ActionButton>
                  )}
                </div>
              )}

              <ul className="flex flex-col gap-1">
                {statusLine("drive", s.drive_status)}
                {statusLine("cal", s.calendar_status)}
              </ul>

              <div className="flex flex-col gap-2 border-t border-border pt-3">
                <span className="text-sm font-medium text-foreground">{p.shelterHosts}</span>
                {s.hosts && s.hosts.length > 0 ? (
                  <ul className="flex flex-col gap-1 text-sm">
                    {s.hosts.map((h) => (
                      <li key={h} className="flex flex-wrap items-center gap-2 break-all">
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
                                const r = await call((id) => unmapShelterHost(h, id));
                                say(r.ok, r.ok ? p.unmapped : (r.error ?? ""));
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
                  <span className="text-sm text-muted">{p.noHosts}</span>
                )}
                {canWrite && (
                  <form
                    className="flex flex-wrap items-center gap-2"
                    onSubmit={(ev) => {
                      ev.preventDefault();
                      startTransition(async () => {
                        const r = await call((id) => mapShelterHost(s.id, hostDrafts[s.id] ?? "", id));
                        say(r.ok, r.ok ? p.mapped : (r.error ?? ""));
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
              </div>
            </article>
          );
        })}
        {canWrite && <p className="max-w-prose text-xs text-muted">{p.mapHelp}</p>}

        {canWrite && (
          <form
            className="flex max-w-xl flex-col gap-2 pt-2"
            onSubmit={(ev) => {
              ev.preventDefault();
              startTransition(async () => {
                const r = await call((id) => createShelter(shelterKey, shelterName, id));
                say(r.ok, r.ok ? p.created(r.created) : (r.error ?? ""));
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
              <input value={shelterKey} onChange={(e) => setShelterKey(e.target.value)} className="min-h-11 rounded border border-border bg-background px-3 font-mono md:min-h-9" autoComplete="off" spellCheck={false} />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              {p.createName}
              <input value={shelterName} onChange={(e) => setShelterName(e.target.value)} className="min-h-11 rounded border border-border bg-background px-3 md:min-h-9" autoComplete="off" />
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
        <ul className="flex flex-col divide-y divide-border rounded-lg border border-border">
          {admins.map((a) => (
            <li key={a.userId} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm">
              <span className="break-all">
                {a.email ?? p.noEmail}
                {a.userId === selfId && <span className="text-muted"> ({p.you})</span>}
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
                      const r = await call((id) => removeProductAdmin(a.userId, id));
                      say(r.ok, r.ok ? p.removed : (r.error ?? ""));
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
                const r = await call((id) => addProductAdmin(adminEmail, id));
                say(r.ok, r.ok ? p.added : (r.error ?? ""));
                if (r.ok) setAdminEmail("");
              });
            }}
          >
            <h3 className="text-base font-semibold text-foreground">{p.addTitle}</h3>
            <p className="text-sm text-muted">{p.addHelp}</p>
            <label className="flex flex-col gap-1 text-sm">
              {p.accountId}
              <input type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} className="min-h-11 rounded border border-border bg-background px-3 md:min-h-9" autoComplete="off" spellCheck={false} />
            </label>
            <div>
              <ActionButton icon={ACTION_ICONS.add} variant="primary" type="submit" disabled={pending || adminEmail.trim() === ""}>
                {p.add}
              </ActionButton>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
