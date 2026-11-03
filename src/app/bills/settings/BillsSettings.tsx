"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ActionButton } from "@/components/ActionButton";
import { ACTION_ICONS } from "@/components/hub-icons";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useWriteCall } from "@/lib/use-write-form";
import {
  addKind,
  addPremises,
  renameKind,
  saveAccount,
  setAccountArchived,
  setKindArchived,
  setPremisesArchived,
  updatePremises,
} from "./actions";

export type PremisesRow = { id: string; name: string; note: string; archived: boolean };
export type AccountRow = { id: string; supplier: string; accountRef: string; note: string; premisesId: string; kindId: string; archived: boolean };
export type KindRow = { id: string; key: string; label: string; parentId: string | null; sort: number; archived: boolean };

const inputClass =
  "rounded border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40";

type Result = { ok: true } | { ok: false; error: string };

/** Runs one settings write, shows its refusal in words, and refreshes the lists on success. */
function useRun() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const run = (work: () => Promise<Result>, onDone?: () => void) =>
    startTransition(async () => {
      setError(null);
      const result = await work();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onDone?.();
      router.refresh();
    });
  return { run, pending, error };
}

type Tab = "premises" | "accounts" | "kinds";

export function BillsSettings({ premises, accounts, kinds }: { premises: PremisesRow[]; accounts: AccountRow[]; kinds: KindRow[] }) {
  const { t } = useI18n();
  const s = t.bills.settings;
  const [tab, setTab] = useState<Tab>("premises");
  const tabs: { key: Tab; label: string }[] = [
    { key: "premises", label: s.tabs.premises },
    { key: "accounts", label: s.tabs.accounts },
    { key: "kinds", label: s.tabs.kinds },
  ];
  return (
    <div className="flex flex-col gap-4">
      <div role="tablist" className="flex flex-wrap gap-2">
        {tabs.map((x) => (
          <button
            key={x.key}
            type="button"
            role="tab"
            aria-selected={tab === x.key}
            onClick={() => setTab(x.key)}
            className={`min-h-11 rounded border px-4 text-sm font-medium ${tab === x.key ? "border-primary bg-primary text-primary-foreground" : "border-border text-foreground hover:bg-surface-hover"}`}
          >
            {x.label}
          </button>
        ))}
      </div>
      {tab === "premises" && <PremisesList rows={premises} />}
      {tab === "accounts" && <AccountsList rows={accounts} premises={premises} kinds={kinds} />}
      {tab === "kinds" && <KindsList rows={kinds} />}
    </div>
  );
}

function Message({ error }: { error: string | null }) {
  return error ? (
    <p role="alert" className="text-sm text-danger">
      {error}
    </p>
  ) : null;
}

function ArchiveButton({ archived, pending, onClick }: { archived: boolean; pending: boolean; onClick: () => void }) {
  const { t } = useI18n();
  return (
    <ActionButton compact icon={archived ? ACTION_ICONS.restore : ACTION_ICONS.archive} disabled={pending} onClick={onClick}>
      {archived ? t.bills.settings.restore : t.bills.settings.archive}
    </ActionButton>
  );
}

// ---------------------------------------------------------------- premises

function PremisesList({ rows }: { rows: PremisesRow[] }) {
  const { t } = useI18n();
  const s = t.bills.settings;
  const { run, pending, error } = useRun();
  const addWrite = useWriteCall();
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  return (
    <section className="flex flex-col gap-3">
      <p className="max-w-3xl text-sm text-muted">{s.premises.hint}</p>
      <form
        className="flex flex-wrap items-end gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          run(
            () => addWrite((id) => addPremises(name, note, id)),
            () => {
              setName("");
              setNote("");
            },
          );
        }}
      >
        <label className="flex flex-col gap-1 text-sm font-medium text-muted">
          {s.premises.name}
          <input value={name} onChange={(e) => setName(e.target.value)} className={`${inputClass} w-64`} />
        </label>
        <label className="flex min-w-0 flex-1 basis-48 flex-col gap-1 text-sm font-medium text-muted">
          {s.note}
          <input value={note} onChange={(e) => setNote(e.target.value)} className={`${inputClass} w-full`} />
        </label>
        <ActionButton type="submit" variant="primary" icon={ACTION_ICONS.add} disabled={pending}>
          {s.premises.add}
        </ActionButton>
      </form>
      <Message error={error} />
      {rows.length === 0 ? (
        <p className="rounded border border-border bg-surface p-4 text-sm text-muted">{s.premises.none}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {rows.map((r) => (
            <PremisesItem key={r.id} row={r} />
          ))}
        </ul>
      )}
    </section>
  );
}

function PremisesItem({ row }: { row: PremisesRow }) {
  const { t } = useI18n();
  const s = t.bills.settings;
  const { run, pending, error } = useRun();
  const saveWrite = useWriteCall();
  const archiveWrite = useWriteCall();
  const [name, setName] = useState(row.name);
  const [note, setNote] = useState(row.note);
  return (
    <li className={`flex flex-col gap-2 rounded border border-border bg-surface p-3 ${row.archived ? "opacity-60" : ""}`}>
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm font-medium text-muted">
          {s.premises.name}
          <input value={name} onChange={(e) => setName(e.target.value)} className={`${inputClass} w-64`} />
        </label>
        <label className="flex min-w-0 flex-1 basis-48 flex-col gap-1 text-sm font-medium text-muted">
          {s.note}
          <input value={note} onChange={(e) => setNote(e.target.value)} className={`${inputClass} w-full`} />
        </label>
        <ActionButton compact icon={ACTION_ICONS.save} disabled={pending} onClick={() => run(() => saveWrite((id) => updatePremises(row.id, name, note, id)))}>
          {s.save}
        </ActionButton>
        <ArchiveButton archived={row.archived} pending={pending} onClick={() => run(() => archiveWrite((id) => setPremisesArchived(row.id, !row.archived, id)))} />
      </div>
      {row.archived && <p className="text-xs text-muted">{s.archivedNote}</p>}
      <Message error={error} />
    </li>
  );
}

// ---------------------------------------------------------------- accounts

function AccountsList({ rows, premises, kinds }: { rows: AccountRow[]; premises: PremisesRow[]; kinds: KindRow[] }) {
  const { t } = useI18n();
  const s = t.bills.settings;
  return (
    <section className="flex flex-col gap-3">
      <p className="max-w-3xl text-sm text-muted">{s.accounts.hint}</p>
      <AccountForm key="new" row={null} premises={premises} kinds={kinds} />
      {rows.length === 0 ? (
        <p className="rounded border border-border bg-surface p-4 text-sm text-muted">{s.accounts.none}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {rows.map((r) => (
            <AccountForm key={r.id} row={r} premises={premises} kinds={kinds} />
          ))}
        </ul>
      )}
    </section>
  );
}

function AccountForm({ row, premises, kinds }: { row: AccountRow | null; premises: PremisesRow[]; kinds: KindRow[] }) {
  const { t } = useI18n();
  const s = t.bills.settings;
  const { run, pending, error } = useRun();
  const saveWrite = useWriteCall();
  const archiveWrite = useWriteCall();
  const [supplier, setSupplier] = useState(row?.supplier ?? "");
  const [accountRef, setAccountRef] = useState(row?.accountRef ?? "");
  const [note, setNote] = useState(row?.note ?? "");
  const [premisesId, setPremisesId] = useState(row?.premisesId ?? "");
  const [kindId, setKindId] = useState(row?.kindId ?? "");
  const input = { supplier, accountRef, note, premisesId, kindId };
  // A retired place or kind is still shown on the account that has it, but is not offered to a new choice.
  const placeOptions = premises.filter((p) => !p.archived || p.id === premisesId);
  const kindOptions = kinds.filter((k) => !k.archived || k.id === kindId);
  const body = (
    <>
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm font-medium text-muted">
          {s.accounts.supplier}
          <input value={supplier} onChange={(e) => setSupplier(e.target.value)} className={`${inputClass} w-56`} />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-muted">
          {s.accounts.reference}
          <input value={accountRef} onChange={(e) => setAccountRef(e.target.value)} className={`${inputClass} w-44`} />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-muted">
          {s.accounts.premises}
          <select value={premisesId} onChange={(e) => setPremisesId(e.target.value)} className={`${inputClass} w-48`}>
            <option value="">{s.accounts.anyPlace}</option>
            {placeOptions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-muted">
          {s.accounts.kind}
          <select value={kindId} onChange={(e) => setKindId(e.target.value)} className={`${inputClass} w-48`}>
            <option value="">{s.accounts.anyKind}</option>
            {kindOptions.map((k) => (
              <option key={k.id} value={k.id}>
                {k.parentId ? "– " : ""}
                {k.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex min-w-0 flex-1 basis-40 flex-col gap-1 text-sm font-medium text-muted">
          {s.note}
          <input value={note} onChange={(e) => setNote(e.target.value)} className={`${inputClass} w-full`} />
        </label>
        {row ? (
          <>
            <ActionButton compact icon={ACTION_ICONS.save} disabled={pending} onClick={() => run(() => saveWrite((id) => saveAccount(row.id, input, id)))}>
              {s.save}
            </ActionButton>
            <ArchiveButton archived={row.archived} pending={pending} onClick={() => run(() => archiveWrite((id) => setAccountArchived(row.id, !row.archived, id)))} />
          </>
        ) : (
          <ActionButton
            variant="primary"
            icon={ACTION_ICONS.add}
            disabled={pending}
            onClick={() =>
              run(
                () => saveWrite((id) => saveAccount(null, input, id)),
                () => {
                  setSupplier("");
                  setAccountRef("");
                  setNote("");
                  setPremisesId("");
                  setKindId("");
                },
              )
            }
          >
            {s.accounts.add}
          </ActionButton>
        )}
      </div>
      {row?.archived && <p className="text-xs text-muted">{s.archivedNote}</p>}
      <Message error={error} />
    </>
  );
  return row ? (
    <li className={`flex flex-col gap-2 rounded border border-border bg-surface p-3 ${row.archived ? "opacity-60" : ""}`}>{body}</li>
  ) : (
    <div className="flex flex-col gap-2">{body}</div>
  );
}

// ---------------------------------------------------------------- kinds

function KindsList({ rows }: { rows: KindRow[] }) {
  const { t } = useI18n();
  const s = t.bills.settings;
  const { run, pending, error } = useRun();
  const addWrite = useWriteCall();
  const [label, setLabel] = useState("");
  const [parentId, setParentId] = useState("");
  const tops = rows.filter((k) => !k.parentId && !k.archived);
  const ordered = rows
    .filter((k) => !k.parentId)
    .flatMap((k) => [k, ...rows.filter((c) => c.parentId === k.id)]);
  return (
    <section className="flex flex-col gap-3">
      <p className="max-w-3xl text-sm text-muted">{s.kinds.hint}</p>
      <form
        className="flex flex-wrap items-end gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          run(
            () => addWrite((id) => addKind(label, parentId, id)),
            () => {
              setLabel("");
              setParentId("");
            },
          );
        }}
      >
        <label className="flex flex-col gap-1 text-sm font-medium text-muted">
          {s.kinds.label}
          <input value={label} onChange={(e) => setLabel(e.target.value)} className={`${inputClass} w-64`} />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-muted">
          {s.kinds.under}
          <select value={parentId} onChange={(e) => setParentId(e.target.value)} className={`${inputClass} w-56`}>
            <option value="">{s.kinds.topLevel}</option>
            {tops.map((k) => (
              <option key={k.id} value={k.id}>
                {k.label}
              </option>
            ))}
          </select>
        </label>
        <ActionButton type="submit" variant="primary" icon={ACTION_ICONS.add} disabled={pending}>
          {s.kinds.add}
        </ActionButton>
      </form>
      <Message error={error} />
      <ul className="flex flex-col gap-2">
        {ordered.map((k) => (
          <KindItem key={k.id} row={k} />
        ))}
      </ul>
    </section>
  );
}

function KindItem({ row }: { row: KindRow }) {
  const { t } = useI18n();
  const s = t.bills.settings;
  const { run, pending, error } = useRun();
  const saveWrite = useWriteCall();
  const archiveWrite = useWriteCall();
  const [label, setLabel] = useState(row.label);
  return (
    <li className={`flex flex-col gap-2 rounded border border-border bg-surface p-3 ${row.parentId ? "ml-6" : ""} ${row.archived ? "opacity-60" : ""}`}>
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm font-medium text-muted">
          {s.kinds.label}
          <input value={label} onChange={(e) => setLabel(e.target.value)} className={`${inputClass} w-64`} />
        </label>
        <ActionButton compact icon={ACTION_ICONS.save} disabled={pending} onClick={() => run(() => saveWrite((id) => renameKind(row.id, label, id)))}>
          {s.save}
        </ActionButton>
        <ArchiveButton archived={row.archived} pending={pending} onClick={() => run(() => archiveWrite((id) => setKindArchived(row.id, !row.archived, id)))} />
      </div>
      {row.archived && <p className="text-xs text-muted">{s.archivedNote}</p>}
      <Message error={error} />
    </li>
  );
}
