"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { ActionButton } from "@/components/ActionButton";
import { TemporaryPasswordNotice } from "@/components/TemporaryPasswordNotice";
import { ACTION_ICONS } from "@/components/hub-icons";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useWriteCall } from "@/lib/use-write-form";
import {
  addProductAdmin,
  createShelter,
  createShelterFromEnquiry,
  setEnquiryStatus,
  createShelterAdminRole,
  linkShelterAdmin,
  createShelterAdminLogin,
  loginExists,
  mapShelterHost,
  removeProductAdmin,
  seedShelterDefaults,
  setShelterAccountHolder,
  setShelterArchived,
  setShelterNames,
  setShelterPrimaryHost,
  setShelterReceipts,
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
  display_name: string | null;
  short_name: string | null;
  primary_host: string | null;
  account_holder_name: string | null;
  account_holder_email: string | null;
  account_holder_phone: string | null;
  account_holder_location: string | null;
  enquiry_id: string | null;
  archived_at: string | null;
  public_site: string | null;
};
export type EnquiryRow = {
  id: string;
  created_at: string;
  shelter_name: string;
  contact_name: string;
  email: string;
  phone: string | null;
  location: string | null;
  message: string | null;
  status: "new" | "contacted" | "created" | "declined";
  status_note: string | null;
  status_at: string | null;
};
export type PersonRow = { kind: string; shelterId: string | null; userId: string; email: string | null };
/** The database check's state, shared by every shelter (null when it was not run). */
export type SystemState = "ok" | "warn" | "fail" | "off" | null;

type StepKey = "host" | "role" | "login" | "receipts" | "defaults";
type CardState = "closed" | "broken" | "setup" | "ready";

/** The four card states, first match wins (docs/decisions/2026-11-20-shelter-state-schema.md). Derived from what is already read: no column. */
export function cardState(s: ShelterRow): CardState {
  if (s.archived_at) return "closed";
  if (s.drive_status === "dead" || s.calendar_status === "dead") return "broken";
  if (!(s.has_host && s.has_admin_role && s.has_admin_login && s.has_receipts && s.has_defaults)) return "setup";
  return "ready";
}

/** The website: the primary address, else the first address (offered as "make this the website"), else none. */
function websiteOf(s: ShelterRow): { host: string | null; isPrimary: boolean } {
  if (s.primary_host) return { host: s.primary_host, isPrimary: true };
  return { host: s.hosts?.[0] ?? null, isPrimary: false };
}

const input = "min-h-11 rounded border border-border bg-background px-3 md:min-h-9";

/**
 * The shelters and the product administrators (#shmgt, #padui, #pacon), on the platform front door (#pltfd).
 * The landing is one card per shelter: its name, its website, its account holder and its state. Everything else is behind the card.
 * Every answer is drawn BESIDE the control that caused it, under its own key (#msgtp): one shared slot sat two screens above the buttons
 * and made working saves look broken.
 * Controls that act are drawn only when the database would accept them (aal2, 0411): at aal1 one notice at the top sends the person
 * to the step-up. The gate is is_product_admin() plus aal2, not a card (Lutan, 2026-11-18); no role is checked here.
 */
export function ProductAdminPanel({
  enquiries,
  shelters,
  people,
  selfId,
  canWrite,
  stepUpPath,
  systemDatabase,
}: {
  enquiries: EnquiryRow[];
  shelters: ShelterRow[];
  people: PersonRow[];
  selfId: string;
  canWrite: boolean;
  stepUpPath: string;
  systemDatabase: SystemState;
}) {
  const { t } = useI18n();
  const p = t.admin.productAdmin;
  const call = useWriteCall();
  const [pending, startTransition] = useTransition();
  const [openId, setOpenId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [shelterKey, setShelterKey] = useState("");
  const [shelterName, setShelterName] = useState("");
  const [hostDrafts, setHostDrafts] = useState<Record<string, string>>({});
  const [emailDrafts, setEmailDrafts] = useState<Record<string, string>>({});
  const [found, setFound] = useState<Record<string, boolean | null>>({});
  const [receiptDrafts, setReceiptDrafts] = useState<Record<string, { series: string; name: string; address: string }>>({});
  const [holderDrafts, setHolderDrafts] = useState<Record<string, { name: string; email: string; phone: string; location: string }>>({});
  const [adminEmail, setAdminEmail] = useState("");
  const [newLogin, setNewLogin] = useState<{ email: string; password: string } | null>(null);
  // One slot PER control, keyed by what was pressed, so two actions can never overwrite each other's answer.
  const [msgs, setMsgs] = useState<Record<string, { ok: boolean; text: string }>>({});
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [fromDrafts, setFromDrafts] = useState<Record<string, { key: string; name: string }>>({});
  const [nameDrafts, setNameDrafts] = useState<Record<string, { full: string; short: string }>>({});

  const say = (key: string, ok: boolean, text: string) => setMsgs((m) => ({ ...m, [key]: { ok, text } }));
  const note = (key: string) =>
    msgs[key] ? (
      <p role="status" className={`text-sm ${msgs[key].ok ? "text-success" : "text-danger"}`}>
        {msgs[key].text}
      </p>
    ) : null;
  const nameDraft = (s: ShelterRow) => nameDrafts[s.id] ?? { full: s.display_name ?? "", short: s.short_name ?? "" };
  const holderDraft = (s: ShelterRow) =>
    holderDrafts[s.id] ?? {
      name: s.account_holder_name ?? "",
      email: s.account_holder_email ?? "",
      phone: s.account_holder_phone ?? "",
      location: s.account_holder_location ?? "",
    };
  const setReceiptDraft = (id: string, patch: Partial<{ series: string; name: string; address: string }>) =>
    setReceiptDrafts((d) => ({ ...d, [id]: { ...(d[id] ?? { series: "", name: "", address: "" }), ...patch } }));
  const admins = people.filter((x) => x.kind === "product_admin");
  const emailOf = (shelterId: string) => people.find((x) => x.kind === "shelter_admin" && x.shelterId === shelterId)?.email ?? p.noEmail;

  const lookup = (shelterId: string) => {
    const v = (emailDrafts[shelterId] ?? "").trim();
    if (!v) return setFound((f) => ({ ...f, [shelterId]: null }));
    startTransition(async () => {
      const r = await loginExists(v);
      setFound((f) => ({ ...f, [shelterId]: r.ok ? (r.exists ?? false) : null }));
      if (!r.ok) say(`login:${shelterId}`, false, r.error ?? "");
    });
  };

  const stateWords: Record<CardState, string> = { closed: p.stateClosed, broken: p.stateBroken, setup: p.stateSetup, ready: p.stateReady };
  const stateTone: Record<CardState, string> = {
    closed: "border-border bg-surface text-muted",
    broken: "border-danger text-danger",
    setup: "border-border bg-surface text-foreground",
    ready: "border-success text-success",
  };
  const badge = (st: CardState) => <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${stateTone[st]}`}>{stateWords[st]}</span>;

  const stepsOf = (s: ShelterRow): { key: StepKey; done: boolean; label: string }[] => [
    { key: "host", done: s.has_host, label: p.stepHost },
    { key: "role", done: s.has_admin_role, label: p.stepAdminRole },
    { key: "login", done: s.has_admin_login, label: p.stepAdminLogin },
    { key: "receipts", done: s.has_receipts, label: p.stepReceipts },
    { key: "defaults", done: s.has_defaults, label: p.stepDefaults },
  ];

  /** Archive or reopen. Closing asks first, in plain words; reopening is harmless so it just does it. */
  const setArchived = (s: ShelterRow, archived: boolean) => {
    if (archived && !window.confirm(p.closeConfirm(s.name))) return;
    startTransition(async () => {
      const r = await call((id) => setShelterArchived(s.id, archived, id));
      say(`archive:${s.id}`, r.ok, r.ok ? (archived ? p.closed : p.reopened) : (r.error ?? ""));
    });
  };

  const stepUpNotice = (
    <p className="max-w-prose rounded-lg border border-border bg-surface p-3 text-sm text-foreground">
      {p.readOnlyTop} {p.stepUp}{" "}
      <Link href={stepUpPath} className="font-medium underline">
        {p.stepUpLink}
      </Link>
    </p>
  );

  const open = shelters.find((x) => x.id === openId) ?? null;

  /* ------------------------------------------------------------------- an enquiry (a stranger's free text: drawn as text only, never as markup) */
  const newEnquiries = enquiries.filter((x) => x.status === "new").length;
  const enquiryCard = (x: EnquiryRow) => {
    const q = p.enquiries;
    const statusWords = { new: q.statusNew, contacted: q.statusContacted, created: q.statusCreated, declined: q.statusDeclined };
    const isOpen = x.status === "new" || x.status === "contacted";
    const made = shelters.find((s) => s.enquiry_id === x.id);
    const fd = fromDrafts[x.id] ?? { key: "", name: x.shelter_name };
    const rows: [string, string | null][] = [
      [q.from, x.contact_name],
      [q.email, x.email],
      [q.phone, x.phone],
      [q.location, x.location],
      [q.arrived, x.created_at.slice(0, 16).replace("T", " ")],
    ];
    return (
      <article key={x.id} className="flex flex-col gap-2 rounded-lg border border-border p-4">
        <header className="flex flex-wrap items-start justify-between gap-2">
          <h3 className="text-base font-semibold text-foreground">{x.shelter_name}</h3>
          <span className="rounded-full border border-border bg-surface px-2 py-0.5 text-xs font-medium text-foreground">{statusWords[x.status]}</span>
        </header>
        <dl className="flex flex-col gap-1 text-sm">
          {rows
            .filter(([, v]) => v)
            .map(([k, v]) => (
              <div key={k} className="flex flex-wrap gap-x-2">
                <dt className="text-muted">{k}</dt>
                <dd className="break-all text-foreground">{v}</dd>
              </div>
            ))}
          {x.message && (
            <div className="flex flex-col">
              <dt className="text-muted">{q.message}</dt>
              <dd className="whitespace-pre-wrap break-words text-foreground">{x.message}</dd>
            </div>
          )}
        </dl>
        {x.status_note && <p className="text-xs text-muted">{x.status_note}</p>}
        {made && <p className="text-sm text-success">{made.name}</p>}
        {canWrite && isOpen && (
          <div className="flex flex-col gap-2 border-t border-border pt-2">
            <label className="flex max-w-xl flex-col gap-1 text-sm">
              {q.note}
              <input value={noteDrafts[x.id] ?? ""} maxLength={2000} onChange={(e) => setNoteDrafts((d) => ({ ...d, [x.id]: e.target.value }))} className={input} autoComplete="off" />
            </label>
            <div className="flex flex-wrap gap-3">
              {x.status === "new" && (
                <div className="flex flex-col gap-1">
                  <ActionButton
                    icon={ACTION_ICONS.edit}
                    variant="secondary"
                    compact
                    disabled={pending}
                    onClick={() =>
                      startTransition(async () => {
                        const r = await call((id) => setEnquiryStatus(x.id, "contacted", noteDrafts[x.id] ?? "", id));
                        say(`enq-contacted:${x.id}`, r.ok, r.ok ? q.contacted : (r.error ?? ""));
                      })
                    }
                  >
                    {q.markContacted}
                  </ActionButton>
                  {note(`enq-contacted:${x.id}`)}
                </div>
              )}
              <div className="flex flex-col gap-1">
                <ActionButton
                  icon={ACTION_ICONS.delete}
                  variant="danger"
                  compact
                  disabled={pending}
                  onClick={() => {
                    if (!window.confirm(q.declineConfirm(x.shelter_name))) return;
                    startTransition(async () => {
                      const r = await call((id) => setEnquiryStatus(x.id, "declined", noteDrafts[x.id] ?? "", id));
                      say(`enq-declined:${x.id}`, r.ok, r.ok ? q.declined : (r.error ?? ""));
                    });
                  }}
                >
                  {q.markDeclined}
                </ActionButton>
                {note(`enq-declined:${x.id}`)}
              </div>
            </div>
            <form
              className="flex max-w-xl flex-col gap-2 border-t border-border pt-2"
              onSubmit={(ev) => {
                ev.preventDefault();
                startTransition(async () => {
                  const r = await call((id) => createShelterFromEnquiry(x.id, fd.key, fd.name, id));
                  say(`enq-create:${x.id}`, r.ok, r.ok ? `${q.createdShelter} ${q.carried(r.carried)}` : (r.error ?? ""));
                  if (r.ok) setFromDrafts((d) => ({ ...d, [x.id]: { key: "", name: fd.name } }));
                });
              }}
            >
              <h4 className="text-sm font-semibold text-foreground">{q.createFrom}</h4>
              <label className="flex flex-col gap-1 text-sm">
                {q.keyLabel}
                <input value={fd.key} onChange={(e) => setFromDrafts((d) => ({ ...d, [x.id]: { ...fd, key: e.target.value } }))} className={`${input} font-mono`} autoComplete="off" spellCheck={false} />
              </label>
              <span className="max-w-prose text-xs text-muted">
                {q.keyHelp} {p.createHelp}
              </span>
              <label className="flex flex-col gap-1 text-sm">
                {q.nameLabel}
                <input value={fd.name} onChange={(e) => setFromDrafts((d) => ({ ...d, [x.id]: { ...fd, name: e.target.value } }))} className={input} autoComplete="off" />
              </label>
              <div>
                <ActionButton icon={ACTION_ICONS.add} variant="primary" compact type="submit" disabled={pending || fd.key.trim() === "" || fd.name.trim() === ""}>
                  {q.createButton}
                </ActionButton>
              </div>
              {note(`enq-create:${x.id}`)}
            </form>
          </div>
        )}
      </article>
    );
  };

  /* ----------------------------------------------------------------------------------------------- landing: one card per shelter */
  const card = (s: ShelterRow) => {
    const st = cardState(s);
    const w = websiteOf(s);
    const nextStep = stepsOf(s).find((x) => !x.done);
    const holder = [s.account_holder_name, s.account_holder_phone].filter(Boolean).join(" · ");
    return (
      <article key={s.id} className="flex flex-col gap-2 rounded-lg border border-border p-4">
        <header className="flex flex-wrap items-start justify-between gap-2">
          <h3 className="text-base font-semibold text-foreground">{s.name}</h3>
          {badge(st)}
        </header>
        {st === "closed" ? (
          <>
            <p className="text-sm text-muted">{p.closedCardNote}</p>
            {canWrite && (
              <div>
                <ActionButton icon={ACTION_ICONS.add} variant="primary" compact disabled={pending} onClick={() => setArchived(s, false)}>
                  {p.reopenButton}
                </ActionButton>
              </div>
            )}
            {note(`archive:${s.id}`)}
          </>
        ) : (
          <>
            {st === "broken" && (
              <p className="text-sm font-medium text-danger">
                {s.drive_status === "dead" ? p.brokenDrive : p.brokenCalendar}
              </p>
            )}
            {st === "setup" && nextStep && (
              <p className="text-sm font-semibold text-foreground">
                → {p.nextStep}: {nextStep.label}
              </p>
            )}
            <dl className="flex flex-col gap-1 text-sm">
              <div className="flex flex-wrap gap-x-2">
                <dt className="text-muted">{p.websiteLabel}</dt>
                <dd className="break-all text-foreground">{w.host ?? p.websiteNone}</dd>
              </div>
              <div className="flex flex-wrap gap-x-2">
                <dt className="text-muted">{p.accountHolderLabel}</dt>
                <dd className="text-foreground">{holder || p.noAccountHolder}</dd>
              </div>
            </dl>
            <div>
              <ActionButton icon={ACTION_ICONS.edit} variant="primary" compact onClick={() => setOpenId(s.id)}>
                {p.openSettings}
              </ActionButton>
            </div>
          </>
        )}
      </article>
    );
  };

  /* ----------------------------------------------------------------------------------------- behind the card: one shelter's settings */
  const settings = (s: ShelterRow) => {
    const st = cardState(s);
    const steps = stepsOf(s);
    const next = steps.find((x) => !x.done)?.key ?? null;
    const draft = emailDrafts[s.id] ?? "";
    const w = websiteOf(s);
    const hd = holderDraft(s);
    const doneCount = steps.filter((x) => x.done).length;
    const siteWords = s.public_site === "off" ? p.healthSiteOff : s.public_site === "locked" ? p.healthSiteLocked : p.healthSiteOpen;
    const statusTone = (x: Status) => (x === "connected" ? "text-success" : x === "dead" ? "text-danger" : x === "incomplete" ? "text-warning" : "text-muted");
    const sysWords = systemDatabase === "ok" ? p.healthOk : systemDatabase === "warn" ? p.healthWarn : systemDatabase === "fail" ? p.healthFail : p.healthUnknown;
    const sysTone = systemDatabase === "ok" ? "text-success" : systemDatabase === "warn" ? "text-warning" : systemDatabase === "fail" ? "text-danger" : "text-muted";
    const section = "flex flex-col gap-2 border-t border-border pt-4";
    const h4 = "text-sm font-semibold text-foreground";

    return (
      <div className="flex flex-col gap-5">
        <div>
          <button type="button" onClick={() => setOpenId(null)} className="min-h-11 text-sm font-medium text-primary underline md:min-h-9">
            {p.allShelters}
          </button>
        </div>
        <header className="flex flex-wrap items-center gap-3">
          <h2 className="text-xl font-semibold text-foreground">{s.name}</h2>
          {badge(st)}
          <span className="text-xs text-muted">
            <span className="font-mono">{s.key}</span> · {p.shelterCreated} {s.created_at.slice(0, 10)}
          </span>
        </header>

        {st === "closed" ? (
          <section className="flex flex-col gap-2">
            <p className="max-w-prose text-sm text-muted">{p.closedCardNote}</p>
            {canWrite && (
              <div>
                <ActionButton icon={ACTION_ICONS.add} variant="primary" compact disabled={pending} onClick={() => setArchived(s, false)}>
                  {p.reopenButton}
                </ActionButton>
              </div>
            )}
            {note(`archive:${s.id}`)}
          </section>
        ) : (
          <>
            {/* How it is doing: this shelter's own indicators first, then the system's, labelled as the system's. */}
            <section className="flex flex-col gap-2">
              <h3 className={h4}>{p.healthTitle}</h3>
              <p className="text-xs font-medium uppercase tracking-wide text-muted">{p.healthShelterPart}</p>
              <ul className="flex flex-col gap-1 text-sm">
                <li className={statusTone(s.drive_status)}>{{ not_started: p.driveNotStarted, incomplete: p.driveIncomplete, connected: p.driveConnected, dead: p.driveDead }[s.drive_status]}</li>
                <li className={statusTone(s.calendar_status)}>{{ not_started: p.calNotStarted, incomplete: p.calIncomplete, connected: p.calConnected, dead: p.calDead }[s.calendar_status]}</li>
                <li className="text-foreground">{siteWords}</li>
                <li className="text-foreground">{p.healthSetup(doneCount, steps.length)}</li>
              </ul>
              <p className="pt-1 text-xs font-medium uppercase tracking-wide text-muted">{p.healthSystemPart}</p>
              <ul className="flex flex-col gap-1 text-sm">
                <li className={sysTone}>
                  {p.healthDatabase}: {sysWords}
                </li>
              </ul>
            </section>

            <section className={section}>
              <h3 className={h4}>{p.connectionsTitle}</h3>
              <p className="max-w-prose text-xs text-muted">{p.connectionsNote}</p>
            </section>

            <section className={section}>
              <h3 className={h4}>{p.setupTitle}</h3>
              <ol className="flex flex-col gap-2">
                {steps.map((x) => (
                  <li key={x.key} className="flex flex-col gap-1">
                    <span className={`text-sm ${x.done ? "text-success" : x.key === next ? "font-semibold text-foreground" : "text-muted"}`}>
                      {x.done ? "✓ " : x.key === next ? `→ ${p.nextStep}: ` : "○ "}
                      {x.label}
                      {x.key === "login" && x.done ? ` (${emailOf(s.id)})` : ""}
                    </span>
                    {x.key === "role" && !x.done && canWrite && x.key === next && (
                      <div className="flex flex-col gap-1">
                        <div>
                          <ActionButton
                            icon={ACTION_ICONS.add}
                            variant="primary"
                            compact
                            disabled={pending}
                            onClick={() =>
                              startTransition(async () => {
                                const r = await call((id) => createShelterAdminRole(s.id, id));
                                say(`role:${s.id}`, r.ok, r.ok ? p.adminRoleGiven : (r.error ?? ""));
                              })
                            }
                          >
                            {p.giveAdminRole}
                          </ActionButton>
                        </div>
                        {note(`role:${s.id}`)}
                      </div>
                    )}
                    {x.key === "login" && !x.done && canWrite && x.key === next && (
                      <form
                        className="flex flex-col gap-1"
                        onSubmit={(ev) => {
                          ev.preventDefault();
                          startTransition(async () => {
                            const r = await call((id) => linkShelterAdmin(s.id, draft, id));
                            say(`login:${s.id}`, r.ok, r.ok ? p.adminLinked : (r.error ?? ""));
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
                            className={input}
                            autoComplete="off"
                            spellCheck={false}
                          />
                          <ActionButton icon={ACTION_ICONS.add} variant="primary" compact type="submit" disabled={pending || draft.trim() === "" || found[s.id] === false}>
                            {p.linkAdmin}
                          </ActionButton>
                        </div>
                        {found[s.id] === false && (
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm text-danger">{p.errors.noLoginForAddress}</span>
                            <ActionButton
                              icon={ACTION_ICONS.add}
                              variant="secondary"
                              compact
                              type="button"
                              disabled={pending || draft.trim() === ""}
                              onClick={() =>
                                startTransition(async () => {
                                  const r = await call((id) => createShelterAdminLogin(s.id, draft, id));
                                  say(`login:${s.id}`, r.ok, r.ok ? p.loginCreated : (r.error ?? ""));
                                  if (r.ok) {
                                    setNewLogin({ email: r.email, password: r.temporaryPassword });
                                    setEmailDrafts((d) => ({ ...d, [s.id]: "" }));
                                    setFound((f) => ({ ...f, [s.id]: null }));
                                  }
                                })
                              }
                            >
                              {p.createLogin}
                            </ActionButton>
                          </div>
                        )}
                        {found[s.id] === false && <span className="max-w-prose text-xs text-muted">{p.createLoginHelp}</span>}
                        <span className="max-w-prose text-xs text-muted">{p.linkHelp}</span>
                        {note(`login:${s.id}`)}
                      </form>
                    )}
                    {x.key === "receipts" && !x.done && x.key === next && (
                      <form
                        className="flex max-w-xl flex-col gap-2"
                        onSubmit={(ev) => {
                          ev.preventDefault();
                          const rd = receiptDrafts[s.id] ?? { series: "", name: "", address: "" };
                          startTransition(async () => {
                            const r = await call((id) => setShelterReceipts(s.id, rd.series, rd.name, rd.address, id));
                            say(`receipts:${s.id}`, r.ok, r.ok ? p.receiptsSet : (r.error ?? ""));
                            if (r.ok) setReceiptDraft(s.id, { series: "", name: "", address: "" });
                          });
                        }}
                      >
                        <span className="max-w-prose text-xs text-muted">{p.receiptsNote}</span>
                        {canWrite && (
                          <>
                            <label className="flex flex-col gap-1 text-sm">
                              {p.receiptsSeries}
                              <input value={receiptDrafts[s.id]?.series ?? ""} onChange={(e) => setReceiptDraft(s.id, { series: e.target.value })} className={`${input} font-mono uppercase`} autoComplete="off" spellCheck={false} />
                            </label>
                            <label className="flex flex-col gap-1 text-sm">
                              {p.receiptsName}
                              <input value={receiptDrafts[s.id]?.name ?? ""} onChange={(e) => setReceiptDraft(s.id, { name: e.target.value })} className={input} autoComplete="off" />
                            </label>
                            <label className="flex flex-col gap-1 text-sm">
                              {p.receiptsAddress}
                              <textarea rows={3} value={receiptDrafts[s.id]?.address ?? ""} onChange={(e) => setReceiptDraft(s.id, { address: e.target.value })} className="rounded border border-border bg-background px-3 py-2" />
                            </label>
                            <div>
                              <ActionButton
                                icon={ACTION_ICONS.add}
                                variant="primary"
                                compact
                                type="submit"
                                disabled={pending || !(receiptDrafts[s.id]?.series ?? "").trim() || !(receiptDrafts[s.id]?.name ?? "").trim() || !(receiptDrafts[s.id]?.address ?? "").trim()}
                              >
                                {p.setReceipts}
                              </ActionButton>
                            </div>
                          </>
                        )}
                        {note(`receipts:${s.id}`)}
                      </form>
                    )}
                    {x.key === "defaults" && !x.done && canWrite && (
                      <div className="flex flex-col gap-1">
                        <div>
                          <ActionButton
                            icon={ACTION_ICONS.add}
                            variant="primary"
                            compact
                            disabled={pending}
                            onClick={() =>
                              startTransition(async () => {
                                const r = await call((id) => seedShelterDefaults(s.id, id));
                                say(`seed:${s.id}`, r.ok, r.ok ? p.seeded : (r.error ?? ""));
                              })
                            }
                          >
                            {p.seedDefaults}
                          </ActionButton>
                        </div>
                        {note(`seed:${s.id}`)}
                      </div>
                    )}
                  </li>
                ))}
              </ol>
              {!s.has_site_content && (
                <div className="flex flex-col gap-1">
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
                            say(`seed-site:${s.id}`, r.ok, r.ok ? p.seeded : (r.error ?? ""));
                          })
                        }
                      >
                        {p.seedDefaults}
                      </ActionButton>
                    )}
                  </div>
                  {note(`seed-site:${s.id}`)}
                </div>
              )}
            </section>

            <section className={section}>
              <h3 className={h4}>{p.addressesTitle}</h3>
              <p className="max-w-prose text-xs text-muted">{p.addressesNote}</p>
              {s.hosts && s.hosts.length > 0 ? (
                <ul className="flex flex-col gap-2 text-sm">
                  {s.hosts.map((h) => (
                    <li key={h} className="flex flex-col gap-1">
                      <span className="flex flex-wrap items-center gap-2 break-all">
                        <span className={h === w.host ? "font-semibold text-foreground" : "text-foreground"}>{h}</span>
                        {h === w.host && <span className="text-xs text-muted">({p.websiteLabel})</span>}
                        {canWrite && h !== s.primary_host && (
                          <ActionButton
                            icon={ACTION_ICONS.add}
                            variant="secondary"
                            compact
                            disabled={pending}
                            onClick={() =>
                              startTransition(async () => {
                                const r = await call((id) => setShelterPrimaryHost(s.id, h, id));
                                say(`primary:${s.id}`, r.ok, r.ok ? p.websiteMade : (r.error ?? ""));
                              })
                            }
                          >
                            {p.makeWebsite}
                          </ActionButton>
                        )}
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
                                say(`host-rm:${s.id}`, r.ok, r.ok ? p.unmapped : (r.error ?? ""));
                              });
                            }}
                          >
                            {p.unmapHost}
                          </ActionButton>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="text-sm text-muted">{p.noHosts}</span>
              )}
              {!s.primary_host && w.host && <p className="text-xs text-muted">{p.websiteFallbackNote}</p>}
              {note(`primary:${s.id}`)}
              {note(`host-rm:${s.id}`)}
              {canWrite && (
                <form
                  className="flex flex-wrap items-center gap-2"
                  onSubmit={(ev) => {
                    ev.preventDefault();
                    startTransition(async () => {
                      const r = await call((id) => mapShelterHost(s.id, hostDrafts[s.id] ?? "", id));
                      say(`host-add:${s.id}`, r.ok, r.ok ? p.mapped : (r.error ?? ""));
                      if (r.ok) setHostDrafts((d) => ({ ...d, [s.id]: "" }));
                    });
                  }}
                >
                  <input aria-label={p.host} placeholder={p.host} value={hostDrafts[s.id] ?? ""} onChange={(e) => setHostDrafts((d) => ({ ...d, [s.id]: e.target.value }))} className={`${input} font-mono`} autoComplete="off" spellCheck={false} />
                  <ActionButton icon={ACTION_ICONS.add} variant="primary" compact type="submit" disabled={pending || (hostDrafts[s.id] ?? "").trim() === ""}>
                    {p.mapHost}
                  </ActionButton>
                </form>
              )}
              {note(`host-add:${s.id}`)}
              {canWrite && <p className="max-w-prose text-xs text-muted">{p.mapHelp}</p>}
            </section>

            <form
              className={`${section} max-w-xl`}
              onSubmit={(ev) => {
                ev.preventDefault();
                startTransition(async () => {
                  const r = await call((id) => setShelterAccountHolder(s.id, hd.name, hd.email, hd.phone, hd.location, id));
                  say(`holder:${s.id}`, r.ok, r.ok ? p.holderSaved : (r.error ?? ""));
                });
              }}
            >
              <h3 className={h4}>{p.accountHolderTitle}</h3>
              <span className="max-w-prose text-xs text-muted">{p.accountHolderNote}</span>
              {canWrite ? (
                <>
                  {(
                    [
                      ["name", p.holderName],
                      ["email", p.holderEmail],
                      ["phone", p.holderPhone],
                      ["location", p.holderLocation],
                    ] as const
                  ).map(([k, label]) => (
                    <label key={k} className="flex flex-col gap-1 text-sm">
                      {label}
                      <input value={hd[k]} onChange={(e) => setHolderDrafts((d) => ({ ...d, [s.id]: { ...hd, [k]: e.target.value } }))} className={input} autoComplete="off" />
                    </label>
                  ))}
                  <div>
                    <ActionButton icon={ACTION_ICONS.add} variant="primary" compact type="submit" disabled={pending || !hd.name.trim()}>
                      {p.saveHolder}
                    </ActionButton>
                  </div>
                </>
              ) : (
                <p className="text-sm text-foreground">{[s.account_holder_name, s.account_holder_email, s.account_holder_phone, s.account_holder_location].filter(Boolean).join(" · ") || p.noAccountHolder}</p>
              )}
              {note(`holder:${s.id}`)}
            </form>

            <form
              className={`${section} max-w-xl`}
              onSubmit={(ev) => {
                ev.preventDefault();
                const nd = nameDraft(s);
                startTransition(async () => {
                  const r = await call((id) => setShelterNames(s.id, nd.full, nd.short, id));
                  say(`names:${s.id}`, r.ok, r.ok ? p.namesSet : (r.error ?? ""));
                });
              }}
            >
              <h3 className={h4}>{p.namesTitle}</h3>
              <span className="max-w-prose text-xs text-muted">{p.namesNote}</span>
              {canWrite ? (
                <>
                  <label className="flex flex-col gap-1 text-sm">
                    {p.namesFull}
                    <input value={nameDraft(s).full} onChange={(e) => setNameDrafts((d) => ({ ...d, [s.id]: { ...nameDraft(s), full: e.target.value } }))} maxLength={120} className={input} autoComplete="off" />
                  </label>
                  <label className="flex flex-col gap-1 text-sm">
                    {p.namesShort}
                    <input value={nameDraft(s).short} onChange={(e) => setNameDrafts((d) => ({ ...d, [s.id]: { ...nameDraft(s), short: e.target.value } }))} maxLength={60} className={input} autoComplete="off" />
                  </label>
                  <div>
                    <ActionButton icon={ACTION_ICONS.add} variant="primary" compact type="submit" disabled={pending || !nameDraft(s).full.trim() || !nameDraft(s).short.trim()}>
                      {p.setNames}
                    </ActionButton>
                  </div>
                </>
              ) : (
                <p className="text-sm text-foreground">
                  {s.display_name ?? "—"} · {s.short_name ?? "—"}
                </p>
              )}
              {note(`names:${s.id}`)}
            </form>

            {canWrite && (
              <section className={section}>
                <h3 className={h4}>{p.closeTitle}</h3>
                <p className="max-w-prose text-xs text-muted">{p.closeNote}</p>
                <div>
                  <ActionButton icon={ACTION_ICONS.delete} variant="danger" compact disabled={pending} onClick={() => setArchived(s, true)}>
                    {p.closeButton}
                  </ActionButton>
                </div>
                {note(`archive:${s.id}`)}
              </section>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-8">
      {!canWrite && stepUpNotice}
      {newLogin && <TemporaryPasswordNotice email={newLogin.email} password={newLogin.password} />}

      {open ? (
        settings(open)
      ) : (
        <>
          <section className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-foreground">{p.sheltersTitle}</h2>
              {canWrite && (
                <ActionButton icon={ACTION_ICONS.add} variant="primary" compact onClick={() => setAdding((a) => !a)}>
                  {adding ? p.cancel : p.addShelter}
                </ActionButton>
              )}
            </div>

            {canWrite && adding && (
              <form
                className="flex max-w-xl flex-col gap-2 rounded-lg border border-border p-4"
                onSubmit={(ev) => {
                  ev.preventDefault();
                  startTransition(async () => {
                    const r = await call((id) => createShelter(shelterKey, shelterName, id));
                    say("create", r.ok, r.ok ? p.created(r.created) : (r.error ?? ""));
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
                  <input value={shelterKey} onChange={(e) => setShelterKey(e.target.value)} className={`${input} font-mono`} autoComplete="off" spellCheck={false} />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  {p.createName}
                  <input value={shelterName} onChange={(e) => setShelterName(e.target.value)} className={input} autoComplete="off" />
                </label>
                <div>
                  <ActionButton icon={ACTION_ICONS.add} variant="primary" type="submit" disabled={pending || shelterKey.trim() === "" || shelterName.trim() === ""}>
                    {p.create}
                  </ActionButton>
                </div>
                {note("create")}
              </form>
            )}
            {/* The create answer also shows when the form is closed, so a created shelter is never confirmed out of sight. */}
            {!adding && note("create")}

            {shelters.length === 0 && <p className="text-sm text-muted">{p.noShelters}</p>}
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{shelters.map(card)}</div>
          </section>

          {/* The enquiry queue (#shsup): a stranger's request to join, newest first. Collapsed unless something is new, so the landing stays the shelters. */}
          <details className="flex flex-col gap-2" open={newEnquiries > 0}>
            <summary className="cursor-pointer text-lg font-semibold text-foreground">
              {p.enquiries.title}
              {newEnquiries > 0 && <span className="ml-2 rounded-full border border-success px-2 py-0.5 text-xs font-medium text-success">{p.enquiries.newCount(newEnquiries)}</span>}
            </summary>
            <div className="flex flex-col gap-3 pt-2">
              {enquiries.length === 0 && <p className="text-sm text-muted">{p.enquiries.none}</p>}
              {enquiries.map(enquiryCard)}
            </div>
          </details>

          <details className="flex flex-col gap-2">
            <summary className="cursor-pointer text-lg font-semibold text-foreground">{p.adminsTitle}</summary>
            <div className="flex flex-col gap-2 pt-2">
              <ul className="flex flex-col divide-y divide-border rounded-lg border border-border">
                {admins.map((a) => (
                  <li key={a.userId} className="flex flex-col gap-1 px-3 py-2 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
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
                              say(`admin-rm:${a.userId}`, r.ok, r.ok ? p.removed : (r.error ?? ""));
                            });
                          }}
                        >
                          {p.remove}
                        </ActionButton>
                      )}
                    </div>
                    {note(`admin-rm:${a.userId}`)}
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
                      say("admin-add", r.ok, r.ok ? p.added : (r.error ?? ""));
                      if (r.ok) setAdminEmail("");
                    });
                  }}
                >
                  <h3 className="text-base font-semibold text-foreground">{p.addTitle}</h3>
                  <p className="text-sm text-muted">{p.addHelp}</p>
                  <label className="flex flex-col gap-1 text-sm">
                    {p.accountId}
                    <input type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} className={input} autoComplete="off" spellCheck={false} />
                  </label>
                  <div>
                    <ActionButton icon={ACTION_ICONS.add} variant="primary" type="submit" disabled={pending || adminEmail.trim() === ""}>
                      {p.add}
                    </ActionButton>
                  </div>
                  {note("admin-add")}
                </form>
              )}
            </div>
          </details>
        </>
      )}
    </div>
  );
}
